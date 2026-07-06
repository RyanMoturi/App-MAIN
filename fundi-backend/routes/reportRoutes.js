const express = require("express");
const db = require("../db");

const router = express.Router();

// ================= REPORTS =================
router.get("/", async (req, res) => {

  try {

    const [[clients]] = await db.query(
      "SELECT COUNT(*) AS total FROM clients"
    );

    const [[fundis]] = await db.query(
      "SELECT COUNT(*) AS total FROM fundis"
    );

    const [[jobs]] = await db.query(
      "SELECT COUNT(*) AS total FROM jobs"
    );

    const [[applications]] = await db.query(
      "SELECT COUNT(*) AS total FROM applications"
    );

    const [[reviews]] = await db.query(
      "SELECT COUNT(*) AS total FROM reviews"
    );

    res.json({
      totalClients: clients.total,
      totalFundis: fundis.total,
      totalJobs: jobs.total,
      totalApplications: applications.total,
      totalReviews: reviews.total,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to load reports",
    });

  }

});

router.get("/fundi-reports", async (req, res) => {
  try {
    const [reports] = await db.query(
      `SELECT
        r.*,
        f.name AS fundi_name,
        f.email AS fundi_email,
        f.is_flagged,
        f.is_banned,
        c.name AS client_name,
        c.email AS client_email,
        j.title AS job_title
       FROM reports r
       JOIN fundis f ON f.id = r.fundi_id
       JOIN clients c ON c.id = r.client_id
       JOIN jobs j ON j.id = r.job_id
       ORDER BY r.created_at DESC`
    );

    res.json(reports);
  } catch (err) {
    console.error("Failed to load fundi reports:", err);
    res.status(500).json({ error: "Failed to load fundi reports" });
  }
});

router.post("/fundi-reports", async (req, res) => {
  const { job_id, client_id, fundi_id, reason, details } = req.body;

  if (!job_id || !client_id || !fundi_id || !reason) {
    return res.status(400).json({ error: "Missing report fields" });
  }

  try {
    const [[assignment]] = await db.query(
      `SELECT ja.id
       FROM job_assignments ja
       JOIN jobs j ON j.id = ja.job_id
       WHERE ja.job_id = ? AND ja.fundi_id = ? AND j.client_id = ?`,
      [job_id, fundi_id, client_id]
    );

    if (!assignment) {
      return res.status(403).json({
        error: "You can only report the fundi assigned to your job",
      });
    }

    await db.query(
      `INSERT INTO reports (job_id, client_id, fundi_id, reason, details)
       VALUES (?, ?, ?, ?, ?)`,
      [job_id, client_id, fundi_id, reason, details || ""]
    );

    await db.query("UPDATE fundis SET is_flagged = 1 WHERE id = ?", [
      fundi_id,
    ]);

    await db.query(
      `INSERT INTO notifications (user_id, user_role, type, content)
       VALUES (?, 'admin', 'fundi_reported', ?)`,
      [
        1,
        `A client reported a fundi for job #${job_id}. Please review it.`,
      ]
    );

    res.status(201).json({ message: "Report submitted to admin" });
  } catch (err) {
    console.error("Failed to submit report:", err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

router.put("/fundi-reports/:id", async (req, res) => {
  const { status, admin_note, ban_fundi } = req.body;

  if (!["Reviewed", "Dismissed"].includes(status)) {
    return res.status(400).json({ error: "Invalid report status" });
  }

  try {
    const [[report]] = await db.query("SELECT * FROM reports WHERE id = ?", [
      req.params.id,
    ]);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    await db.query(
      `UPDATE reports
       SET status = ?, admin_note = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [status, admin_note || null, req.params.id]
    );

    await db.query(
      "UPDATE fundis SET is_banned = ?, is_flagged = ? WHERE id = ?",
      [ban_fundi ? 1 : 0, status === "Reviewed" ? 1 : 0, report.fundi_id]
    );

    res.json({ message: "Report updated" });
  } catch (err) {
    console.error("Failed to update report:", err);
    res.status(500).json({ error: "Failed to update report" });
  }
});

module.exports = router;
