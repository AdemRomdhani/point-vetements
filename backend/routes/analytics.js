const express = require('express');
const router = express.Router();
const { getDb, parseOrderRow, parseProductRow } = require('../db');
const auth = require('../middleware/auth');

const cache = new Map();
const CACHE_TTL = 60000;
const MAX_CACHE_SIZE = 50;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { data, ts: Date.now() });
}

router.get('/dashboard', auth, async (req, res) => {
  try {
    const cached = getCached('dashboard');
    if (cached) return res.json(cached);

    const db = getDb();
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [
      totalProductsResult,
      totalOrdersResult,
      lowStockResult,
      statusCountsResult,
      currentRevenueResult,
      previousRevenueResult,
      recentOrdersResult,
      topProductsResult,
      dailyRevenueResult,
      customersResult
    ] = await Promise.all([
      db.execute('SELECT COUNT(*) as total FROM products'),
      db.execute('SELECT COUNT(*) as total FROM orders'),
      db.execute({ sql: 'SELECT nom, quantite, images FROM products WHERE quantite <= 5 AND quantite > 0 AND disponible = 1 ORDER BY quantite ASC LIMIT 5', args: [] }),
      db.execute({ sql: "SELECT statut, COUNT(*) as count FROM orders GROUP BY statut", args: [] }),
      db.execute({ sql: "SELECT COALESCE(SUM(montantTotal), 0) as revenue, COUNT(*) as count FROM orders WHERE dateCommande >= ? AND statut != 'annule'", args: [thirtyDaysAgo.toISOString()] }),
      db.execute({ sql: "SELECT COALESCE(SUM(montantTotal), 0) as revenue, COUNT(*) as count FROM orders WHERE dateCommande >= ? AND dateCommande < ? AND statut != 'annule'", args: [sixtyDaysAgo.toISOString(), thirtyDaysAgo.toISOString()] }),
      db.execute({ sql: "SELECT * FROM orders ORDER BY dateCommande DESC LIMIT 5", args: [] }),
      db.execute({ sql: "SELECT produit_id, nom, image, SUM(quantite) as totalVendu, SUM(prix * quantite) as totalRevenue FROM (SELECT json_extract(value, '$.produit') as produit_id, json_extract(value, '$.nom') as nom, json_extract(value, '$.image') as image, json_extract(value, '$.quantite') as quantite, json_extract(value, '$.prix') as prix FROM orders, json_each(produits) WHERE statut != 'annule') GROUP BY produit_id ORDER BY totalVendu DESC LIMIT 5", args: [] }),
      db.execute({ sql: "SELECT date(dateCommande) as day, SUM(montantTotal) as revenue, COUNT(*) as orders FROM orders WHERE dateCommande >= ? AND statut != 'annule' GROUP BY date(dateCommande) ORDER BY day ASC", args: [thirtyDaysAgo.toISOString()] }),
      db.execute({ sql: "SELECT COUNT(DISTINCT json_extract(client, '$.telephone')) as total FROM orders WHERE json_extract(client, '$.telephone') != ''", args: [] })
    ]);

    const totalProducts = totalProductsResult.rows[0].total;
    const totalOrders = totalOrdersResult.rows[0].total;

    const lowStockProducts = lowStockResult.rows.map(r => ({
      nom: r.nom,
      quantite: r.quantite,
      images: typeof r.images === 'string' ? JSON.parse(r.images || '[]') : r.images || []
    }));

    const statusCounts = {};
    statusCountsResult.rows.forEach(r => { statusCounts[r.statut] = r.count; });

    const currentRevenue = currentRevenueResult.rows[0].revenue;
    const currentOrders = currentRevenueResult.rows[0].count;
    const previousRevenue = previousRevenueResult.rows[0].revenue;
    const previousOrders = previousRevenueResult.rows[0].count;

    const revenueGrowth = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;
    const orderGrowth = previousOrders > 0
      ? Math.round(((currentOrders - previousOrders) / previousOrders) * 100)
      : currentOrders > 0 ? 100 : 0;
    const avgOrderValue = currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 0;

    const recentOrders = recentOrdersResult.rows.map(parseOrderRow);
    const topProducts = topProductsResult.rows;
    const dailyRevenueLast30Days = dailyRevenueResult.rows.map(r => ({
      date: r.day,
      revenue: r.revenue,
      orders: r.orders
    }));
    const totalCustomers = customersResult.rows[0].total;

    const result = {
      kpis: {
        totalRevenue: currentRevenue, revenueGrowth, totalOrders,
        activeOrders: (statusCounts['en_attente'] || 0) + (statusCounts['en_preparation'] || 0) + (statusCounts['expedie'] || 0),
        avgOrderValue, totalProducts, totalCustomers, lowStockCount: lowStockProducts.length
      },
      ordersByStatus: {
        en_attente: statusCounts['en_attente'] || 0, en_preparation: statusCounts['en_preparation'] || 0,
        expedie: statusCounts['expedie'] || 0, livre: statusCounts['livre'] || 0, annule: statusCounts['annule'] || 0
      },
      dailyRevenue: dailyRevenueLast30Days, recentOrders, topProducts, lowStockProducts
    };

    setCache('dashboard', result);
    res.json(result);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
