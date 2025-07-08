const express = require('express');
const router = express.Router();
const db = require('./db'); // Adjust path as needed

router.post('/jobs', (req, res) => {
  const { title, description, location, skillRequired, clientId } = req.body;

  const sql = 'INSERT INTO jobs (title, description, location, skill_required, client_id) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [title, description, location, skillRequired, clientId], (err, result) => {
    if (err) {
      console.error('Error posting job:', err);
      return res.status(500).json({ error: 'Error posting job' });
    }
    res.status(201).json({ message: 'Job posted successfully', jobId: result.insertId });
  });
});


module.exports = router;
