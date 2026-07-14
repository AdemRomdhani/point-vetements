const express = require('express');
const router = express.Router();
const { getDb, parseOrderRow } = require('../db');

router.get('/:orderId', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.execute({ sql: 'SELECT * FROM orders WHERE _id = ?', args: [req.params.orderId] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Commande non trouvee' });

    const order = parseOrderRow(result.rows[0]);
    const statusLabels = {
      'en_attente': 'En attente de validation',
      'en_preparation': 'En preparation',
      'expedie': 'Expadie',
      'livre': 'Livre',
      'annule': 'Annule'
    };

    const history = [];
    const dateCmd = new Date(order.dateCommande);
    history.push({ statut: 'Commande passee', date: order.dateCommande, label: 'Votre commande a ete recue' });

    if (order.statut !== 'annule') {
      history.push({ statut: 'en_attente', date: order.dateCommande, label: 'En attente de validation' });

      if (['en_preparation', 'expedie', 'livre'].includes(order.statut)) {
        history.push({ statut: 'en_preparation', date: order.dateCommande, label: 'Votre commande est en preparation' });
      }
      if (['expedie', 'livre'].includes(order.statut)) {
        history.push({ statut: 'expedie', date: order.dateCommande, label: 'Votre commande a ete expediee' });
      }
      if (order.statut === 'livre') {
        history.push({ statut: 'livre', date: order.dateLivraison || order.dateCommande, label: 'Votre commande a ete livree' });
      }
    } else {
      history.push({ statut: 'annule', date: order.dateCommande, label: 'Votre commande a ete annulee' });
    }

    res.json({
      _id: order._id,
      statut: order.statut,
      statutLabel: statusLabels[order.statut] || order.statut,
      paiement_statut: order.paiement_statut,
      tracking_numero: order.tracking_numero,
      montantTotal: order.montantTotal,
      fraisLivraison: order.fraisLivraison,
      dateCommande: order.dateCommande,
      dateLivraison: order.dateLivraison,
      produits: order.produits,
      history
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/by-phone/:phone', async (req, res) => {
  try {
    const db = getDb();
    const phone = req.params.phone;
    const result = await db.execute({
      sql: "SELECT _id, statut, paiement_statut, tracking_numero, montantTotal, dateCommande, dateLivraison FROM orders WHERE json_extract(client, '$.telephone') = ? ORDER BY dateCommande DESC LIMIT 10",
      args: [phone]
    });

    const statusLabels = {
      'en_attente': 'En attente',
      'en_preparation': 'En preparation',
      'expedie': 'Expadie',
      'livre': 'Livre',
      'annule': 'Annule'
    };

    const orders = result.rows.map(r => ({
      _id: r._id,
      statut: r.statut,
      statutLabel: statusLabels[r.statut] || r.statut,
      paiement_statut: r.paiement_statut,
      tracking_numero: r.tracking_numero,
      montantTotal: r.montantTotal,
      dateCommande: r.dateCommande,
      dateLivraison: r.dateLivraison
    }));

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
