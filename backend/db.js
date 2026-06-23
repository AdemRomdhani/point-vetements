const { createClient } = require('@libsql/client');

let db;

function getDb() {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN || undefined
    });
  }
  return db;
}

async function initDb() {
  const client = getDb();

  await client.execute(`
    CREATE TABLE IF NOT EXISTS products (
      _id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      description TEXT DEFAULT '',
      prix REAL NOT NULL,
      categorie TEXT NOT NULL,
      marque TEXT DEFAULT '',
      sexe TEXT DEFAULT 'unisexe',
      typeVetement TEXT DEFAULT '',
      matiere TEXT DEFAULT '',
      couleur TEXT DEFAULT '',
      couleurs TEXT DEFAULT '[]',
      saison TEXT DEFAULT 'toutes',
      tailles TEXT DEFAULT '[]',
      quantite INTEGER NOT NULL DEFAULT 0,
      images TEXT DEFAULT '[]',
      disponible INTEGER DEFAULT 1,
      promotions INTEGER DEFAULT 0,
      dateAjout TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      _id TEXT PRIMARY KEY,
      produits TEXT NOT NULL,
      client TEXT NOT NULL,
      montantTotal REAL NOT NULL,
      fraisLivraison REAL DEFAULT 8,
      statut TEXT DEFAULT 'en_attente',
      dateCommande TEXT NOT NULL,
      dateLivraison TEXT,
      notes TEXT DEFAULT ''
    )
  `);

  await client.execute('CREATE INDEX IF NOT EXISTS idx_products_categorie ON products(categorie)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_products_sexe ON products(sexe)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_products_marque ON products(marque)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_products_disponible ON products(disponible)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_products_promotions ON products(promotions)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_products_dateAjout ON products(dateAjout)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_products_nom ON products(nom)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_orders_statut ON orders(statut)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_orders_dateCommande ON orders(dateCommande)');

  console.log('Base de donnees initialisee avec index');
}

function parseJsonField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try { return JSON.parse(field); } catch { return []; }
}

function parseOrderRow(row) {
  if (!row) return null;
  return {
    ...row,
    produits: parseJsonField(row.produits),
    client: typeof row.client === 'string' ? JSON.parse(row.client) : row.client
  };
}

function parseProductRow(row) {
  if (!row) return null;
  return {
    ...row,
    tailles: parseJsonField(row.tailles),
    couleurs: parseJsonField(row.couleurs),
    images: parseJsonField(row.images),
    disponible: row.disponible === 1 || row.disponible === true
  };
}

module.exports = { getDb, initDb, parseProductRow, parseOrderRow };
