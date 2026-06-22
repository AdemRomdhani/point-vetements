const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Acces refuse. Token manquant.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'point_vetements_secret_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide ou expire.' });
  }
};

module.exports = auth;
