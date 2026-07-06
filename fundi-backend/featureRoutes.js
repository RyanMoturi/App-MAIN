const express = require("express");
const db = require("./db");

const getUserName = async (userId, role) => {
  const table = role === "client" ? "clients" : "fundis";
  const nameColumn = role === "client" ? "name" : "name";
  const [rows] = await db.query(`SELECT ${nameColumn} AS name FROM ${table} WHERE id = ?`, [userId]);
  return rows[0]?.name || "Unknown";
};

const createNotification = async (userId, userRole, type, content) => {
  await db.query(
    `INSERT INTO notifications (user_id, user_role, type, content)
     VALUES (?, ?, ?, ?)`,
    [userId, userRole, type, content]
  );
};

const updateFundiRating = async (fundiId) => {
  const [avgRows] = await db.query(
    "SELECT ROUND(AVG(rating), 2) AS avg_rating FROM reviews WHERE fundi_id = ?",
    [fundiId]
  );
  const avgRating = avgRows[0]?.avg_rating || 0;
  await db.query("UPDATE fundis SET rating = ? WHERE id = ?", [avgRating, fundiId]);
  return avgRating;
};

module.exports = (io) => {
  const router = express.Router();

  router.get("/fundis", async (req, res) => {
    const { skill, location } = req.query;
    try {
      let sql = "SELECT id, name, skill, bio, location, rating FROM fundis WHERE 1=1";
      const params = [];

      if (skill) {
        sql += " AND skill LIKE ?";
        params.push(`%${skill}%`);
      }

      if (location) {
        sql += " AND location LIKE ?";
        params.push(`%${location}%`);
      }

      sql += " ORDER BY rating DESC, name ASC";
      const [rows] = await db.query(sql, params);
      res.json(rows);
    } catch (err) {
      console.error("Error searching fundis:", err);
      res.status(500).json({ error: "Failed to search fundis" });
    }
  });

  router.get("/fundis/:fundiId", async (req, res) => {
    try {
      const [rows] = await db.query(
        "SELECT id, name, skill, bio, location, rating FROM fundis WHERE id = ?",
        [req.params.fundiId]
      );
      if (!rows.length) return res.status(404).json({ error: "Fundi not found" });
      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching fundi:", err);
      res.status(500).json({ error: "Failed to fetch fundi" });
    }
  });

  router.post("/jobs/:jobId/apply", async (req, res) => {
    const { jobId } = req.params;
    const { fundi_id, message } = req.body;

    try {
      const [[job]] = await db.query("SELECT id FROM jobs WHERE id = ?", [jobId]);
      if (!job) return res.status(404).json({ error: "Job not found" });

      const [[fundi]] = await db.query(
        "SELECT is_verified, is_banned FROM fundis WHERE id = ?",
        [fundi_id]
      );

      if (!fundi?.is_verified) {
        return res.status(403).json({ error: "Your account is pending admin verification" });
      }

      if (fundi.is_banned) {
        return res.status(403).json({ error: "Your account has been banned by admin" });
      }

      const [[accepted]] = await db.query(
        "SELECT id FROM applications WHERE job_id = ? AND status = 'Accepted' LIMIT 1",
        [jobId]
      );
      if (accepted) return res.status(400).json({ error: "This job is already taken" });

      await db.query(
        "INSERT INTO applications (job_id, fundi_id, message, status) VALUES (?, ?, ?, 'Pending')",
        [jobId, fundi_id, message || ""]
      );

      res.status(201).json({ message: "Application submitted" });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "You already applied to this job" });
      }
      console.error("Error applying to job:", err);
      res.status(500).json({ error: "Failed to submit application" });
    }
  });

  router.get("/jobs/:jobId/applications", async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT a.*, f.name AS fundi_name, f.skill
         FROM applications a
         JOIN fundis f ON a.fundi_id = f.id
         WHERE a.job_id = ?
         ORDER BY a.applied_at DESC`,
        [req.params.jobId]
      );
      res.json(rows);
    } catch (err) {
      console.error("Error fetching applications:", err);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  router.get("/jobs/:jobId/accepted-fundi", async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT a.fundi_id, f.name, f.skill, f.rating
         FROM applications a
         JOIN fundis f ON a.fundi_id = f.id
         WHERE a.job_id = ? AND a.status = 'Accepted'
         LIMIT 1`,
        [req.params.jobId]
      );
      res.json(rows[0] || null);
    } catch (err) {
      console.error("Error fetching accepted fundi:", err);
      res.status(500).json({ error: "Failed to fetch accepted fundi" });
    }
  });

  router.post("/applications/:applicationId/:action", async (req, res) => {
    const { applicationId, action } = req.params;
    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    try {
      const [[application]] = await db.query(
        `SELECT a.*, j.title, j.client_id
         FROM applications a
         JOIN jobs j ON j.id = a.job_id
         WHERE a.id = ?`,
        [applicationId]
      );

      if (!application) return res.status(404).json({ error: "Application not found" });

      await db.query("UPDATE applications SET status = ? WHERE id = ?", [
        action === "accept" ? "Accepted" : "Rejected",
        applicationId,
      ]);

      if (action === "accept") {
        await db.query("UPDATE applications SET status = 'Rejected' WHERE job_id = ? AND id <> ?", [
          application.job_id,
          applicationId,
        ]);
        await db.query(
          `INSERT INTO job_assignments (job_id, fundi_id)
           SELECT ?, ?
           WHERE NOT EXISTS (SELECT 1 FROM job_assignments WHERE job_id = ?)`,
          [application.job_id, application.fundi_id, application.job_id]
        );
        await createNotification(
          application.fundi_id,
          "fundi",
          "application_accepted",
          `Your application for "${application.title}" was accepted.`
        );
        await createNotification(
          application.client_id,
          "client",
          "job_in_progress",
          `"${application.title}" is now in progress.`
        );
      }

      res.json({ message: `Application ${action}ed` });
    } catch (err) {
      console.error("Error updating application:", err);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  router.post("/messages", async (req, res) => {
    const { job_id, sender_id, receiver_id, sender_role, receiver_role, content } = req.body;
    if (!job_id || !sender_id || !receiver_id || !sender_role || !receiver_role || !content?.trim()) {
      return res.status(400).json({ error: "Missing required message fields" });
    }

    try {
      const [[assignment]] = await db.query(
        `SELECT ja.*, j.client_id, j.title
         FROM job_assignments ja
         JOIN jobs j ON j.id = ja.job_id
         WHERE ja.job_id = ? AND ja.fundi_id IN (?, ?) AND j.client_id IN (?, ?)`,
        [job_id, sender_id, receiver_id, sender_id, receiver_id]
      );

      let messageJob = assignment;

      if (!messageJob) {
        const [[clientContactJob]] = await db.query(
          `SELECT id AS job_id, client_id, title
           FROM jobs
           WHERE id = ?
             AND client_id = ?
             AND ? = 'client'
             AND ? = 'fundi'`,
          [job_id, sender_id, sender_role, receiver_role]
        );

        const [[existingThread]] = await db.query(
          `SELECT j.id AS job_id, j.client_id, j.title
           FROM messages m
           JOIN jobs j ON j.id = m.job_id
           WHERE m.job_id = ?
             AND (
              (m.sender_id = ? AND m.sender_role = ? AND m.receiver_id = ? AND m.receiver_role = ?)
              OR
              (m.sender_id = ? AND m.sender_role = ? AND m.receiver_id = ? AND m.receiver_role = ?)
             )
           LIMIT 1`,
          [
            job_id,
            sender_id,
            sender_role,
            receiver_id,
            receiver_role,
            receiver_id,
            receiver_role,
            sender_id,
            sender_role,
          ]
        );

        messageJob = clientContactJob || existingThread;
      }

      if (!messageJob) {
        return res.status(403).json({ error: "Messages are only available for accepted jobs or client contact requests" });
      }

      const [result] = await db.query(
        `INSERT INTO messages
          (job_id, sender_id, receiver_id, sender_role, receiver_role, content)
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

      const senderName = await getUserName(sender_id, sender_role);
      await createNotification(
        receiver_id,
        receiver_role,
        "message",
        `${senderName} sent you a message about "${messageJob.title}".`
      );

      if (io) {
        io.to(`user_${receiver_role}_${receiver_id}`).emit("receive_message", messagePayload);
        io.to(`user_${receiver_role}_${receiver_id}`).emit("receive_notification", {
          type: "message",
          content: `${senderName} sent you a message about "${messageJob.title}".`,
        });
      }

      res.status(201).json({ message: "Message sent", data: messagePayload });
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  router.get("/messages", async (req, res) => {
    const { jobId, userId, userRole, otherUserId, otherUserRole } = req.query;
    if (!jobId || !userId || !userRole || !otherUserId || !otherUserRole) {
      return res.status(400).json({ error: "Missing query parameters" });
    }

    try {
      const [rows] = await db.query(
        `SELECT *
         FROM messages
         WHERE job_id = ?
           AND (
            (sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ?)
            OR
            (sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ?)
           )
         ORDER BY sent_at ASC`,
        [
          jobId,
          userId,
          userRole,
          otherUserId,
          otherUserRole,
          otherUserId,
          otherUserRole,
          userId,
          userRole,
        ]
      );
      res.json(rows);
    } catch (err) {
      console.error("Error fetching messages:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  router.get("/conversations", async (req, res) => {
    const { userId, userRole } = req.query;
    if (!userId || !userRole) {
      return res.status(400).json({ error: "userId and userRole are required" });
    }

    try {
      const params = [userId];
      const condition =
        userRole === "client" ? "j.client_id = ?" : "ja.fundi_id = ?";
      const otherJoin =
        userRole === "client"
          ? "JOIN fundis other_user ON other_user.id = ja.fundi_id"
          : "JOIN clients other_user ON other_user.id = j.client_id";
      const otherRole = userRole === "client" ? "fundi" : "client";
      const otherIdColumn = userRole === "client" ? "ja.fundi_id" : "j.client_id";

      const [assignments] = await db.query(
        `SELECT
          ja.job_id,
          j.title AS job_title,
          ${otherIdColumn} AS other_user_id,
          ? AS other_user_role,
          other_user.name AS other_user_name,
          ja.assigned_at,
          ja.completed_at
         FROM job_assignments ja
         JOIN jobs j ON j.id = ja.job_id
         ${otherJoin}
         WHERE ${condition}
         ORDER BY ja.assigned_at DESC`,
        [otherRole, ...params]
      );

      const conversations = [];
      for (const assignment of assignments) {
        const [[lastMessage]] = await db.query(
          `SELECT content, sent_at
           FROM messages
           WHERE job_id = ?
             AND (
              (sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ?)
              OR
              (sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ?)
             )
           ORDER BY sent_at DESC
           LIMIT 1`,
          [
            assignment.job_id,
            userId,
            userRole,
            assignment.other_user_id,
            assignment.other_user_role,
            assignment.other_user_id,
            assignment.other_user_role,
            userId,
            userRole,
          ]
        );

        conversations.push({
          ...assignment,
          last_message: lastMessage?.content || "Conversation ready",
          last_sent_at: lastMessage?.sent_at || assignment.assigned_at,
        });
      }

      const [messageThreads] = await db.query(
        userRole === "client"
          ? `SELECT
              m.job_id,
              j.title AS job_title,
              f.id AS other_user_id,
              'fundi' AS other_user_role,
              f.name AS other_user_name,
              MIN(m.sent_at) AS assigned_at,
              NULL AS completed_at,
              MAX(m.sent_at) AS last_sent_at
             FROM messages m
             JOIN jobs j ON j.id = m.job_id
             JOIN fundis f ON f.id = CASE
                WHEN m.sender_role = 'fundi' THEN m.sender_id
                ELSE m.receiver_id
              END
             WHERE (m.sender_id = ? AND m.sender_role = 'client')
                OR (m.receiver_id = ? AND m.receiver_role = 'client')
             GROUP BY m.job_id, j.title, f.id, f.name`
          : `SELECT
              m.job_id,
              j.title AS job_title,
              c.id AS other_user_id,
              'client' AS other_user_role,
              c.name AS other_user_name,
              MIN(m.sent_at) AS assigned_at,
              NULL AS completed_at,
              MAX(m.sent_at) AS last_sent_at
             FROM messages m
             JOIN jobs j ON j.id = m.job_id
             JOIN clients c ON c.id = CASE
                WHEN m.sender_role = 'client' THEN m.sender_id
                ELSE m.receiver_id
              END
             WHERE (m.sender_id = ? AND m.sender_role = 'fundi')
                OR (m.receiver_id = ? AND m.receiver_role = 'fundi')
             GROUP BY m.job_id, j.title, c.id, c.name`,
        [userId, userId]
      );

      for (const thread of messageThreads) {
        const exists = conversations.some(
          (conversation) =>
            String(conversation.job_id) === String(thread.job_id) &&
            String(conversation.other_user_id) === String(thread.other_user_id) &&
            conversation.other_user_role === thread.other_user_role
        );

        if (exists) continue;

        const [[lastMessage]] = await db.query(
          `SELECT content, sent_at
           FROM messages
           WHERE job_id = ?
             AND (
              (sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ?)
              OR
              (sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ?)
             )
           ORDER BY sent_at DESC
           LIMIT 1`,
          [
            thread.job_id,
            userId,
            userRole,
            thread.other_user_id,
            thread.other_user_role,
            thread.other_user_id,
            thread.other_user_role,
            userId,
            userRole,
          ]
        );

        conversations.push({
          ...thread,
          last_message: lastMessage?.content || "Conversation ready",
          last_sent_at: lastMessage?.sent_at || thread.last_sent_at,
        });
      }

      conversations.sort(
        (a, b) => new Date(b.last_sent_at) - new Date(a.last_sent_at)
      );

      res.json(conversations);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  router.get("/notifications", async (req, res) => {
    const { userId, userRole } = req.query;
    if (!userId || !userRole) {
      return res.status(400).json({ error: "userId and userRole are required" });
    }

    try {
      const [rows] = await db.query(
        `SELECT *
         FROM notifications
         WHERE user_id = ? AND user_role = ?
         ORDER BY created_at DESC`,
        [userId, userRole]
      );
      res.json(rows);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  router.post("/notifications/mark-read", async (req, res) => {
    const { notificationId, userId, userRole } = req.body;
    if (!notificationId || !userId || !userRole) {
      return res.status(400).json({ error: "Missing notification fields" });
    }

    try {
      await db.query(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ? AND user_role = ?",
        [notificationId, userId, userRole]
      );
      res.json({ message: "Notification marked as read" });
    } catch (err) {
      console.error("Error marking notification read:", err);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  router.post("/reviews", async (req, res) => {
    const { job_id, client_id, fundi_id, rating, comment } = req.body;
    if (!job_id || !client_id || !fundi_id || !rating) {
      return res.status(400).json({ error: "Missing required review fields" });
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    try {
      const [[assignment]] = await db.query(
        `SELECT ja.completed_at, j.title
         FROM job_assignments ja
         JOIN jobs j ON j.id = ja.job_id
         WHERE ja.job_id = ? AND ja.fundi_id = ? AND j.client_id = ?`,
        [job_id, fundi_id, client_id]
      );

      if (!assignment?.completed_at) {
        return res.status(400).json({ error: "Complete the job before reviewing it" });
      }

      const [existing] = await db.query(
        "SELECT id FROM reviews WHERE job_id = ? AND client_id = ?",
        [job_id, client_id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: "You already reviewed this job" });
      }

      await db.query(
        "INSERT INTO reviews (job_id, client_id, fundi_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
        [job_id, client_id, fundi_id, rating, comment || ""]
      );

      const avgRating = await updateFundiRating(fundi_id);
      await createNotification(
        fundi_id,
        "fundi",
        "rated",
        `You received a ${rating}-star review for "${assignment.title}".`
      );

      res.status(201).json({ message: "Review submitted", avgRating });
    } catch (err) {
      console.error("Error submitting review:", err);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });

  router.get("/fundi/:fundiId/reviews", async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT r.*, c.name AS client_name, j.title AS job_title
         FROM reviews r
         JOIN clients c ON r.client_id = c.id
         JOIN jobs j ON r.job_id = j.id
         WHERE r.fundi_id = ?
         ORDER BY r.created_at DESC`,
        [req.params.fundiId]
      );
      res.json(rows);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  router.get("/jobs/:jobId/review", async (req, res) => {
    try {
      const [rows] = await db.query("SELECT * FROM reviews WHERE job_id = ?", [
        req.params.jobId,
      ]);
      res.json(rows[0] || null);
    } catch (err) {
      console.error("Error fetching job review:", err);
      res.status(500).json({ error: "Failed to fetch review" });
    }
  });

  return router;
};
