const express = require("express");
const multer = require("multer");
const {
  COLLECTIONS,
  addWithId,
  all,
  createNotification,
  deleteById,
  getById,
  sortByDateDesc,
  timestamp,
  updateById,
  whereEqual,
} = require("./firestoreStore");
const { uploadFile } = require("./storageStore");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const budgetFields = (source = {}) => {
  const budgetType =
    source.budgetType === "fixed" || source.budget_type === "fixed"
      ? "fixed"
      : "negotiable";
  const amount = Number(source.budgetAmount ?? source.budget_amount);

  if (budgetType === "fixed" && (!Number.isFinite(amount) || amount < 1)) {
    const error = new Error("Enter a valid budget of at least KES 1");
    error.status = 400;
    throw error;
  }

  return {
    budget_type: budgetType,
    budget_amount: budgetType === "fixed" ? Math.round(amount) : null,
  };
};

const buildJobRows = async (filter = () => true) => {
  const [jobs, applications, assignments, fundis] = await Promise.all([
    all(COLLECTIONS.jobs),
    all(COLLECTIONS.applications),
    all(COLLECTIONS.jobAssignments),
    all(COLLECTIONS.fundis),
  ]);

  const fundiById = new Map(fundis.map((fundi) => [String(fundi.id), fundi]));

  return sortByDateDesc(
    jobs.filter(filter).map((job) => {
      const accepted = applications.find(
        (application) =>
          String(application.job_id) === String(job.id) &&
          application.status === "Accepted"
      );
      const assignment = assignments.find(
        (item) => String(item.job_id) === String(job.id)
      );
      const acceptedFundi = accepted ? fundiById.get(String(accepted.fundi_id)) : null;

      return {
        ...job,
        status: assignment?.completed_at
          ? "Completed"
          : assignment?.payment_status === "Pending"
            ? "Payment Pending"
            : assignment?.completion_requested_at
              ? "Awaiting Payment"
          : accepted || assignment
            ? "In Progress"
            : "Open",
        is_taken: accepted || assignment ? 1 : 0,
        accepted_fundi_id: accepted?.fundi_id || assignment?.fundi_id || null,
        accepted_fundi_name: acceptedFundi?.name || null,
        completed_at: assignment?.completed_at || null,
        agreed_price: assignment?.agreed_price ?? null,
        price_set_at: assignment?.price_set_at || null,
        completion_requested_at: assignment?.completion_requested_at || null,
        payment_status: assignment?.payment_status || "Not started",
        paid_at: assignment?.paid_at || null,
      };
    }),
    "created_at"
  );
};

router.post("/jobs", upload.single("image"), async (req, res) => {
  const { title, description, location, skillRequired, clientId } = req.body;

  try {
    const image_url = req.file ? await uploadFile(req.file, "jobs/images") : null;
    const job = await addWithId(COLLECTIONS.jobs, {
      title,
      description,
      location,
      skill_required: skillRequired,
      ...budgetFields(req.body),
      client_id: Number(clientId),
      image_url,
      created_at: timestamp(),
    });

    res.status(201).json({
      message: "Job posted successfully",
      jobId: job.id,
      image_url,
    });
  } catch (err) {
    console.error("Error posting job:", err);
    res.status(500).json({ error: "Error posting job" });
  }
});

router.get("/jobs", async (req, res) => {
  try {
    res.json(await buildJobRows());
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ error: "Error fetching jobs" });
  }
});

router.get("/client/:clientId/jobs", async (req, res) => {
  const { clientId } = req.params;

  try {
    res.json(await buildJobRows((job) => String(job.client_id) === String(clientId)));
  } catch (err) {
    console.error("Error fetching client jobs:", err);
    res.status(500).json({ error: "Error fetching client jobs" });
  }
});

router.get("/jobs/:id", async (req, res) => {
  try {
    const rows = await buildJobRows((job) => String(job.id) === String(req.params.id));
    if (!rows.length) return res.status(404).json({ error: "Job not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching job:", err);
    res.status(500).json({ error: "Error fetching job" });
  }
});

router.put("/jobs/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { title, description, location, skillRequired, clientId } = req.body;

  try {
    const existing = await getById(COLLECTIONS.jobs, id);
    if (!existing) return res.status(404).json({ error: "Job not found" });

    if (String(existing.client_id) !== String(clientId)) {
      return res.status(403).json({ error: "Not authorized to edit this job" });
    }

    await updateById(COLLECTIONS.jobs, id, {
      title,
      description,
      location,
      skill_required: skillRequired,
      ...budgetFields(req.body),
      image_url: req.file ? await uploadFile(req.file, "jobs/images") : existing.image_url,
    });

    res.json({ message: "Job updated successfully" });
  } catch (err) {
    console.error("Error updating job:", err);
    res.status(500).json({ error: "Error updating job" });
  }
});

router.put("/jobs/:id/complete", async (req, res) => {
  res.status(410).json({
    error:
      "The assigned fundi must mark the work as finished, then the client completes payment.",
  });
});

router.delete("/jobs/:id", async (req, res) => {
  const { id } = req.params;
  const { clientId } = req.body;

  try {
    const existing = await getById(COLLECTIONS.jobs, id);
    if (!existing) return res.status(404).json({ error: "Job not found" });

    if (String(existing.client_id) !== String(clientId)) {
      return res.status(403).json({ error: "Not authorized to delete this job" });
    }

    await deleteById(COLLECTIONS.jobs, id);
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("Error deleting job:", err);
    res.status(500).json({ error: "Error deleting job" });
  }
});

module.exports = router;
