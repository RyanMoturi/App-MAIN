const express = require("express");
const db = require("../db");

const router = express.Router();

const createNotification = async (userId, userRole, type, content) => {
  await db.query(
    `INSERT INTO notifications (user_id, user_role, type, content)
     VALUES (?, ?, ?, ?)`,
    [userId, userRole, type, content]
  );
};

const getAcceptedApplication = async (jobId) => {
  const [accepted] = await db.query(
    "SELECT id FROM applications WHERE job_id = ? AND status = 'Accepted' LIMIT 1",
    [jobId]
  );

  return accepted[0] || null;
};

router.post("/apply", async (req, res) => {
  try {
    const { jobId, fundiId, message } = req.body;

    if (!jobId || !fundiId) {
      return res.status(400).json({
        message: "Job ID and Fundi ID are required.",
      });
    }

    const [[job]] = await db.query(
      "SELECT id, title, client_id FROM jobs WHERE id = ?",
      [jobId]
    );

    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    const accepted = await getAcceptedApplication(jobId);

    if (accepted) {
      return res.status(400).json({
        message: "This job is already taken.",
      });
    }

    const [[fundiAccount]] = await db.query(
      "SELECT is_verified, verification_status, is_banned FROM fundis WHERE id = ?",
      [fundiId]
    );

    if (!fundiAccount) {
      return res.status(404).json({
        message: "Fundi account not found.",
      });
    }

    if (!fundiAccount.is_verified) {
      return res.status(403).json({
        message:
          fundiAccount.verification_status === "Rejected"
            ? "Your fundi account was not verified. Please contact admin."
            : "Your fundi account is pending admin verification. You cannot apply yet.",
      });
    }

    if (fundiAccount.is_banned) {
      return res.status(403).json({
        message: "Your fundi account has been banned by admin.",
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM applications WHERE job_id = ? AND fundi_id = ?",
      [jobId, fundiId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "You have already applied for this job.",
      });
    }

    await db.query(
      `INSERT INTO applications (job_id, fundi_id, message, status)
       VALUES (?, ?, ?, 'Pending')`,
      [jobId, fundiId, message || ""]
    );

    const [[fundi]] = await db.query("SELECT name FROM fundis WHERE id = ?", [fundiId]);
    await createNotification(
      job.client_id,
      "client",
      "application",
      `${fundi?.name || "A fundi"} applied for "${job.title}".`
    );

    res.status(201).json({
      message: "Application submitted successfully.",
    });
  } catch (err) {
    console.error("Apply error:", err);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

router.get("/fundi/:id", async (req, res) => {
  try {
    const [applications] = await db.query(
      `SELECT
          a.id,
          a.job_id,
          a.status,
          a.message,
          a.applied_at,
          j.title,
          j.description,
          j.location,
          j.skill_required,
          j.created_at AS job_created_at,
          ja.completed_at,
          CASE
            WHEN ja.completed_at IS NOT NULL THEN 'Completed'
            WHEN ja.id IS NOT NULL OR accepted.id IS NOT NULL THEN 'In Progress'
            ELSE 'Open'
          END AS job_status,
          CASE
            WHEN accepted.id IS NOT NULL OR ja.id IS NOT NULL THEN 1
            ELSE 0
          END AS is_taken
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN applications accepted
         ON accepted.job_id = j.id
        AND accepted.status = 'Accepted'
       LEFT JOIN job_assignments ja
         ON ja.job_id = j.id
        AND ja.fundi_id = a.fundi_id
       WHERE a.fundi_id = ?
       ORDER BY a.applied_at DESC`,
      [req.params.id]
    );

    res.json(applications);
  } catch (err) {
    console.error("Fundi applications fetch error:", err);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

router.get("/job/:jobId", async (req, res) => {
  try {
    const [applications] = await db.query(
      `SELECT
        a.id,
        a.job_id,
        a.status,
        a.message,
        a.applied_at,
        f.id AS fundi_id,
        f.name,
        f.email,
        f.phone_number,
        f.skill,
        f.location,
        f.rating
       FROM applications a
       JOIN fundis f ON a.fundi_id = f.id
       WHERE a.job_id = ?
       ORDER BY
        CASE a.status
          WHEN 'Accepted' THEN 1
          WHEN 'Pending' THEN 2
          ELSE 3
        END,
        a.applied_at DESC`,
      [req.params.jobId]
    );

    res.json(applications);
  } catch (err) {
    console.error("Job applications fetch error:", err);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

router.put("/:id/accept", async (req, res) => {
  try {
    const applicationId = req.params.id;

    const [[application]] = await db.query(
      `SELECT a.*, j.title, j.client_id
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.id = ?`,
      [applicationId]
    );

    if (!application) {
      return res.status(404).json({
        message: "Application not found.",
      });
    }

    const accepted = await getAcceptedApplication(application.job_id);

    if (accepted && String(accepted.id) !== String(applicationId)) {
      return res.status(400).json({
        message: "This job already has an accepted fundi.",
      });
    }

    await db.query("UPDATE applications SET status = 'Accepted' WHERE id = ?", [
      applicationId,
    ]);

    await db.query(
      "UPDATE applications SET status = 'Rejected' WHERE job_id = ? AND id <> ?",
      [application.job_id, applicationId]
    );

    await db.query(
      `INSERT INTO job_assignments (job_id, fundi_id)
       SELECT ?, ?
       WHERE NOT EXISTS (
        SELECT 1 FROM job_assignments WHERE job_id = ?
       )`,
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

    res.json({
      message: "Application accepted successfully.",
    });
  } catch (err) {
    console.error("Application accept error:", err);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM applications WHERE id = ? AND status = 'Pending'",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Only pending applications can be withdrawn.",
      });
    }

    res.json({
      message: "Application withdrawn.",
    });
  } catch (err) {
    console.error("Application withdraw error:", err);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

module.exports = router;
