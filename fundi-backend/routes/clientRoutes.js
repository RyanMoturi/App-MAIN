const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const {
  COLLECTIONS,
  addWithId,
  all,
  findOne,
  getById,
  sortByDateDesc,
  timestamp,
  toDataUrl,
  updateById,
} = require("../firestoreStore");
const { uploadFile } = require("../storageStore");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const saltRounds = 10;

const buildClientJobs = async (clientId) => {
  const [jobs, applications, assignments, fundis] = await Promise.all([
    all(COLLECTIONS.jobs),
    all(COLLECTIONS.applications),
    all(COLLECTIONS.jobAssignments),
    all(COLLECTIONS.fundis),
  ]);

  const fundiById = new Map(fundis.map((fundi) => [String(fundi.id), fundi]));

  return sortByDateDesc(
    jobs
      .filter((job) => String(job.client_id) === String(clientId))
      .map((job) => {
        const accepted = applications.find(
          (application) =>
            String(application.job_id) === String(job.id) &&
            application.status === "Accepted"
        );
        const assignment = assignments.find(
          (item) => String(item.job_id) === String(job.id)
        );
        const fundi = accepted ? fundiById.get(String(accepted.fundi_id)) : null;

        return {
          ...job,
          status: assignment?.completed_at
            ? "Completed"
            : accepted || assignment
              ? "In Progress"
              : "Open",
          is_taken: accepted || assignment ? 1 : 0,
          accepted_fundi_id: accepted?.fundi_id || assignment?.fundi_id || null,
          accepted_fundi_name: fundi?.name || null,
          completed_at: assignment?.completed_at || null,
        };
      }),
    "created_at"
  );
};

router.post("/signup", async (req, res) => {
  const { name, email, password, location, phone_number } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const existing = await findOne(COLLECTIONS.clients, "email", email);

    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
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
    res.status(500).json({ error: "Server error during client signup" });
  }
});

router.get("/:clientId/jobs", async (req, res) => {
  try {
    res.json(await buildClientJobs(req.params.clientId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

router.get("/:clientId/profile", async (req, res) => {
  try {
    const client = await getById(COLLECTIONS.clients, req.params.clientId);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const { password_hash, ...safeClient } = client;
    res.json({
      ...safeClient,
      profile_photo: toDataUrl(client.profile_photo),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch client profile" });
  }
});

router.put("/:clientId/profile", upload.single("profile_photo"), async (req, res) => {
  try {
    const { name, email, location, phone_number } = req.body;
    const client = await getById(COLLECTIONS.clients, req.params.clientId);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const update = {
      name,
      email,
      location,
      phone_number: phone_number ? Number(phone_number) : null,
    };

    if (req.file) {
      update.profile_photo = await uploadFile(req.file, "clients/profile-photos");
    }

    await updateById(COLLECTIONS.clients, req.params.clientId, update);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update client profile" });
  }
});

module.exports = router;
