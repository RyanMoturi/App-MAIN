const express = require('express');
const multer = require('multer');
const db = require('./db');
const path = require('path');
const router = express.Router();

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// POST /api/portfolio - Add a new portfolio item (with image upload)
router.post('/portfolio', upload.single('image'), async (req, res) => {
  const { fundi_id, title, description } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    await db.query(
      'INSERT INTO portfolio (fundi_id, title, image_url, description) VALUES (?, ?, ?, ?)',
      [fundi_id, title, image_url, description]
    );
    res.status(201).json({ message: 'Portfolio item added', image_url });
  } catch (err) {
    console.error('Portfolio upload error:', err);
    res.status(500).json({ error: 'Failed to add portfolio item' });
  }
});

// GET /api/portfolio/:fundiId - Get all portfolio items for a fundi
router.get('/portfolio/:fundiId', async (req, res) => {
  const { fundiId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM portfolio WHERE fundi_id = ?', [fundiId]);
    res.json(rows);
  } catch (err) {
    console.error('Portfolio fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

module.exports = router; 