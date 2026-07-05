const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const db = require("../db");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const saltRounds = 10;

const toDataUrl = (buffer) => {
  if (!buffer) return null;
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
};

// ================= CLIENT SIGNUP =================
router.post("/signup", async (req, res) => {
  const {
    name,
    email,
    password,
    location,
    phone_number
  } = req.body;

  if (!password) {
    return res.status(400).json({
      error: "Password is required",
    });
  }

  try {
    const [existing] = await db.query(
      "SELECT * FROM clients WHERE email=?",
      [email]
    );

    if (existing.length) {
      return res.status(400).json({
        error: "Email already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      saltRounds
    );

    await db.query(
      `INSERT INTO clients
      (name,email,location,password_hash,phone_number)
      VALUES (?,?,?,?,?)`,
      [
        name,
        email,
        location,
        hashedPassword,
        phone_number,
      ]
    );

    res.status(201).json({
      message: "Client registered successfully",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error during client signup",
    });
  }
});

// ================= GET CLIENT JOBS =================
router.get("/:clientId/jobs", async (req, res) => {

  try {

    const [jobs] = await db.query(
      `SELECT
        j.*,
        CASE
          WHEN assignment.completed_at IS NOT NULL THEN 'Completed'
          WHEN accepted.id IS NOT NULL OR assignment.job_id IS NOT NULL THEN 'In Progress'
          ELSE 'Open'
        END AS status,
        CASE
          WHEN accepted.id IS NOT NULL OR assignment.job_id IS NOT NULL THEN 1
          ELSE 0
        END AS is_taken,
        accepted.fundi_id AS accepted_fundi_id,
        accepted.fundi_name AS accepted_fundi_name,
        assignment.completed_at
       FROM jobs j
       LEFT JOIN (
        SELECT a.job_id, a.fundi_id, f.name AS fundi_name, MIN(a.id) AS id
        FROM applications a
        JOIN fundis f ON f.id = a.fundi_id
        WHERE a.status = 'Accepted'
        GROUP BY a.job_id, a.fundi_id, f.name
       ) accepted ON accepted.job_id = j.id
       LEFT JOIN (
        SELECT job_id, fundi_id, MAX(completed_at) AS completed_at
        FROM job_assignments
        GROUP BY job_id, fundi_id
       ) assignment ON assignment.job_id = j.id
       WHERE j.client_id=?
       ORDER BY j.created_at DESC`,
      [req.params.clientId]
    );

    res.json(jobs);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to fetch jobs",
    });

  }

});

// ================= GET CLIENT PROFILE =================
router.get("/:clientId/profile", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, location, phone_number, profile_photo, created_at
       FROM clients
       WHERE id = ?`,
      [req.params.clientId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({
      ...rows[0],
      profile_photo: toDataUrl(rows[0].profile_photo),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch client profile" });
  }
});

// ================= UPDATE CLIENT PROFILE =================
router.put("/:clientId/profile", upload.single("profile_photo"), async (req, res) => {
  try {
    const { name, email, location, phone_number } = req.body;

    const [existing] = await db.query("SELECT id FROM clients WHERE id = ?", [
      req.params.clientId,
    ]);

    if (!existing.length) {
      return res.status(404).json({ error: "Client not found" });
    }

    if (req.file) {
      await db.query(
        `UPDATE clients
         SET name = ?, email = ?, location = ?, phone_number = ?, profile_photo = ?
         WHERE id = ?`,
        [name, email, location, phone_number, req.file.buffer, req.params.clientId]
      );
    } else {
      await db.query(
        `UPDATE clients
         SET name = ?, email = ?, location = ?, phone_number = ?
         WHERE id = ?`,
        [name, email, location, phone_number, req.params.clientId]
      );
    }

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update client profile" });
  }
});

module.exports = router;
