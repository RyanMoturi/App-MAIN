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
      "SELECT COUNT(*) AS total FROM job_applications"
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

module.exports = router;