const express = require('express');
const router = express.Router();
const { getDb, parseOrderRow, parseProductRow } = require('../db');
const auth = require('../middleware/auth');

const cache = new Map();
const CACHE_TTL = 60000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
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

    const productsResult = await db.execute('SELECT * FROM products');
    const ordersResult = await db.execute('SELECT * FROM orders');

    const allProducts = productsResult.rows.map(parseProductRow);
    const allOrders = ordersResult.rows.map(parseOrderRow);

    const totalProducts = allProducts.length;
    const totalOrders = allOrders.length;

    const lowStockProducts = allProducts
      .filter(function(p) { return p.quantite <= 5 && p.quantite > 0 && p.disponible; })
      .sort(function(a, b) { return a.quantite - b.quantite; })
      .slice(0, 5)
      .map(function(p) { return { nom: p.nom, quantite: p.quantite, images: p.images }; });

    var statusCounts = {};
    allOrders.forEach(function(o) { statusCounts[o.statut] = (statusCounts[o.statut] || 0) + 1; });

    var revenueLast30 = allOrders.filter(function(o) { return new Date(o.dateCommande) >= thirtyDaysAgo && o.statut !== 'annule'; });
    var currentRevenue = revenueLast30.reduce(function(s, o) { return s + o.montantTotal; }, 0);
    var currentOrders = revenueLast30.length;

    var revenuePrev30 = allOrders.filter(function(o) { return new Date(o.dateCommande) >= sixtyDaysAgo && new Date(o.dateCommande) < thirtyDaysAgo && o.statut !== 'annule'; });
    var previousRevenue = revenuePrev30.reduce(function(s, o) { return s + o.montantTotal; }, 0);
    var previousOrders = revenuePrev30.length;

    var revenueGrowth = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;
    var orderGrowth = previousOrders > 0
      ? Math.round(((currentOrders - previousOrders) / previousOrders) * 100)
      : currentOrders > 0 ? 100 : 0;
    var avgOrderValue = currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 0;

    var recentOrders = allOrders.sort(function(a, b) { return new Date(b.dateCommande) - new Date(a.dateCommande); }).slice(0, 5);

    var productSales = {};
    allOrders.filter(function(o) { return o.statut !== 'annule'; }).forEach(function(order) {
      if (!order.produits || !Array.isArray(order.produits)) return;
      order.produits.forEach(function(item) {
        var pid = item.produit;
        if (!productSales[pid]) productSales[pid] = { _id: pid, nom: item.nom, image: item.image, totalVendu: 0, totalRevenue: 0 };
        productSales[pid].totalVendu += item.quantite;
        productSales[pid].totalRevenue += item.prix * item.quantite;
      });
    });
    var topProducts = Object.values(productSales).sort(function(a, b) { return b.totalVendu - a.totalVendu; }).slice(0, 5);

    var dailyRevenue = {};
    revenueLast30.forEach(function(order) {
      var day = new Date(order.dateCommande).toISOString().split('T')[0];
      if (!dailyRevenue[day]) dailyRevenue[day] = { date: day, revenue: 0, orders: 0 };
      dailyRevenue[day].revenue += order.montantTotal;
      dailyRevenue[day].orders += 1;
    });
    var dailyRevenueLast30Days = Object.values(dailyRevenue).sort(function(a, b) { return a.date.localeCompare(b.date); });

    var customerPhones = new Set();
    allOrders.forEach(function(o) {
      if (o.client && o.client.telephone) customerPhones.add(o.client.telephone);
    });

    var result = {
      kpis: {
        totalRevenue: currentRevenue, revenueGrowth: revenueGrowth, totalOrders: totalOrders,
        activeOrders: (statusCounts['en_attente'] || 0) + (statusCounts['en_preparation'] || 0) + (statusCounts['expedie'] || 0),
        avgOrderValue: avgOrderValue, totalProducts: totalProducts, totalCustomers: customerPhones.size, lowStockCount: lowStockProducts.length
      },
      ordersByStatus: {
        en_attente: statusCounts['en_attente'] || 0, en_preparation: statusCounts['en_preparation'] || 0,
        expedie: statusCounts['expedie'] || 0, livre: statusCounts['livre'] || 0, annule: statusCounts['annule'] || 0
      },
      dailyRevenue: dailyRevenueLast30Days, recentOrders: recentOrders, topProducts: topProducts, lowStockProducts: lowStockProducts
    };

    setCache('dashboard', result);
    res.json(result);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
