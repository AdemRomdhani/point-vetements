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
      paiement_statut TEXT DEFAULT 'en_attente',
      dateCommande TEXT NOT NULL,
      dateLivraison TEXT,
      notes TEXT DEFAULT '',
      tracking_numero TEXT DEFAULT ''
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS product_variants (
      _id TEXT PRIMARY KEY,
      produit_id TEXT NOT NULL,
      taille TEXT NOT NULL,
      couleur TEXT DEFAULT '',
      quantite INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (produit_id) REFERENCES products(_id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      _id TEXT PRIMARY KEY,
      produit_id TEXT NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT DEFAULT '',
      email TEXT DEFAULT '',
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      commentaire TEXT DEFAULT '',
      approuve INTEGER DEFAULT 0,
      dateReview TEXT NOT NULL,
      FOREIGN KEY (produit_id) REFERENCES products(_id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS config (
      cle TEXT PRIMARY KEY,
      valeur TEXT NOT NULL
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
  await client.execute('CREATE INDEX IF NOT EXISTS idx_variants_produit ON product_variants(produit_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_variants_taille_couleur ON product_variants(taille, couleur)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_reviews_produit ON reviews(produit_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)');

  const configExists = await client.execute("SELECT COUNT(*) as c FROM config WHERE cle = 'fraisLivraison'");
  if (configExists.rows[0].c === 0) {
    await client.execute({ sql: "INSERT INTO config (cle, valeur) VALUES (?, ?)", args: ['fraisLivraison', '8'] });
    await client.execute({ sql: "INSERT INTO config (cle, valeur) VALUES (?, ?)", args: ['nomBoutique', 'Point Vetements'] });
    await client.execute({ sql: "INSERT INTO config (cle, valeur) VALUES (?, ?)", args: ['emailContact', 'contact@pointvetements.com'] });
  }

  try { await client.execute("ALTER TABLE orders ADD COLUMN paiement_statut TEXT DEFAULT 'en_attente'"); } catch {}
  try { await client.execute("ALTER TABLE orders ADD COLUMN tracking_numero TEXT DEFAULT ''"); } catch {}
  try { await client.execute("ALTER TABLE reviews ADD COLUMN approuve INTEGER DEFAULT 1"); } catch {}
  try { await client.execute("UPDATE reviews SET approuve = 1 WHERE approuve = 0"); } catch {}

  console.log('Base de donnees initialisee avec index');
}

function parseJsonField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try { return JSON.parse(field); } catch { return []; }
}

function parseOrderRow(row) {
  if (!row) return null;
  let parsedClient = row.client;
  if (typeof row.client === 'string') {
    try { parsedClient = JSON.parse(row.client); } catch { parsedClient = { nom: '', prenom: '', telephone: '', adresse: '' }; }
  }
  return {
    ...row,
    produits: parseJsonField(row.produits),
    client: parsedClient || { nom: '', prenom: '', telephone: '', adresse: '' },
    paiement_statut: row.paiement_statut || 'en_attente',
    tracking_numero: row.tracking_numero || ''
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

module.exports = { getDb, initDb, parseProductRow, parseOrderRow, parseJsonField };
