const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const db = require("../db");
require("dotenv").config();

const router = express.Router();

const jwtSecret = process.env.JWT_SECRET || "your_fallback_secret";
const saltRounds = 10;

/* ===========================================================
   MULTER CONFIGURATION
=========================================================== */

const storage = multer.memoryStorage();

const upload = multer({
  storage,
});

/* ===========================================================
   CLIENT SIGNUP
=========================================================== */

router.post("/signup/client", async (req, res) => {
  const {
    name,
    email,
    password,
    phone_number,
    location,
  } = req.body;

  try {
    const [existing] = await db.query(
      "SELECT * FROM clients WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Email already exists",
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
      error: "Server error during signup",
    });
  }
});
/* ===========================================================
   FUNDI SIGNUP
=========================================================== */

router.post(
  "/signup/fundi",
  upload.fields([
    { name: "id_photo", maxCount: 1 },
    { name: "profile_photo", maxCount: 1 },
  ]),
  async (req, res) => {
    const {
      name,
      email,
      password,
      national_id,
      skill,
      bio,
      location,
    } = req.body;

    try {
      const [existing] = await db.query(
        "SELECT * FROM fundis WHERE email = ?",
        [email]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          error: "Email already exists",
        });
      }

      if (!/^\d{6,}$/.test(national_id)) {
        return res.status(400).json({
          error: "National ID must contain at least 6 digits.",
        });
      }

      if (
        !req.files ||
        !req.files.id_photo ||
        !req.files.profile_photo
      ) {
        return res.status(400).json({
          error: "Both ID photo and profile photo are required.",
        });
      }

      // Store the actual image bytes
      const idPhoto = req.files.id_photo[0].buffer;
      const profilePhoto = req.files.profile_photo[0].buffer;

      const hashedPassword = await bcrypt.hash(
        password,
        saltRounds
      );

      await db.query(
        `INSERT INTO fundis
        (
          name,
          email,
          national_id,
          id_photo,
          profile_photo,
          skill,
          bio,
          location,
          password_hash,
          rating
        )
        VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          name,
          email,
          national_id,
          idPhoto,
          profilePhoto,
          skill,
          bio,
          location,
          hashedPassword,
          5.0,
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
  }
);
/* ===========================================================
   LOGIN
=========================================================== */

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
      `SELECT * FROM ${table} WHERE email = ?`,
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
      response.user.phone_number = user.phone_number;
    }

    if (role === "fundi") {

      response.fundiId = user.id;
      response.user.name = user.name;
      response.user.location = user.location;
      response.user.skill = user.skill;
      response.user.bio = user.bio;
      response.user.rating = user.rating;
      response.user.national_id = user.national_id;

      // Convert BLOB images to Base64 strings
      response.user.id_photo = user.id_photo
        ? user.id_photo.toString("base64")
        : null;

      response.user.profile_photo = user.profile_photo
        ? user.profile_photo.toString("base64")
        : null;
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