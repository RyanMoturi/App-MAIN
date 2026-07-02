const express = require('express');
const db = require('./db');

const getUserName = async (userId, role) => {
  const table = role === 'client' ? 'clients' : 'fundis';
  const [rows] = await db.query(`SELECT name FROM ${table} WHERE id = ?`, [userId]);
  return rows[0]?.name || 'Unknown';
};

const updateFundiRating = async (fundiId) => {
  const [avgRows] = await db.query(
    'SELECT ROUND(AVG(rating), 2) AS avg_rating FROM reviews WHERE fundi_id = ?',
    [fundiId]
  );
  const avgRating = avgRows[0]?.avg_rating || 0;
  await db.query('UPDATE fundis SET rating = ? WHERE id = ?', [avgRating, fundiId]);
  return avgRating;
};

module.exports = (io) => {
  const router = express.Router();

  // --- Fundi Search ---
  router.get('/fundis', async (req, res) => {
    const { skill, location } = req.query;
    try {
      let sql = 'SELECT id, name, skill, bio, location, rating FROM fundis WHERE 1=1';
      const params = [];

      if (skill) {
        sql += ' AND skill LIKE ?';
        params.push(`%${skill}%`);
      }
      if (location) {
        sql += ' AND location LIKE ?';
        params.push(`%${location}%`);
      }

      sql += ' ORDER BY rating DESC, name ASC';
      const [rows] = await db.query(sql, params);
      res.json(rows);
    } catch (err) {
      console.error('Error searching fundis:', err);
      res.status(500).json({ error: 'Failed to search fundis' });
    }
  });

  router.get('/fundis/:fundiId', async (req, res) => {
    const { fundiId } = req.params;
    try {
      const [rows] = await db.query(
        'SELECT id, name, skill, bio, location, rating FROM fundis WHERE id = ?',
        [fundiId]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Fundi not found' });
      res.json(rows[0]);
    } catch (err) {
      console.error('Error fetching fundi:', err);
      res.status(500).json({ error: 'Failed to fetch fundi' });
    }
  });

  // --- Job Applications ---
  router.post('/jobs/:jobId/apply', async (req, res) => {
    const { jobId } = req.params;
    const { fundi_id, message } = req.body;
    try {
      await db.query(
        'INSERT INTO job_applications (job_id, fundi_id, message) VALUES (?, ?, ?)',
        [jobId, fundi_id, message]
      );
      res.status(201).json({ message: 'Application submitted' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'You already applied to this job' });
      }
      console.error('Error applying to job:', err);
      res.status(500).json({ error: 'Failed to submit application' });
    }
  });

  router.get('/jobs/:jobId/applications', async (req, res) => {
    const { jobId } = req.params;
    try {
      const [rows] = await db.query(
        `SELECT ja.*, f.name AS fundi_name, f.skill
         FROM job_applications ja
         JOIN fundis f ON ja.fundi_id = f.id
         WHERE ja.job_id = ?`,
        [jobId]
      );
      res.json(rows);
    } catch (err) {
      console.error('Error fetching applications:', err);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  });

  router.get('/jobs/:jobId/accepted-fundi', async (req, res) => {
    const { jobId } = req.params;
    try {
      const [rows] = await db.query(
        `SELECT ja.fundi_id, f.name, f.skill, f.rating
         FROM job_applications ja
         JOIN fundis f ON ja.fundi_id = f.id
         WHERE ja.job_id = ? AND ja.status = 'accepted'
         LIMIT 1`,
        [jobId]
      );
      res.json(rows[0] || null);
    } catch (err) {
      console.error('Error fetching accepted fundi:', err);
      res.status(500).json({ error: 'Failed to fetch accepted fundi' });
    }
  });

  router.post('/applications/:applicationId/:action', async (req, res) => {
    const { applicationId, action } = req.params;
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    try {
      await db.query(
        'UPDATE job_applications SET status = ? WHERE id = ?',
        [action === 'accept' ? 'accepted' : 'rejected', applicationId]
      );
      if (action === 'accept') {
        const [app] = await db.query('SELECT job_id FROM job_applications WHERE id = ?', [applicationId]);
        if (app.length) {
          await db.query("UPDATE jobs SET status = 'In Progress' WHERE id = ?", [app[0].job_id]);
        }
      }
      res.json({ message: `Application ${action}ed` });
    } catch (err) {
      console.error('Error updating application:', err);
      res.status(500).json({ error: 'Failed to update application' });
    }
  });

  // --- Messaging ---
  router.post('/messages', async (req, res) => {
    const { job_id, sender_id, receiver_id, sender_role, receiver_role, content } = req.body;
    if (!job_id || !sender_id || !receiver_id || !sender_role || !receiver_role || !content?.trim()) {
      return res.status(400).json({ error: 'Missing required message fields' });
    }
    try {
      const [result] = await db.query(
        `INSERT INTO messages (job_id, sender_id, receiver_id, sender_role, receiver_role, content)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [job_id, sender_id, receiver_id, sender_role, receiver_role, content.trim()]
      );

      const messagePayload = {
        id: result.insertId,
        job_id,
        sender_id,
        receiver_id,
        sender_role,
        receiver_role,
        content: content.trim(),
        sent_at: new Date().toISOString(),
      };

      if (io) {
        io.to(`user_${receiver_role}_${receiver_id}`).emit('receive_message', messagePayload);
      }

      res.status(201).json({ message: 'Message sent', data: messagePayload });
    } catch (err) {
      console.error('Error sending message:', err);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  router.get('/messages', async (req, res) => {
    const { jobId, userId, userRole, otherUserId, otherUserRole } = req.query;
    if (!jobId || !userId || !userRole || !otherUserId || !otherUserRole) {
      return res.status(400).json({ error: 'Missing query parameters' });
    }
    try {
      const [rows] = await db.query(
        `SELECT * FROM messages
         WHERE job_id = ?
           AND (
             (sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ?)
             OR
             (sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ?)
           )
         ORDER BY sent_at ASC`,
        [
          jobId,
          userId, userRole, otherUserId, otherUserRole,
          otherUserId, otherUserRole, userId, userRole,
        ]
      );
      res.json(rows);
    } catch (err) {
      console.error('Error fetching messages:', err);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  router.get('/conversations', async (req, res) => {
    const { userId, userRole } = req.query;
    if (!userId || !userRole) {
      return res.status(400).json({ error: 'userId and userRole are required' });
    }
    try {
      const [messages] = await db.query(
        `SELECT m.*, j.title AS job_title
         FROM messages m
         JOIN jobs j ON m.job_id = j.id
         WHERE (m.sender_id = ? AND m.sender_role = ?)
            OR (m.receiver_id = ? AND m.receiver_role = ?)
         ORDER BY m.sent_at DESC`,
        [userId, userRole, userId, userRole]
      );

      const seen = new Set();
      const conversations = [];

      for (const msg of messages) {
        const isSender = String(msg.sender_id) === String(userId) && msg.sender_role === userRole;
        const otherUserId = isSender ? msg.receiver_id : msg.sender_id;
        const otherUserRole = isSender ? msg.receiver_role : msg.sender_role;
        const key = `${msg.job_id}-${otherUserRole}-${otherUserId}`;

        if (seen.has(key)) continue;
        seen.add(key);

        const otherUserName = await getUserName(otherUserId, otherUserRole);
        conversations.push({
          job_id: msg.job_id,
          job_title: msg.job_title,
          other_user_id: otherUserId,
          other_user_role: otherUserRole,
          other_user_name: otherUserName,
          last_message: msg.content,
          last_sent_at: msg.sent_at,
        });
      }

      res.json(conversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  // --- Notifications ---
  router.get('/notifications', async (req, res) => {
    const { userId, userRole } = req.query;
    try {
      const [rows] = await db.query(
        `SELECT * FROM notifications
         WHERE user_id = ? AND user_role = ?
         ORDER BY created_at DESC`,
        [userId, userRole]
      );
      res.json(rows);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  router.post('/notifications/mark-read', async (req, res) => {
    const { notificationId } = req.body;
    try {
      await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [notificationId]);
      res.json({ message: 'Notification marked as read' });
    } catch (err) {
      console.error('Error marking notification read:', err);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // --- Reviews / Ratings ---
  router.post('/reviews', async (req, res) => {
    const { job_id, client_id, fundi_id, rating, comment } = req.body;
    if (!job_id || !client_id || !fundi_id || !rating) {
      return res.status(400).json({ error: 'Missing required review fields' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    try {
      const [existing] = await db.query(
        'SELECT id FROM reviews WHERE job_id = ? AND client_id = ?',
        [job_id, client_id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: 'You already reviewed this job' });
      }

      await db.query(
        'INSERT INTO reviews (job_id, client_id, fundi_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [job_id, client_id, fundi_id, rating, comment || '']
      );

      const avgRating = await updateFundiRating(fundi_id);
      res.status(201).json({ message: 'Review submitted', avgRating });
    } catch (err) {
      console.error('Error submitting review:', err);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  });

  router.get('/fundi/:fundiId/reviews', async (req, res) => {
    const { fundiId } = req.params;
    try {
      const [rows] = await db.query(
        `SELECT r.*, c.name AS client_name, j.title AS job_title
         FROM reviews r
         JOIN clients c ON r.client_id = c.id
         JOIN jobs j ON r.job_id = j.id
         WHERE r.fundi_id = ?
         ORDER BY r.created_at DESC`,
        [fundiId]
      );
      res.json(rows);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  router.get('/jobs/:jobId/review', async (req, res) => {
    const { jobId } = req.params;
    try {
      const [rows] = await db.query('SELECT * FROM reviews WHERE job_id = ?', [jobId]);
      res.json(rows[0] || null);
    } catch (err) {
      console.error('Error fetching job review:', err);
      res.status(500).json({ error: 'Failed to fetch review' });
    }
  });

  return router;
};
