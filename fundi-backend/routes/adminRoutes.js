const express = require("express");
const bcrypt = require("bcryptjs");
const {
  COLLECTIONS,
  addWithId,
  all,
  deleteById,
  findOne,
  getById,
  sortByDateDesc,
  timestamp,
  toDataUrl,
  updateById,
} = require("../firestoreStore");

const router = express.Router();
const saltRounds = 10;

const matches = (value, search) =>
  String(value || "").toLowerCase().includes(String(search || "").toLowerCase());

router.post("/signup", async (req, res) => {
  const { full_name, email, username, password } = req.body;

  try {
    const existing = await findOne(COLLECTIONS.admins, "email", email);

    if (existing) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await addWithId(COLLECTIONS.admins, {
      full_name,
      email,
      username,
      password_hash: hashedPassword,
      role: "Super Admin",
      created_at: timestamp(),
    });

    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const [clients, fundis, jobs] = await Promise.all([
      all(COLLECTIONS.clients),
      all(COLLECTIONS.fundis),
      all(COLLECTIONS.jobs),
    ]);

    const skills = new Set(fundis.map((fundi) => fundi.skill).filter(Boolean));

    res.json({
      clients: clients.length,
      fundis: fundis.length,
      jobs: jobs.length,
      skills: skills.size,
      recentClients: sortByDateDesc(clients, "created_at")
        .slice(0, 5)
        .map(({ id, name, email, created_at }) => ({ id, name, email, created_at })),
      recentFundis: sortByDateDesc(fundis, "created_at").slice(0, 5).map((fundi) => ({
        id: fundi.id,
        name: fundi.name,
        skill: fundi.skill,
        location: fundi.location,
        rating: fundi.rating,
        is_verified: fundi.is_verified,
        verification_status: fundi.verification_status,
        is_flagged: fundi.is_flagged,
        is_banned: fundi.is_banned,
        created_at: fundi.created_at,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Dashboard failed" });
  }
});

router.get("/clients", async (req, res) => {
  try {
    const clients = sortByDateDesc(await all(COLLECTIONS.clients), "created_at").map(
      ({ id, name, email, location, phone_number, created_at }) => ({
        id,
        name,
        email,
        location,
        phone_number,
        created_at,
      })
    );

    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load clients" });
  }
});

router.get("/clients/search/:search", async (req, res) => {
  try {
    const search = req.params.search;
    const clients = sortByDateDesc(await all(COLLECTIONS.clients), "created_at")
      .filter(
        (client) =>
          matches(client.name, search) ||
          matches(client.email, search) ||
          matches(client.location, search)
      )
      .map(({ id, name, email, location, phone_number, created_at }) => ({
        id,
        name,
        email,
        location,
        phone_number,
        created_at,
      }));

    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

router.delete("/client/:id", async (req, res) => {
  try {
    if (!(await deleteById(COLLECTIONS.clients, req.params.id))) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

router.get("/fundis", async (req, res) => {
  try {
    const fundis = sortByDateDesc(await all(COLLECTIONS.fundis), "created_at").map((fundi) => ({
      id: fundi.id,
      name: fundi.name,
      email: fundi.email,
      skill: fundi.skill,
      location: fundi.location,
      rating: fundi.rating,
      is_verified: fundi.is_verified,
      verification_status: fundi.verification_status,
      is_flagged: fundi.is_flagged,
      is_banned: fundi.is_banned,
      created_at: fundi.created_at,
    }));

    res.json(fundis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load fundis" });
  }
});

router.delete("/fundi/:id", async (req, res) => {
  try {
    if (!(await deleteById(COLLECTIONS.fundis, req.params.id))) {
      return res.status(404).json({ error: "Fundi not found" });
    }

    res.json({ message: "Fundi deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete fundi" });
  }
});

router.get("/fundi/:id", async (req, res) => {
  try {
    const fundi = await getById(COLLECTIONS.fundis, req.params.id);

    if (!fundi) {
      return res.status(404).json({ error: "Fundi not found" });
    }

    const { password_hash, ...safeFundi } = fundi;
    res.json({
      ...safeFundi,
      id_photo: toDataUrl(fundi.id_photo),
      profile_photo: toDataUrl(fundi.profile_photo),
      good_conduct_certificate: toDataUrl(fundi.good_conduct_certificate, "application/octet-stream"),
      professional_certificates: toDataUrl(fundi.professional_certificates, "application/octet-stream"),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load fundi details" });
  }
});

router.put("/fundi/:id/verification", async (req, res) => {
  const { status, note } = req.body;

  if (!["Verified", "Rejected", "Pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid verification status" });
  }

  try {
    const updated = await updateById(COLLECTIONS.fundis, req.params.id, {
      is_verified: status === "Verified" ? 1 : 0,
      verification_status: status,
      verification_note: note || null,
    });

    if (!updated) {
      return res.status(404).json({ error: "Fundi not found" });
    }

    res.json({ message: `Fundi marked as ${status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update verification" });
  }
});

module.exports = router;
