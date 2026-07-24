const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const {
  COLLECTIONS,
  addWithId,
  findOne,
  timestamp,
  toDataUrl,
} = require("../firestoreStore");
const { uploadFile } = require("../storageStore");
require("dotenv").config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required.");
}
const saltRounds = 10;

router.post("/signup/client", async (req, res) => {
  const { name, email, password, phone_number, location } = req.body;

  try {
    const existing = await findOne(COLLECTIONS.clients, "email", email);

    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await addWithId(COLLECTIONS.clients, {
      name,
      email,
      location,
      password_hash: hashedPassword,
      phone_number: phone_number ? Number(phone_number) : null,
      profile_photo: null,
      created_at: timestamp(),
    });

    res.status(201).json({ message: "Client registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during signup" });
  }
});

router.post(
  "/signup/fundi",
  upload.fields([
    { name: "id_photo", maxCount: 1 },
    { name: "profile_photo", maxCount: 1 },
    { name: "good_conduct_certificate", maxCount: 1 },
    { name: "professional_certificates", maxCount: 1 },
  ]),
  async (req, res) => {
    const { name, email, password, national_id, skill, bio, location } = req.body;

    try {
      const existing = await findOne(COLLECTIONS.fundis, "email", email);

      if (existing) {
        return res.status(400).json({ error: "Email already exists" });
      }

      if (!/^\d{6,}$/.test(national_id)) {
        return res.status(400).json({
          error: "National ID must contain at least 6 digits.",
        });
      }

      if (!req.files?.id_photo || !req.files?.profile_photo) {
        return res.status(400).json({
          error: "Both ID photo and profile photo are required.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const [
        idPhotoUrl,
        profilePhotoUrl,
        goodConductCertificateUrl,
        professionalCertificatesUrl,
      ] = await Promise.all([
        uploadFile(req.files.id_photo[0], "fundis/id-photos"),
        uploadFile(req.files.profile_photo[0], "fundis/profile-photos"),
        uploadFile(req.files.good_conduct_certificate?.[0], "fundis/good-conduct"),
        uploadFile(req.files.professional_certificates?.[0], "fundis/professional-certificates"),
      ]);

      await addWithId(COLLECTIONS.fundis, {
        name,
        email,
        national_id,
        id_photo: idPhotoUrl,
        profile_photo: profilePhotoUrl,
        good_conduct_certificate: goodConductCertificateUrl,
        professional_certificates: professionalCertificatesUrl,
        skill,
        bio,
        location,
        password_hash: hashedPassword,
        rating: 5.0,
        phone_number: null,
        is_verified: 0,
        verification_status: "Pending",
        verification_note: null,
        is_flagged: 0,
        is_banned: 0,
        created_at: timestamp(),
      });

      res.status(201).json({
        message: "Fundi registered successfully. Your account is pending admin verification.",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error during signup" });
    }
  }
);

router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  if (!["client", "fundi", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  const collection =
    role === "client"
      ? COLLECTIONS.clients
      : role === "fundi"
        ? COLLECTIONS.fundis
        : COLLECTIONS.admins;

  try {
    const user = await findOne(collection, "email", email);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id, role }, jwtSecret, { expiresIn: "7d" });

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
      response.user.is_verified = Boolean(user.is_verified);
      response.user.verification_status = user.verification_status;
      response.user.verification_note = user.verification_note;
      response.user.id_photo = toDataUrl(user.id_photo);
      response.user.profile_photo = toDataUrl(user.profile_photo);
    }

    if (role === "admin") {
      response.adminId = user.id;
      response.user.name = user.full_name;
      response.user.username = user.username;
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login" });
  }
});

module.exports = router;
