const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const auth = require('../middleware/auth');

const configCache = new Map();
const CONFIG_CACHE_TTL = 300000;

router.get('/', async (req, res) => {
  try {
    const cached = configCache.get('all');
    if (cached && Date.now() - cached.ts < CONFIG_CACHE_TTL) {
      return res.json(cached.data);
    }

    const db = getDb();
    const result = await db.execute('SELECT * FROM config');
    const config = {};
    result.rows.forEach(r => { config[r.cle] = r.valeur; });

    configCache.set('all', { data: config, ts: Date.now() });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.execute({ sql: 'SELECT valeur FROM config WHERE cle = ?', args: [req.params.key] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Config non trouvee' });
    res.json({ cle: req.params.key, valeur: result.rows[0].valeur });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:key', auth, async (req, res) => {
  try {
    const { valeur } = req.body;
    if (!valeur && valeur !== '') return res.status(400).json({ error: 'Valeur requise' });

    const db = getDb();
    await db.execute({ sql: 'INSERT OR REPLACE INTO config (cle, valeur) VALUES (?, ?)', args: [req.params.key, String(valeur)] });
    configCache.delete('all');
    res.json({ cle: req.params.key, valeur: String(valeur) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
