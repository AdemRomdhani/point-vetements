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
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString();

    const [totalProductsResult, totalOrdersResult, statusCountsResult, revenueCurrentResult, revenuePrevResult, lowStockResult, recentOrdersResult, customerCountResult] = await Promise.all([
      db.execute('SELECT COUNT(*) as total FROM products'),
      db.execute('SELECT COUNT(*) as total FROM orders'),
      db.execute('SELECT statut, COUNT(*) as count FROM orders GROUP BY statut'),
      db.execute({ sql: 'SELECT COALESCE(SUM(montantTotal), 0) as revenue, COUNT(*) as orders FROM orders WHERE dateCommande >= ? AND statut != ?', args: [thirtyDaysAgoStr, 'annule'] }),
      db.execute({ sql: 'SELECT COALESCE(SUM(montantTotal), 0) as revenue, COUNT(*) as orders FROM orders WHERE dateCommande >= ? AND dateCommande < ? AND statut != ?', args: [sixtyDaysAgoStr, thirtyDaysAgoStr, 'annule'] }),
      db.execute({ sql: 'SELECT nom, quantite, images FROM products WHERE quantite <= 5 AND quantite > 0 AND disponible = 1 ORDER BY quantite ASC LIMIT 5' }),
      db.execute({ sql: 'SELECT _id, produits, client, montantTotal, fraisLivraison, statut, dateCommande, dateLivraison, notes FROM orders ORDER BY dateCommande DESC LIMIT 5' }),
      db.execute('SELECT COUNT(DISTINCT json_extract(client, "$.telephone")) as total FROM orders WHERE json_extract(client, "$.telephone") IS NOT NULL')
    ]);

    const totalProducts = totalProductsResult.rows[0]?.total || 0;
    const totalOrders = totalOrdersResult.rows[0]?.total || 0;

    const statusMap = {};
    statusCountsResult.rows.forEach(r => { statusMap[r.statut] = r.count; });

    const currentRevenue = revenueCurrentResult.rows[0]?.revenue || 0;
    const currentOrders = revenueCurrentResult.rows[0]?.orders || 0;
    const previousRevenue = revenuePrevResult.rows[0]?.revenue || 0;
    const previousOrders = revenuePrevResult.rows[0]?.orders || 0;

    const revenueGrowth = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;
    const orderGrowth = previousOrders > 0
      ? Math.round(((currentOrders - previousOrders) / previousOrders) * 100)
      : currentOrders > 0 ? 100 : 0;
    const avgOrderValue = currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 0;

    const recentOrders = recentOrdersResult.rows.map(parseOrderRow);

    const lowStockProducts = lowStockResult.rows.map(r => ({
      nom: r.nom, quantite: r.quantite, images: (() => { try { return JSON.parse(r.images); } catch { return []; } })()
    }));

    const productSales = {};
    const allOrdersForTop = (await db.execute({ sql: 'SELECT produits FROM orders WHERE statut != ?', args: ['annule'] })).rows;
    allOrdersForTop.forEach(order => {
      const produits = (() => { try { return JSON.parse(order.produits); } catch { return []; } })();
      produits.forEach(item => {
        const pid = item.produit;
        if (!productSales[pid]) productSales[pid] = { _id: pid, nom: item.nom, image: item.image, totalVendu: 0, totalRevenue: 0 };
        productSales[pid].totalVendu += item.quantite;
        productSales[pid].totalRevenue += item.prix * item.quantite;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.totalVendu - a.totalVendu).slice(0, 5);

    const dailyRevenueRows = (await db.execute({
      sql: 'SELECT date(dateCommande) as day, SUM(montantTotal) as revenue, COUNT(*) as orders FROM orders WHERE dateCommande >= ? AND statut != ? GROUP BY date(dateCommande) ORDER BY day ASC',
      args: [thirtyDaysAgoStr, 'annule']
    })).rows;
    const dailyRevenueLast30Days = dailyRevenueRows.map(r => ({ date: r.day, revenue: r.revenue, orders: r.orders }));

    const result = {
      kpis: {
        totalRevenue: currentRevenue, revenueGrowth, totalOrders,
        activeOrders: (statusMap['en_attente'] || 0) + (statusMap['en_preparation'] || 0) + (statusMap['expedie'] || 0),
        avgOrderValue, totalProducts, totalCustomers: customerCountResult.rows[0]?.total || 0, lowStockCount: lowStockProducts.length
      },
      ordersByStatus: {
        en_attente: statusMap['en_attente'] || 0, en_preparation: statusMap['en_preparation'] || 0,
        expedie: statusMap['expedie'] || 0, livre: statusMap['livre'] || 0, annule: statusMap['annule'] || 0
      },
      dailyRevenue: dailyRevenueLast30Days, recentOrders, topProducts, lowStockProducts
    };

    setCache('dashboard', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
