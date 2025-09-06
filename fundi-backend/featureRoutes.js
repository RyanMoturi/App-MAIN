const express = require('express');
const db = require('./db');
const router = express.Router();

// --- Job Applications ---
router.post('/jobs/:jobId/apply', async (req, res) => {
  const { jobId } = req.params;
  const { fundi_id, message } = req.body;
  await db.query(
    'INSERT INTO job_applications (job_id, fundi_id, message) VALUES (?, ?, ?)',
    [jobId, fundi_id, message]
  );
  res.status(201).json({ message: 'Application submitted' });
});

router.get('/jobs/:jobId/applications', async (req, res) => {
  const { jobId } = req.params;
  const [rows] = await db.query(
    'SELECT ja.*, f.name as fundi_name, f.skill FROM job_applications ja JOIN fundis f ON ja.fundi_id = f.id WHERE ja.job_id = ?',
    [jobId]
  );
  res.json(rows);
});

router.post('/applications/:applicationId/:action', async (req, res) => {
  const { applicationId, action } = req.params;
  if (!['accept', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  await db.query(
    'UPDATE job_applications SET status = ? WHERE id = ?',
    [action === 'accept' ? 'accepted' : 'rejected', applicationId]
  );
  res.json({ message: `Application ${action}ed` });
});

// --- Messaging ---
router.post('/messages', async (req, res) => {
  const { job_id, sender_id, receiver_id, content } = req.body;
  await db.query(
    'INSERT INTO messages (job_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
    [job_id, sender_id, receiver_id, content]
  );
  res.status(201).json({ message: 'Message sent' });
});

router.get('/messages', async (req, res) => {
  const { jobId, userId } = req.query;
  const [rows] = await db.query(
    'SELECT * FROM messages WHERE job_id = ? AND (sender_id = ? OR receiver_id = ?) ORDER BY sent_at ASC',
    [jobId, userId, userId]
  );
  res.json(rows);
});

// --- Notifications ---
router.get('/notifications', async (req, res) => {
  const { userId } = req.query;
  const [rows] = await db.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  res.json(rows);
});

router.post('/notifications/mark-read', async (req, res) => {
  const { notificationId } = req.body;
  await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [notificationId]);
  res.json({ message: 'Notification marked as read' });
});

// --- Reviews ---
router.post('/reviews', async (req, res) => {
  const { job_id, client_id, fundi_id, rating, comment } = req.body;
  await db.query(
    'INSERT INTO reviews (job_id, client_id, fundi_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
    [job_id, client_id, fundi_id, rating, comment]
  );
  res.status(201).json({ message: 'Review submitted' });
});

router.get('/fundi/:fundiId/reviews', async (req, res) => {
  const { fundiId } = req.params;
  const [rows] = await db.query(
    'SELECT * FROM reviews WHERE fundi_id = ? ORDER BY created_at DESC',
    [fundiId]
  );
  res.json(rows);
});

module.exports = router;
