const express = require('express');
const router = express.Router();
const { getDb, parseOrderRow, parseProductRow } = require('../db');
const auth = require('../middleware/auth');

router.get('/dashboard', auth, async (req, res) => {
  try {
    const db = getDb();
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [productsResult, ordersResult] = await Promise.all([
      db.execute('SELECT * FROM products'),
      db.execute('SELECT * FROM orders')
    ]);

    const allProducts = productsResult.rows.map(parseProductRow);
    const allOrders = ordersResult.rows.map(parseOrderRow);

    const totalProducts = allProducts.length;
    const totalOrders = allOrders.length;

    const lowStockProducts = allProducts
      .filter(p => p.quantite <= 5 && p.quantite > 0 && p.disponible)
      .sort((a, b) => a.quantite - b.quantite)
      .slice(0, 5)
      .map(p => ({ nom: p.nom, quantite: p.quantite, images: p.images }));

    const statusCounts = {};
    allOrders.forEach(o => { statusCounts[o.statut] = (statusCounts[o.statut] || 0) + 1; });

    const revenueLast30 = allOrders.filter(o => new Date(o.dateCommande) >= thirtyDaysAgo && o.statut !== 'annule');
    const currentRevenue = revenueLast30.reduce((s, o) => s + o.montantTotal, 0);
    const currentOrders = revenueLast30.length;

    const revenuePrev30 = allOrders.filter(o => new Date(o.dateCommande) >= sixtyDaysAgo && new Date(o.dateCommande) < thirtyDaysAgo && o.statut !== 'annule');
    const previousRevenue = revenuePrev30.reduce((s, o) => s + o.montantTotal, 0);
    const previousOrders = revenuePrev30.length;

    const revenueGrowth = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;
    const orderGrowth = previousOrders > 0
      ? Math.round(((currentOrders - previousOrders) / previousOrders) * 100)
      : currentOrders > 0 ? 100 : 0;
    const avgOrderValue = currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 0;

    const recentOrders = allOrders.sort((a, b) => new Date(b.dateCommande) - new Date(a.dateCommande)).slice(0, 5);

    const productSales = {};
    allOrders.filter(o => o.statut !== 'annule').forEach(order => {
      order.produits.forEach(item => {
        const pid = item.produit;
        if (!productSales[pid]) productSales[pid] = { _id: pid, nom: item.nom, image: item.image, totalVendu: 0, totalRevenue: 0 };
        productSales[pid].totalVendu += item.quantite;
        productSales[pid].totalRevenue += item.prix * item.quantite;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.totalVendu - a.totalVendu).slice(0, 5);

    const dailyRevenue = {};
    revenueLast30.forEach(order => {
      const day = new Date(order.dateCommande).toISOString().split('T')[0];
      if (!dailyRevenue[day]) dailyRevenue[day] = { date: day, revenue: 0, orders: 0 };
      dailyRevenue[day].revenue += order.montantTotal;
      dailyRevenue[day].orders += 1;
    });
    const dailyRevenueLast30Days = Object.values(dailyRevenue).sort((a, b) => a.date.localeCompare(b.date));

    const customerPhones = new Set(allOrders.map(o => o.client && o.client.telephone).filter(Boolean));

    res.json({
      kpis: {
        totalRevenue: currentRevenue, revenueGrowth, totalOrders,
        activeOrders: (statusCounts['en_attente'] || 0) + (statusCounts['en_preparation'] || 0) + (statusCounts['expedie'] || 0),
        avgOrderValue, totalProducts, totalCustomers: customerPhones.size, lowStockCount: lowStockProducts.length
      },
      ordersByStatus: {
        en_attente: statusCounts['en_attente'] || 0, en_preparation: statusCounts['en_preparation'] || 0,
        expedie: statusCounts['expedie'] || 0, livre: statusCounts['livre'] || 0, annule: statusCounts['annule'] || 0
      },
      dailyRevenue: dailyRevenueLast30Days, recentOrders, topProducts, lowStockProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
