const express = require('express');
const router = express.Router();
const db = require('./db'); // Adjust path as needed

router.post('/jobs', async (req, res) => {
  const { title, description, location, client_id } = req.body;
  try {
    const newJob = await db.query(
      `INSERT INTO jobs (title, description, skill_required, location, client_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, skillRequired, location, client_id]
    );
    res.status(201).json(newJob.rows[0]);
  } catch (error) {
    console.error('Error posting job:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
