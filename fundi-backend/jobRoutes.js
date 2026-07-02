const express = require('express');
const multer = require('multer');
const db = require('./db');
const path = require('path');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// POST /api/jobs (with image upload) - No JWT required
router.post('/jobs', upload.single('image'), async (req, res) => {
  const { title, description, location, skillRequired, clientId } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const [result] = await db.query(
      'INSERT INTO jobs (title, description, location, skill_required, client_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, location, skillRequired, clientId, image_url]
    );
    res.status(201).json({ message: 'Job posted successfully', jobId: result.insertId, image_url });
  } catch (err) {
    console.error('Error posting job:', err);
    res.status(500).json({ error: 'Error posting job' });
  }
});

// GET /api/jobs - Get all jobs (no JWT required)
router.get('/jobs', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM jobs');
    res.json(results);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Error fetching jobs' });
  }
});

// GET /api/client/:clientId/jobs - Get all jobs posted by a specific client (no JWT required)
router.get('/client/:clientId/jobs', async (req, res) => {
  const { clientId } = req.params;
  try {
    const [results] = await db.query('SELECT * FROM jobs WHERE client_id = ?', [clientId]);
    res.json(results);
  } catch (err) {
    console.error('Error fetching client jobs:', err);
    res.status(500).json({ error: 'Error fetching client jobs' });
  }
});

// GET /api/jobs/:id - Get a single job
router.get('/jobs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);
    if (results.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching job:', err);
    res.status(500).json({ error: 'Error fetching job' });
  }
});

// PUT /api/jobs/:id - Update a job (with optional image upload)
router.put('/jobs/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, description, location, skillRequired, clientId } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Job not found' });
    if (String(existing[0].client_id) !== String(clientId)) {
      return res.status(403).json({ error: 'Not authorized to edit this job' });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : existing[0].image_url;
    await db.query(
      'UPDATE jobs SET title = ?, description = ?, location = ?, skill_required = ?, image_url = ? WHERE id = ?',
      [title, description, location, skillRequired, image_url, id]
    );
    res.json({ message: 'Job updated successfully' });
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).json({ error: 'Error updating job' });
  }
});

// DELETE /api/jobs/:id - Delete a job
router.delete('/jobs/:id', async (req, res) => {
  const { id } = req.params;
  const { clientId } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Job not found' });
    if (String(existing[0].client_id) !== String(clientId)) {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }

    await db.query('DELETE FROM jobs WHERE id = ?', [id]);
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ error: 'Error deleting job' });
  }
});

module.exports = router;