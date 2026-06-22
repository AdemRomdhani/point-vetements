const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@pointvetements.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'point_vetements_secret_key_2026';

let adminHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    if (email !== ADMIN_EMAIL || !bcrypt.compareSync(password, adminHash)) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, email, role: 'admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ valid: false });
  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
