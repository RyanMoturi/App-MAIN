const express = require("express");
const {
  COLLECTIONS,
  addWithId,
  all,
  createNotification,
  getById,
  sortByDateDesc,
  timestamp,
  updateById,
  whereEqual,
} = require("../firestoreStore");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [clients, fundis, jobs, applications, reviews] = await Promise.all([
      all(COLLECTIONS.clients),
      all(COLLECTIONS.fundis),
      all(COLLECTIONS.jobs),
      all(COLLECTIONS.applications),
      all(COLLECTIONS.reviews),
    ]);

    res.json({
      totalClients: clients.length,
      totalFundis: fundis.length,
      totalJobs: jobs.length,
      totalApplications: applications.length,
      totalReviews: reviews.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load reports" });
  }
});

router.get("/fundi-reports", async (req, res) => {
  try {
    const [reports, fundis, clients, jobs] = await Promise.all([
      all(COLLECTIONS.reports),
      all(COLLECTIONS.fundis),
      all(COLLECTIONS.clients),
      all(COLLECTIONS.jobs),
    ]);

    const fundiById = new Map(fundis.map((fundi) => [String(fundi.id), fundi]));
    const clientById = new Map(clients.map((client) => [String(client.id), client]));
    const jobById = new Map(jobs.map((job) => [String(job.id), job]));

    const rows = reports.map((report) => {
      const fundi = fundiById.get(String(report.fundi_id)) || {};
      const client = clientById.get(String(report.client_id)) || {};
      const job = jobById.get(String(report.job_id)) || {};

      return {
        ...report,
        fundi_name: fundi.name,
        fundi_email: fundi.email,
        is_flagged: fundi.is_flagged,
        is_banned: fundi.is_banned,
        client_name: client.name,
        client_email: client.email,
        job_title: job.title,
      };
    });

    res.json(sortByDateDesc(rows, "created_at"));
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
    const job = await getById(COLLECTIONS.jobs, job_id);
    const assignments = await whereEqual(COLLECTIONS.jobAssignments, "job_id", job_id);
    const assignment = assignments.find(
      (item) => String(item.fundi_id) === String(fundi_id)
    );

    if (!assignment || String(job?.client_id) !== String(client_id)) {
      return res.status(403).json({
        error: "You can only report the fundi assigned to your job",
      });
    }

    await addWithId(COLLECTIONS.reports, {
      job_id: Number(job_id),
      client_id: Number(client_id),
      fundi_id: Number(fundi_id),
      reason,
      details: details || "",
      status: "Pending",
      admin_note: null,
      created_at: timestamp(),
      reviewed_at: null,
    });

    await updateById(COLLECTIONS.fundis, fundi_id, { is_flagged: 1 });

    await createNotification(
      1,
      "admin",
      "fundi_reported",
      `A client reported a fundi for job #${job_id}. Please review it.`
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
    const report = await getById(COLLECTIONS.reports, req.params.id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    await updateById(COLLECTIONS.reports, req.params.id, {
      status,
      admin_note: admin_note || null,
      reviewed_at: timestamp(),
    });

    await updateById(COLLECTIONS.fundis, report.fundi_id, {
      is_banned: ban_fundi ? 1 : 0,
      is_flagged: status === "Reviewed" ? 1 : 0,
    });

    res.json({ message: "Report updated" });
  } catch (err) {
    console.error("Failed to update report:", err);
    res.status(500).json({ error: "Failed to update report" });
  }
});

module.exports = router;
