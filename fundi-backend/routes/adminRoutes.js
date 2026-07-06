const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

const saltRounds = 10;

const toDataUrl = (buffer, mimeType = "image/jpeg") => {
  if (!buffer) return null;
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
};

// ================= ADMIN SIGNUP =================
router.post("/signup", async (req, res) => {
  const {
    full_name,
    email,
    username,
    password,
  } = req.body;

  try {
    const [existing] = await db.query(
      "SELECT * FROM admins WHERE email=?",
      [email]
    );

    if (existing.length) {
      return res.status(400).json({
        error: "Admin already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      saltRounds
    );

    await db.query(
      `INSERT INTO admins
      (full_name,email,username,password_hash,role)
      VALUES (?,?,?,?,?)`,
      [
        full_name,
        email,
        username,
        hashedPassword,
        "Super Admin",
      ]
    );

    res.status(201).json({
      message: "Admin created successfully",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
});


// ================= DASHBOARD =================
router.get("/dashboard", async (req, res) => {

  try {

    const [[clientCount]] = await db.query(
      "SELECT COUNT(*) AS totalClients FROM clients"
    );

    const [[fundiCount]] = await db.query(
      "SELECT COUNT(*) AS totalFundis FROM fundis"
    );

    const [[jobCount]] = await db.query(
      "SELECT COUNT(*) AS totalJobs FROM jobs"
    );

    const [[skillCount]] = await db.query(
      "SELECT COUNT(DISTINCT skill) AS totalSkills FROM fundis"
    );

    const [recentClients] = await db.query(`
      SELECT id,name,email,created_at
      FROM clients
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const [recentFundis] = await db.query(`
      SELECT id,name,skill,location,rating,is_verified,verification_status,is_flagged,is_banned,created_at
      FROM fundis
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      clients: clientCount.totalClients,
      fundis: fundiCount.totalFundis,
      jobs: jobCount.totalJobs,
      skills: skillCount.totalSkills,
      recentClients,
      recentFundis,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Dashboard failed",
    });

  }

});


// ================= GET ALL CLIENTS =================
router.get("/clients", async (req, res) => {

  try {

    const [clients] = await db.query(`
      SELECT
        id,
        name,
        email,
        location,
        phone_number,
        created_at
      FROM clients
      ORDER BY created_at DESC
    `);

    res.json(clients);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to load clients",
    });

  }

});


// ================= SEARCH CLIENTS =================
router.get("/clients/search/:search", async (req, res) => {

  const search = `%${req.params.search}%`;

  try {

    const [clients] = await db.query(
      `SELECT
        id,
        name,
        email,
        location,
        phone_number,
        created_at
      FROM clients
      WHERE
        name LIKE ?
        OR email LIKE ?
        OR location LIKE ?
      ORDER BY created_at DESC`,
      [search, search, search]
    );

    res.json(clients);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Search failed",
    });

  }

});


// ================= DELETE CLIENT =================
router.delete("/client/:id", async (req, res) => {

  try {

    const [result] = await db.query(
      "DELETE FROM clients WHERE id=?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    res.json({
      message: "Client deleted successfully",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to delete client",
    });

  }

});


// ================= GET ALL FUNDIS =================
router.get("/fundis", async (req, res) => {

  try {

    const [fundis] = await db.query(`
      SELECT
        id,
        name,
        email,
        skill,
        location,
        rating,
        is_verified,
        verification_status,
        is_flagged,
        is_banned,
        created_at
      FROM fundis
      ORDER BY created_at DESC
    `);

    res.json(fundis);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to load fundis",
    });

  }

});


// ================= DELETE FUNDI =================
router.delete("/fundi/:id", async (req, res) => {

  try {

    const [result] = await db.query(
      "DELETE FROM fundis WHERE id=?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Fundi not found",
      });
    }

    res.json({
      message: "Fundi deleted successfully",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to delete fundi",
    });

  }

});

// ================= GET FUNDI VERIFICATION DETAILS =================
router.get("/fundi/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        name,
        email,
        national_id,
        id_photo,
        profile_photo,
        good_conduct_certificate,
        professional_certificates,
        skill,
        bio,
        location,
        phone_number,
        rating,
        is_verified,
        verification_status,
        verification_note,
        is_flagged,
        is_banned,
        created_at
       FROM fundis
       WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Fundi not found" });
    }

    res.json({
      ...rows[0],
      id_photo: toDataUrl(rows[0].id_photo),
      profile_photo: toDataUrl(rows[0].profile_photo),
      good_conduct_certificate: toDataUrl(
        rows[0].good_conduct_certificate,
        "application/octet-stream"
      ),
      professional_certificates: toDataUrl(
        rows[0].professional_certificates,
        "application/octet-stream"
      ),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load fundi details" });
  }
});

// ================= VERIFY / REJECT FUNDI =================
router.put("/fundi/:id/verification", async (req, res) => {
  const { status, note } = req.body;

  if (!["Verified", "Rejected", "Pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid verification status" });
  }

  try {
    const isVerified = status === "Verified" ? 1 : 0;

    const [result] = await db.query(
      `UPDATE fundis
       SET is_verified = ?, verification_status = ?, verification_note = ?
       WHERE id = ?`,
      [isVerified, status, note || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Fundi not found" });
    }

    res.json({ message: `Fundi marked as ${status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update verification" });
  }
});

module.exports = router;
