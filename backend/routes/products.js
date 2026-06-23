const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { getDb, parseProductRow } = require('../db');
const auth = require('../middleware/auth');
const { upload, uploadToImgbb, deleteFromImgbb } = require('./imageUpload');

router.get('/', auth, async (req, res) => {
  try {
    const { categorie, sexe, marque, disponible, promotion, search, page = 1, limit = 50, sort = 'dateAjout', order = 'desc' } = req.query;
    const db = getDb();
    let where = [];
    let args = [];

    if (categorie) { where.push('categorie = ?'); args.push(categorie); }
    if (sexe) { where.push('sexe = ?'); args.push(sexe); }
    if (marque) { where.push('marque = ?'); args.push(marque); }
    if (disponible !== undefined) { where.push('disponible = ?'); args.push(disponible === 'true' ? 1 : 0); }
    if (promotion === 'true') { where.push('promotions > 0'); }
    if (search) {
      where.push('(nom LIKE ? OR marque LIKE ? OR couleur LIKE ?)');
      const term = `%${search}%`;
      args.push(term, term, term);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    const allowedSorts = ['dateAjout', 'prix', 'nom', 'quantite'];
    const sortField = allowedSorts.includes(sort) ? sort : 'dateAjout';
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const [countResult, dataResult] = await Promise.all([
      db.execute({ sql: `SELECT COUNT(*) as total FROM products ${whereClause}`, args }),
      db.execute({ sql: `SELECT * FROM products ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`, args: [...args, limitNum, offset] })
    ]);

    const total = countResult.rows[0].total;
    const products = dataResult.rows.map(parseProductRow);

    res.json({
      data: products,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/public', async (req, res) => {
  try {
    const { categorie, sexe, marque, disponible, promotion } = req.query;
    const db = getDb();
    let where = [];
    let args = [];

    if (categorie) { where.push('categorie = ?'); args.push(categorie); }
    if (sexe) { where.push('sexe = ?'); args.push(sexe); }
    if (marque) { where.push('marque = ?'); args.push(marque); }
    if (disponible !== undefined) { where.push('disponible = ?'); args.push(disponible === 'true' ? 1 : 0); }
    if (promotion === 'true') { where.push('promotions > 0'); }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const result = await db.execute({ sql: `SELECT * FROM products ${whereClause} ORDER BY dateAjout DESC`, args });
    res.json(result.rows.map(parseProductRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.execute({ sql: 'SELECT * FROM products WHERE _id = ?', args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produit non trouve' });
    res.json(parseProductRow(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, upload.array('images', 10), async (req, res) => {
  try {
    console.log('POST /api/products - body:', JSON.stringify(req.body).substring(0, 200));
    console.log('Files count:', req.files ? req.files.length : 0);
    const db = getDb();
    const d = req.body;
    const id = crypto.randomUUID();

    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadToImgbb(file);
          images.push(url);
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr.message);
        }
      }
    }

    let tailles = [];
    if (typeof d.tailles === 'string') tailles = d.tailles.split(',').map(t => t.trim()).filter(Boolean);
    else if (Array.isArray(d.tailles)) tailles = d.tailles;

    let couleurs = [];
    if (typeof d.couleurs === 'string') couleurs = d.couleurs.split(',').map(c => c.trim()).filter(Boolean);
    else if (Array.isArray(d.couleurs)) couleurs = d.couleurs;

    await db.execute({
      sql: `INSERT INTO products (_id, nom, description, prix, categorie, marque, sexe, typeVetement, matiere, couleur, couleurs, saison, tailles, quantite, images, disponible, promotions, dateAjout)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, d.nom || '', d.description || '', parseFloat(d.prix) || 0,
        d.categorie || 'homme', d.marque || '', d.sexe || 'unisexe',
        d.typeVetement || '', d.matiere || '', d.couleur || '',
        JSON.stringify(couleurs), d.saison || 'toutes', JSON.stringify(tailles),
        parseInt(d.quantite) || 0, JSON.stringify(images),
        d.disponible === 'true' || d.disponible === true ? 1 : 0,
        parseInt(d.promotions) || 0, new Date().toISOString()
      ]
    });

    const result = await db.execute({ sql: 'SELECT * FROM products WHERE _id = ?', args: [id] });
    res.status(201).json(parseProductRow(result.rows[0]));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, upload.array('images', 10), async (req, res) => {
  try {
    const db = getDb();
    const existing = await db.execute({ sql: 'SELECT * FROM products WHERE _id = ?', args: [req.params.id] });
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Produit non trouve' });

    const d = req.body;
    const old = parseProductRow(existing.rows[0]);
    let images = old.images;

    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        try {
          const url = await uploadToImgbb(file);
          newImages.push(url);
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr.message);
        }
      }
      if (newImages.length > 0) {
        if (d.existingImages) {
          const existImgs = Array.isArray(d.existingImages) ? d.existingImages : [d.existingImages];
          images = [...existImgs, ...newImages];
        } else {
          images = newImages;
        }
      }
    }

    let tailles = old.tailles;
    if (typeof d.tailles === 'string') tailles = d.tailles.split(',').map(t => t.trim()).filter(Boolean);
    else if (Array.isArray(d.tailles)) tailles = d.tailles;

    let couleurs = old.couleurs;
    if (typeof d.couleurs === 'string') couleurs = d.couleurs.split(',').map(c => c.trim()).filter(Boolean);
    else if (Array.isArray(d.couleurs)) couleurs = d.couleurs;

    await db.execute({
      sql: `UPDATE products SET nom=?, description=?, prix=?, categorie=?, marque=?, sexe=?, typeVetement=?, matiere=?, couleur=?, couleurs=?, saison=?, tailles=?, quantite=?, images=?, disponible=?, promotions=? WHERE _id=?`,
      args: [
        d.nom || old.nom, d.description || old.description,
        parseFloat(d.prix) || old.prix, d.categorie || old.categorie,
        d.marque || old.marque, d.sexe || old.sexe,
        d.typeVetement || old.typeVetement, d.matiere || old.matiere,
        d.couleur || old.couleur, JSON.stringify(couleurs),
        d.saison || old.saison, JSON.stringify(tailles),
        parseInt(d.quantite) || old.quantite, JSON.stringify(images),
        d.disponible === 'true' || d.disponible === true ? 1 : d.disponible === 'false' || d.disponible === false ? 0 : (old.disponible ? 1 : 0),
        parseInt(d.promotions) || parseInt(d.promotions) === 0 ? parseInt(d.promotions) || 0 : old.promotions,
        req.params.id
      ]
    });

    const result = await db.execute({ sql: 'SELECT * FROM products WHERE _id = ?', args: [req.params.id] });
    res.json(parseProductRow(result.rows[0]));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const db = getDb();
    const result = await db.execute({ sql: 'SELECT * FROM products WHERE _id = ?', args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produit non trouve' });

    const product = parseProductRow(result.rows[0]);
    await db.execute({ sql: 'DELETE FROM products WHERE _id = ?', args: [req.params.id] });

    if (product.images && product.images.length > 0) {
      product.images.forEach(img => deleteFromImgbb(img));
    }
    res.json({ message: 'Produit supprime' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
