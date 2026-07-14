const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initDb } = require('./db');

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const configRoutes = require('./routes/config');
const reviewRoutes = require('./routes/reviews');
const trackingRoutes = require('./routes/tracking');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || '';
const ADMIN_URL = process.env.ADMIN_URL || '';

const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4201',
  'http://localhost:4202',
  FRONTEND_URL,
  ADMIN_URL
].filter(Boolean);

app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d',
  immutable: true,
  etag: true,
  lastModified: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tracking', trackingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API fonctionne' });
});

app.get('/robots.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ' + (FRONTEND_URL || 'https://pointvetements.com') + '/sitemap.xml');
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const { getDb: getDbForSitemap } = require('./db');
    const db = getDbForSitemap();
    const result = await db.execute('SELECT _id, dateAjout FROM products WHERE disponible = 1 ORDER BY dateAjout DESC');
    const baseUrl = FRONTEND_URL || 'https://pointvetements.com';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;

    result.rows.forEach(row => {
      xml += `  <url><loc>${baseUrl}/#/produit/${row._id}</loc><lastmod>${row.dateAjout ? new Date(row.dateAjout).toISOString().split('T')[0] : ''}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    });

    xml += '</urlset>';
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

const multer = require('multer');

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err.code, err.message);
    return res.status(400).json({ error: 'Erreur upload: ' + err.message });
  }
  console.error('Erreur:', err.stack || err.message || err);
  res.status(500).json({ error: err.message || 'Erreur interne du serveur' });
});

initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur demarre sur le port ${PORT}`);
  });
}).catch(err => {
  console.error('Erreur initialisation DB:', err);
  process.exit(1);
});
