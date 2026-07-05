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

const jobSelect = `
  SELECT
    j.*,
    CASE
      WHEN assignment.completed_at IS NOT NULL THEN 'Completed'
      WHEN accepted.id IS NOT NULL OR assignment.job_id IS NOT NULL THEN 'In Progress'
      ELSE 'Open'
    END AS status,
    CASE
      WHEN accepted.id IS NOT NULL OR assignment.job_id IS NOT NULL THEN 1
      ELSE 0
    END AS is_taken,
    accepted.fundi_id AS accepted_fundi_id,
    accepted.fundi_name AS accepted_fundi_name,
    assignment.completed_at
  FROM jobs j
  LEFT JOIN (
    SELECT a.job_id, a.fundi_id, f.name AS fundi_name, MIN(a.id) AS id
    FROM applications a
    JOIN fundis f ON f.id = a.fundi_id
    WHERE a.status = 'Accepted'
    GROUP BY a.job_id, a.fundi_id, f.name
  ) accepted ON accepted.job_id = j.id
  LEFT JOIN (
    SELECT job_id, fundi_id, MAX(completed_at) AS completed_at
    FROM job_assignments
    GROUP BY job_id, fundi_id
  ) assignment ON assignment.job_id = j.id
`;

const createNotification = async (userId, userRole, type, content) => {
  await db.query(
    `INSERT INTO notifications (user_id, user_role, type, content)
     VALUES (?, ?, ?, ?)`,
    [userId, userRole, type, content]
  );
};

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
    const [results] = await db.query(`${jobSelect} ORDER BY j.created_at DESC`);
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
    const [results] = await db.query(
      `${jobSelect} WHERE j.client_id = ? ORDER BY j.created_at DESC`,
      [clientId]
    );
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
    const [results] = await db.query(`${jobSelect} WHERE j.id = ?`, [id]);
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

// PUT /api/jobs/:id/complete - Client marks an assigned job as completed
router.put('/jobs/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { clientId } = req.body;

  try {
    const [[job]] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (String(job.client_id) !== String(clientId)) {
      return res.status(403).json({ error: 'Not authorized to complete this job' });
    }

    const [[assignment]] = await db.query(
      'SELECT * FROM job_assignments WHERE job_id = ? LIMIT 1',
      [id]
    );

    if (!assignment) {
      return res.status(400).json({ error: 'This job has not been assigned yet' });
    }

    if (!assignment.completed_at) {
      await db.query(
        'UPDATE job_assignments SET completed_at = NOW() WHERE id = ?',
        [assignment.id]
      );
    }

    await createNotification(
      assignment.fundi_id,
      'fundi',
      'job_completed',
      `"${job.title}" was marked as completed.`
    );

    await createNotification(
      job.client_id,
      'client',
      'job_completed',
      `You marked "${job.title}" as completed. Please rate the fundi.`
    );

    res.json({
      message: 'Job marked as completed. Please rate the fundi.',
      fundiId: assignment.fundi_id,
    });
  } catch (err) {
    console.error('Error completing job:', err);
    res.status(500).json({ error: 'Failed to complete job' });
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
