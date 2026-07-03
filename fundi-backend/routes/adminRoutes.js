const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

const saltRounds = 10;

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
      SELECT id,name,skill,location,rating,created_at
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

module.exports = router;