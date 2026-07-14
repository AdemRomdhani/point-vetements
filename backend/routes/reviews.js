const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb } = require('../db');
const auth = require('../middleware/auth');

router.get('/product/:productId', async (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const [countResult, dataResult, avgResult] = await Promise.all([
      db.execute({ sql: 'SELECT COUNT(*) as total FROM reviews WHERE produit_id = ?', args: [req.params.productId] }),
      db.execute({ sql: 'SELECT * FROM reviews WHERE produit_id = ? ORDER BY dateReview DESC LIMIT ? OFFSET ?', args: [req.params.productId, limitNum, offset] }),
      db.execute({ sql: "SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count FROM reviews WHERE produit_id = ?", args: [req.params.productId] })
    ]);

    const total = countResult.rows[0].total;

    res.json({
      data: dataResult.rows,
      stats: {
        avgRating: Math.round(avgResult.rows[0].avg_rating * 10) / 10,
        totalReviews: avgResult.rows[0].review_count
      },
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    console.error('Reviews fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { produit_id, nom, prenom, email, rating, commentaire } = req.body;

    if (!produit_id || !nom || !rating) {
      return res.status(400).json({ error: 'produit_id, nom et rating sont requis' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Le rating doit etre entre 1 et 5' });
    }

    const db = getDb();
    const id = crypto.randomUUID();

    await db.execute({
      sql: 'INSERT INTO reviews (_id, produit_id, nom, prenom, email, rating, commentaire, approuve, dateReview) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, produit_id, nom, prenom || '', email || '', parseInt(rating), commentaire || '', 1, new Date().toISOString()]
    });

    const result = await db.execute({ sql: 'SELECT * FROM reviews WHERE _id = ?', args: [id] });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Review create error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const db = getDb();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const [countResult, dataResult] = await Promise.all([
      db.execute({ sql: 'SELECT COUNT(*) as total FROM reviews', args: [] }),
      db.execute({ sql: 'SELECT * FROM reviews ORDER BY dateReview DESC LIMIT ? OFFSET ?', args: [limitNum, offset] })
    ]);

    res.json({
      data: dataResult.rows,
      pagination: { page: pageNum, limit: limitNum, total: countResult.rows[0].total, pages: Math.ceil(countResult.rows[0].total / limitNum) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM reviews WHERE _id = ?', args: [req.params.id] });
    res.json({ message: 'Review supprimee' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
