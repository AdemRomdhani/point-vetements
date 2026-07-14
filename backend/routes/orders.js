const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb, parseOrderRow, parseProductRow } = require('../db');
const auth = require('../middleware/auth');
const { sendOrderConfirmation, sendStatusUpdate } = require('../email');

router.get('/stats/summary', auth, async (req, res) => {
  try {
    const db = getDb();
    const result = await db.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as enAttente,
        SUM(CASE WHEN statut = 'en_preparation' THEN 1 ELSE 0 END) as enPreparation,
        SUM(CASE WHEN statut = 'expedie' THEN 1 ELSE 0 END) as expedie,
        SUM(CASE WHEN statut = 'livre' THEN 1 ELSE 0 END) as livre,
        SUM(CASE WHEN statut = 'annule' THEN 1 ELSE 0 END) as annule,
        COALESCE(SUM(CASE WHEN statut != 'annule' THEN montantTotal ELSE 0 END), 0) as revenuTotal
      FROM orders
    `);
    const r = result.rows[0];
    res.json({ total: r.total, enAttente: r.enAttente, enPreparation: r.enPreparation, expedie: r.expedie, livre: r.livre, annule: r.annule, revenuTotal: r.revenuTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { statut, page = 1, limit = 50 } = req.query;
    const db = getDb();
    let where = [];
    let args = [];
    if (statut) { where.push('statut = ?'); args.push(statut); }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const [countResult, dataResult] = await Promise.all([
      db.execute({ sql: `SELECT COUNT(*) as total FROM orders ${whereClause}`, args }),
      db.execute({ sql: `SELECT * FROM orders ${whereClause} ORDER BY dateCommande DESC LIMIT ? OFFSET ?`, args: [...args, limitNum, offset] })
    ]);

    const total = countResult.rows[0].total;
    const orders = dataResult.rows.map(parseOrderRow);

    res.json({
      data: orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const db = getDb();
    const result = await db.execute({ sql: 'SELECT * FROM orders WHERE _id = ?', args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Commande non trouvee' });
    res.json(parseOrderRow(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { produits, client } = req.body;

    if (!produits || !Array.isArray(produits) || produits.length === 0) {
      return res.status(400).json({ error: 'Aucun produit dans la commande' });
    }
    if (!client || !client.nom || !client.telephone) {
      return res.status(400).json({ error: 'Informations client requises' });
    }

    const productIds = produits.map(item => item.produit);
    const placeholders = productIds.map(() => '?').join(',');
    const productsResult = await db.execute({ sql: `SELECT * FROM products WHERE _id IN (${placeholders})`, args: productIds });
    const products = productsResult.rows.map(parseProductRow);
    const productMap = new Map(products.map(p => [p._id, p]));

    let montantTotal = 0;
    const produitsDetails = [];

    for (const item of produits) {
      const product = productMap.get(item.produit);
      if (!product) return res.status(404).json({ error: `Produit ${item.produit} non trouve` });
      if (product.quantite < item.quantite) {
        return res.status(400).json({ error: `Stock insuffisant pour ${product.nom}` });
      }

      const prixUnitaire = product.promotions > 0
        ? product.prix * (1 - product.promotions / 100)
        : product.prix;

      produitsDetails.push({
        produit: product._id,
        nom: product.nom,
        taille: item.taille,
        couleur: item.couleur || '',
        quantite: item.quantite,
        prix: prixUnitaire,
        image: (product.images && product.images[0]) || ''
      });

      montantTotal += prixUnitaire * item.quantite;

      await db.execute({
        sql: 'UPDATE products SET quantite = quantite - ? WHERE _id = ? AND quantite >= ?',
        args: [item.quantite, item.produit, item.quantite]
      });
    }

    let fraisLivraison = 8;
    try {
      const configResult = await db.execute({ sql: "SELECT valeur FROM config WHERE cle = 'fraisLivraison'", args: [] });
      if (configResult.rows.length > 0) fraisLivraison = parseFloat(configResult.rows[0].valeur) || 8;
    } catch {}

    const id = crypto.randomUUID();
    const trackingNumero = 'PV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    await db.execute({
      sql: `INSERT INTO orders (_id, produits, client, montantTotal, fraisLivraison, statut, paiement_statut, tracking_numero, dateCommande)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, JSON.stringify(produitsDetails), JSON.stringify(client),
        Math.round((montantTotal + fraisLivraison) * 100) / 100,
        fraisLivraison, 'en_attente', 'en_attente', trackingNumero, new Date().toISOString()
      ]
    });

    const result = await db.execute({ sql: 'SELECT * FROM orders WHERE _id = ?', args: [id] });
    const order = parseOrderRow(result.rows[0]);

    sendOrderConfirmation(order, {}).catch(() => {});

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/statut', auth, async (req, res) => {
  try {
    const db = getDb();
    const { statut } = req.body;
    const validStatuts = ['en_attente', 'en_preparation', 'expedie', 'livre', 'annule'];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const result = await db.execute({ sql: 'SELECT * FROM orders WHERE _id = ?', args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Commande non trouvee' });

    const order = parseOrderRow(result.rows[0]);
    const oldStatus = order.statut;

    if (statut === 'annule' && order.statut !== 'annule') {
      for (const item of order.produits) {
        await db.execute({
          sql: 'UPDATE products SET quantite = quantite + ? WHERE _id = ?',
          args: [item.quantite, item.produit]
        });
      }
    }

    const dateLivraison = statut === 'livre' ? new Date().toISOString() : null;
    await db.execute({
      sql: 'UPDATE orders SET statut = ?, dateLivraison = COALESCE(?, dateLivraison) WHERE _id = ?',
      args: [statut, dateLivraison, req.params.id]
    });

    const updated = await db.execute({ sql: 'SELECT * FROM orders WHERE _id = ?', args: [req.params.id] });
    const updatedOrder = parseOrderRow(updated.rows[0]);

    sendStatusUpdate(updatedOrder, oldStatus, statut).catch(() => {});

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/paiement', auth, async (req, res) => {
  try {
    const db = getDb();
    const { paiement_statut } = req.body;
    const validStatuts = ['en_attente', 'paye', 'rembourse', 'echoue'];
    if (!validStatuts.includes(paiement_statut)) {
      return res.status(400).json({ error: 'Statut de paiement invalide' });
    }

    await db.execute({ sql: 'UPDATE orders SET paiement_statut = ? WHERE _id = ?', args: [paiement_statut, req.params.id] });
    const result = await db.execute({ sql: 'SELECT * FROM orders WHERE _id = ?', args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Commande non trouvee' });
    res.json(parseOrderRow(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/tracking', auth, async (req, res) => {
  try {
    const db = getDb();
    const { tracking_numero } = req.body;
    await db.execute({ sql: 'UPDATE orders SET tracking_numero = ? WHERE _id = ?', args: [tracking_numero || '', req.params.id] });
    const result = await db.execute({ sql: 'SELECT * FROM orders WHERE _id = ?', args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Commande non trouvee' });
    res.json(parseOrderRow(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const db = getDb();
    const result = await db.execute({ sql: 'SELECT * FROM orders WHERE _id = ?', args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Commande non trouvee' });

    await db.execute({ sql: 'DELETE FROM orders WHERE _id = ?', args: [req.params.id] });
    res.json({ message: 'Commande supprimee' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
