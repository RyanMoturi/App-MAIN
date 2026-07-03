const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

const saltRounds = 10;

// ================= FUNDI SIGNUP =================
router.post("/signup", async (req, res) => {
  const {
    name,
    email,
    password,
    skill,
    bio,
    location,
  } = req.body;

  if (!password) {
    return res.status(400).json({
      error: "Password is required",
    });
  }

  try {
    const [existing] = await db.query(
      "SELECT * FROM fundis WHERE email=?",
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
      `INSERT INTO fundis
      (name,email,skill,bio,location,password_hash,rating)
      VALUES (?,?,?,?,?,?,?)`,
      [
        name,
        email,
        skill,
        bio || "",
        location,
        hashedPassword,
        0,
      ]
    );

    res.status(201).json({
      message: "Fundi registered successfully",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error during signup",
    });
  }
});


// ================= GET ALL FUNDIS =================
router.get("/", async (req, res) => {

  try {

    const [fundis] = await db.query(`
      SELECT
        id,
        name,
        email,
        skill,
        bio,
        location,
        rating,
        created_at
      FROM fundis
      ORDER BY rating DESC
    `);

    res.json(fundis);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to load fundis",
    });

  }

});


// ================= SEARCH FUNDIS =================
router.get("/search/:search", async (req, res) => {

  const search = `%${req.params.search}%`;

  try {

    const [fundis] = await db.query(
      `SELECT
        id,
        name,
        email,
        skill,
        bio,
        location,
        rating,
        created_at
      FROM fundis
      WHERE
          name LIKE ?
       OR skill LIKE ?
       OR email LIKE ?
       OR location LIKE ?
      ORDER BY rating DESC`,
      [search, search, search, search]
    );

    res.json(fundis);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Search failed",
    });

  }

});


// ================= SEARCH BY CATEGORY =================
router.get("/category/:skill", async (req, res) => {

  try {

    const [fundis] = await db.query(
      `SELECT
        id,
        name,
        email,
        skill,
        bio,
        location,
        rating
      FROM fundis
      WHERE skill = ?
      ORDER BY rating DESC`,
      [req.params.skill]
    );

    res.json(fundis);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to fetch category",
    });

  }

});


// ================= GET ONE FUNDI =================
router.get("/:id", async (req, res) => {

  try {

    const [rows] = await db.query(
      `SELECT
        id,
        name,
        email,
        skill,
        bio,
        location,
        rating,
        created_at
      FROM fundis
      WHERE id=?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "Fundi not found",
      });
    }

    res.json(rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error",
    });

  }

});

module.exports = router;