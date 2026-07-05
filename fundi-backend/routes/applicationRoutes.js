const express = require("express");
const db = require("../db");

const router = express.Router();

/*
========================================
Apply for a Job
POST /api/applications/apply
========================================
*/

router.post("/apply", async (req, res) => {
  try {
    const { jobId, fundiId, message } = req.body;

    if (!jobId || !fundiId) {
      return res.status(400).json({
        message: "Job ID and Fundi ID are required."
      });
    }

    // Prevent duplicate applications
    const [existing] = await db.query(
      "SELECT * FROM applications WHERE job_id = ? AND fundi_id = ?",
      [jobId, fundiId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "You have already applied for this job."
      });
    }

    await db.query(
      `INSERT INTO applications
      (job_id, fundi_id, message)
      VALUES (?, ?, ?)`,
      [jobId, fundiId, message || ""]
    );

    res.json({
      message: "Application submitted successfully."
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server Error"
    });
  }
});

/*
========================================
Get My Applications
GET /api/applications/fundi/:id
========================================
*/

router.get("/fundi/:id", async (req, res) => {
  try {

    const fundiId = req.params.id;

    const [applications] = await db.query(
      `SELECT
          applications.id,
          applications.status,
          applications.message,
          jobs.title,
          jobs.location,
          jobs.skill_required
      FROM applications
      JOIN jobs
      ON applications.job_id = jobs.id
      WHERE applications.fundi_id = ?
      ORDER BY applications.applied_at DESC`,
      [fundiId]
    );

    res.json(applications);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server Error"
    });
  }
});

/*
========================================
Get Applications For One Job
GET /api/applications/job/:jobId
========================================
*/

router.get("/job/:jobId", async (req, res) => {
  try {

    const jobId = req.params.jobId;

    const [applications] = await db.query(
      `
      SELECT
        applications.id,
        applications.status,
        applications.message,
        applications.applied_at,

        fundis.id AS fundi_id,
        fundis.name,
        fundis.email,
        fundis.phone_number,
        fundis.skill,
        fundis.location,
        fundis.rating

      FROM applications

      JOIN fundis
      ON applications.fundi_id = fundis.id

      WHERE applications.job_id = ?

      ORDER BY applications.applied_at DESC
      `,
      [jobId]
    );

    res.json(applications);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server Error"
    });

  }
});

/*
========================================
Accept Application
PUT /api/applications/:id/accept
========================================
*/

router.put("/:id/accept", async (req, res) => {
  try {

    const applicationId = req.params.id;

    // Get application
    const [application] = await db.query(
      "SELECT * FROM applications WHERE id = ?",
      [applicationId]
    );

    if (application.length === 0) {
      return res.status(404).json({
        message: "Application not found."
      });
    }

    const jobId = application[0].job_id;

    // Accept selected application
    await db.query(
      "UPDATE applications SET status = 'accepted' WHERE id = ?",
      [applicationId]
    );

    // Reject all other applications for this job
    await db.query(
      `UPDATE applications
       SET status = 'rejected'
       WHERE job_id = ? AND id <> ?`,
      [jobId, applicationId]
    );

    // Update the job status
    await db.query(
      "UPDATE jobs SET status = 'unavailable' WHERE id = ?",
      [jobId]
    );

    res.json({
      message: "Application accepted successfully."
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server Error"
    });

  }
});

/*
========================================
Withdraw Application
DELETE /api/applications/:id
========================================
*/

router.delete("/:id", async (req, res) => {

  try {

    await db.query(
      "DELETE FROM applications WHERE id = ?",
      [req.params.id]
    );

    res.json({
      message: "Application withdrawn."
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server Error"
    });

  }

});

module.exports = router;