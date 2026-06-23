const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb, parseOrderRow, parseProductRow } = require('../db');
const auth = require('../middleware/auth');

router.get('/stats/summary', auth, async (req, res) => {
  try {
    const db = getDb();
    const [totalResult, statusResult, revenueResult] = await Promise.all([
      db.execute('SELECT COUNT(*) as total FROM orders'),
      db.execute('SELECT statut, COUNT(*) as count FROM orders GROUP BY statut'),
      db.execute("SELECT COALESCE(SUM(montantTotal), 0) as revenuTotal FROM orders WHERE statut != 'annule'")
    ]);

    const total = totalResult.rows[0]?.total || 0;
    const statusMap = {};
    statusResult.rows.forEach(r => { statusMap[r.statut] = r.count; });

    res.json({
      total,
      enAttente: statusMap['en_attente'] || 0,
      enPreparation: statusMap['en_preparation'] || 0,
      expedie: statusMap['expedie'] || 0,
      livre: statusMap['livre'] || 0,
      annule: statusMap['annule'] || 0,
      revenuTotal: revenueResult.rows[0]?.revenuTotal || 0
    });
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

    const fraisLivraison = 8;
    const id = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO orders (_id, produits, client, montantTotal, fraisLivraison, statut, dateCommande)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, JSON.stringify(produitsDetails), JSON.stringify(client),
        Math.round((montantTotal + fraisLivraison) * 100) / 100,
        fraisLivraison, 'en_attente', new Date().toISOString()
      ]
    });

    const result = await db.execute({ sql: 'SELECT * FROM orders WHERE _id = ?', args: [id] });
    res.status(201).json(parseOrderRow(result.rows[0]));
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
    res.json(parseOrderRow(updated.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
