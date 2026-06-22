const crypto = require('crypto');
require('dotenv').config();
const { getDb, initDb, parseProductRow } = require('./db');

const sampleProducts = [
  { nom: "T-shirt Classique Homme", description: "T-shirt en coton premium, coupe reguliere.", prix: 89.99, categorie: "homme", marque: "Zara", sexe: "homme", typeVetement: "T-shirt", matiere: "Coton 100%", couleur: "Noir", saison: "toutes", tailles: ["S","M","L","XL","XXL"], quantite: 25, images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop"], disponible: 1, promotions: 0 },
  { nom: "Robe d'Ete Fleurie", description: "Robe legere et fluide, imprime floral.", prix: 149.99, categorie: "femme", marque: "H&M", sexe: "femme", typeVetement: "Robe", matiere: "Viscose", couleur: "Multicolore", saison: "ete", tailles: ["XS","S","M","L","XL"], quantite: 18, images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&h=600&fit=crop"], disponible: 1, promotions: 15 },
  { nom: "Jean Slim Homme", description: "Jean slim fit, elastane pour plus de confort.", prix: 199.99, categorie: "homme", marque: "Levi's", sexe: "homme", typeVetement: "Pantalon", matiere: "Denim", couleur: "Bleu marine", saison: "toutes", tailles: ["S","M","L","XL","XXL","XXXL"], quantite: 30, images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop"], disponible: 1, promotions: 0 },
  { nom: "Baskets Sport Unisexe", description: "Baskets confortables pour le sport et le quotidien.", prix: 129.99, categorie: "chaussure", marque: "Nike", sexe: "unisexe", typeVetement: "Chaussures", matiere: "Synthetique", couleur: "Blanc", saison: "toutes", tailles: ["S","M","L","XL","XXL"], quantite: 40, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop"], disponible: 1, promotions: 20 },
  { nom: "Pull en Laine Femme", description: "Pull doux et chaud en laine merinos.", prix: 179.99, categorie: "femme", marque: "Mango", sexe: "femme", typeVetement: "Pull", matiere: "Laine Merinos", couleur: "Beige", saison: "automne", tailles: ["XS","S","M","L"], quantite: 12, images: ["https://images.unsplash.com/photo-1434389677669-e08b4cda3a0a?w=500&h=600&fit=crop"], disponible: 1, promotions: 0 },
  { nom: "Veste en Cuir Homme", description: "Veste en cuir véritable, doublure interieure.", prix: 349.99, categorie: "homme", marque: "Bershka", sexe: "homme", typeVetement: "Veste", matiere: "Cuir", couleur: "Noir", saison: "automne", tailles: ["M","L","XL","XXL"], quantite: 8, images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop"], disponible: 1, promotions: 10 },
  { nom: "Sac a Main Femme", description: "Sac elegant en cuir synthetique.", prix: 79.99, categorie: "accessoire", marque: "Primark", sexe: "femme", typeVetement: "Sac", matiere: "Cuir synthetique", couleur: "Marron", saison: "toutes", tailles: [], quantite: 22, images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=600&fit=crop"], disponible: 1, promotions: 0 },
  { nom: "Chaussures Running Enfant", description: "Chaussures sport leggeres pour enfants.", prix: 59.99, categorie: "chaussure", marque: "Adidas", sexe: "unisexe", typeVetement: "Chaussures", matiere: "Synthetique", couleur: "Bleu", saison: "toutes", tailles: ["XS","S","M","L"], quantite: 35, images: ["https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500&h=600&fit=crop"], disponible: 1, promotions: 25 },
  { nom: "Short Sport Homme", description: "Short de sport en tissu technique.", prix: 49.99, categorie: "homme", marque: "Decathlon", sexe: "homme", typeVetement: "Short", matiere: "Polyester", couleur: "Gris", saison: "ete", tailles: ["S","M","L","XL","XXL"], quantite: 45, images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=600&fit=crop"], disponible: 1, promotions: 0 },
  { nom: "Pantalon Wide Leg Femme", description: "Pantalon coupe large, tres confortable.", prix: 119.99, categorie: "femme", marque: "Stradivarius", sexe: "femme", typeVetement: "Pantalon", matiere: "Crepe", couleur: "Noir", saison: "toutes", tailles: ["XS","S","M","L","XL"], quantite: 20, images: ["https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&h=600&fit=crop"], disponible: 1, promotions: 5 },
  { nom: "Echarpe en Laine", description: "Echarpe douce et chaude en laine.", prix: 39.99, categorie: "accessoire", marque: "Uniqlo", sexe: "unisexe", typeVetement: "Accessoire", matiere: "Laine", couleur: "Rouge", saison: "hiver", tailles: [], quantite: 50, images: ["https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=500&h=600&fit=crop"], disponible: 1, promotions: 0 },
  { nom: "Sneakers Enfant", description: "Sneakers colorees pour enfants.", prix: 44.99, categorie: "chaussure", marque: "Puma", sexe: "unisexe", typeVetement: "Chaussures", matiere: "Toile", couleur: "Rose", saison: "toutes", tailles: ["XS","S","M"], quantite: 28, images: ["https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=500&h=600&fit=crop"], disponible: 1, promotions: 0 }
];

async function seed() {
  try {
    await initDb();
    const db = getDb();

    await db.execute('DELETE FROM products');
    console.log('Anciens produits supprimes');

    for (const p of sampleProducts) {
      const id = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO products (_id, nom, description, prix, categorie, marque, sexe, typeVetement, matiere, couleur, couleurs, saison, tailles, quantite, images, disponible, promotions, dateAjout)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, p.nom, p.description, p.prix, p.categorie, p.marque, p.sexe,
          p.typeVetement, p.matiere, p.couleur, '[]', p.saison,
          JSON.stringify(p.tailles), p.quantite, JSON.stringify(p.images),
          p.disponible, p.promotions, new Date().toISOString()
        ]
      });
    }
    console.log(`${sampleProducts.length} produits de test inseres avec succes !`);

    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
}

seed();
