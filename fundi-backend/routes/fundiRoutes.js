const express = require("express");
const multer = require("multer");
const db = require("../db");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const toDataUrl = (buffer, mimeType = "image/jpeg") => {
  if (!buffer) return null;
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
};

// ================= GET ALL FUNDIS =================
router.get("/", async (req, res) => {

  try {
    const { category, skill, location } = req.query;
    const params = [];
    let where = "WHERE 1=1";

    if (category && category !== "All") {
      where += " AND skill = ?";
      params.push(category);
    }

    if (skill) {
      where += " AND skill LIKE ?";
      params.push(`%${skill}%`);
    }

    if (location) {
      where += " AND location LIKE ?";
      params.push(`%${location}%`);
    }

    const [fundis] = await db.query(`
      SELECT
        id,
        name,
        email,
        skill,
        bio,
        location,
        rating,
        phone_number,
        created_at
      FROM fundis
      ${where}
      ORDER BY rating DESC
    `, params);

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
        phone_number,
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
        rating,
        phone_number
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
router.get("/:id/completed-jobs", async (req, res) => {
  try {
    const [jobs] = await db.query(
      `SELECT
        j.id,
        j.title,
        j.description,
        j.location,
        j.skill_required,
        j.image_url,
        j.created_at,
        ja.assigned_at,
        ja.completed_at,
        r.rating,
        r.comment
       FROM job_assignments ja
       JOIN jobs j ON j.id = ja.job_id
       LEFT JOIN reviews r ON r.job_id = j.id AND r.fundi_id = ja.fundi_id
       WHERE ja.fundi_id = ? AND ja.completed_at IS NOT NULL
       ORDER BY ja.completed_at DESC`,
      [req.params.id]
    );

    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch completed jobs",
    });
  }
});

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
        phone_number,
        national_id,
        is_verified,
        verification_status,
        verification_note,
        rating,
        profile_photo,
        good_conduct_certificate,
        professional_certificates,
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

    res.json({
      ...rows[0],
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

    res.status(500).json({
      error: "Server error",
    });

  }

});

// ================= UPDATE ONE FUNDI =================
router.put(
  "/:id",
  upload.fields([
    { name: "profile_photo", maxCount: 1 },
    { name: "good_conduct_certificate", maxCount: 1 },
    { name: "professional_certificates", maxCount: 1 },
  ]),
  async (req, res) => {
  try {
    const { name, email, location, skill, bio, phone_number } = req.body;

    const [existing] = await db.query("SELECT id FROM fundis WHERE id = ?", [
      req.params.id,
    ]);

    if (!existing.length) {
      return res.status(404).json({
        error: "Fundi not found",
      });
    }

    const updates = [
      "name = ?",
      "email = ?",
      "location = ?",
      "skill = ?",
      "bio = ?",
      "phone_number = ?",
    ];
    const params = [name, email, location, skill, bio, phone_number];

    if (req.files?.profile_photo?.[0]) {
      updates.push("profile_photo = ?");
      params.push(req.files.profile_photo[0].buffer);
    }

    if (req.files?.good_conduct_certificate?.[0]) {
      updates.push("good_conduct_certificate = ?");
      params.push(req.files.good_conduct_certificate[0].buffer);
    }

    if (req.files?.professional_certificates?.[0]) {
      updates.push("professional_certificates = ?");
      params.push(req.files.professional_certificates[0].buffer);
    }

    params.push(req.params.id);

    await db.query(
      `UPDATE fundis
       SET ${updates.join(", ")}
       WHERE id = ?`,
      params
    );

    res.json({
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to update profile",
    });
  }
});

module.exports = router;
