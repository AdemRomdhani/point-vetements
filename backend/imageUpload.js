const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  }
});

async function uploadToImgbb(file) {
  if (!IMGBB_API_KEY) {
    console.error('IMGBB_API_KEY not configured');
    throw new Error('Service d\'images non configure');
  }

  const form = new FormData();
  form.append('image', file.buffer.toString('base64'));

  try {
    const { data } = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      form,
      { headers: form.getHeaders(), timeout: 30000 }
    );

    if (!data || !data.success) {
      throw new Error(data?.error?.message || 'ImgBB upload failed');
    }
    return data.data.url;
  } catch (err) {
    console.error('ImgBB error:', err.response?.data || err.message);
    throw new Error('Echec de l\'upload de l\'image');
  }
}

async function deleteFromImgbb(url) {
  // ImgBB free tier doesn't support deletion via API
}

module.exports = { upload, uploadToImgbb, deleteFromImgbb };
