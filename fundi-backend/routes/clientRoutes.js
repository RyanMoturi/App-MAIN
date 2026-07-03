const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

const saltRounds = 10;

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
      `SELECT *
       FROM jobs
       WHERE client_id=?
       ORDER BY created_at DESC`,
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

module.exports = router;