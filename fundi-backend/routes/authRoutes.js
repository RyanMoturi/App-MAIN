const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
require("dotenv").config();

const router = express.Router();

const jwtSecret = process.env.JWT_SECRET || "your_fallback_secret";

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  if (!["client", "fundi", "admin"].includes(role)) {
    return res.status(400).json({
      error: "Invalid role specified",
    });
  }

  let table = "";

  if (role === "client") table = "clients";
  if (role === "fundi") table = "fundis";
  if (role === "admin") table = "admins";

  try {
    const [rows] = await db.query(
      `SELECT * FROM ${table} WHERE email=?`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    const response = {
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role,
      },
    };

    if (role === "client") {
      response.clientId = user.id;
      response.user.name = user.name;
      response.user.location = user.location;
    }

    if (role === "fundi") {
      response.fundiId = user.id;
      response.user.name = user.name;
      response.user.location = user.location;
      response.user.skill = user.skill;
      response.user.bio = user.bio;
    }

    if (role === "admin") {
      response.adminId = user.id;
      response.user.name = user.full_name;
      response.user.username = user.username;
    }

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server error during login",
    });
  }
});

module.exports = router;