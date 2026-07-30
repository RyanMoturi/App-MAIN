const express = require("express");
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
} = require("../firestoreStore");

const router = express.Router();
const { authenticate } = require("../authMiddleware");

const getAcceptedApplication = async (jobId) => {
  const applications = await whereEqual(COLLECTIONS.applications, "job_id", jobId);
  return applications.find((application) => application.status === "Accepted") || null;
};

router.post("/apply", async (req, res) => {
  try {
    const { jobId, fundiId, message } = req.body;

    if (!jobId || !fundiId) {
      return res.status(400).json({ message: "Job ID and Fundi ID are required." });
    }

    const job = await getById(COLLECTIONS.jobs, jobId);
    if (!job) return res.status(404).json({ message: "Job not found." });

    if (await getAcceptedApplication(jobId)) {
      return res.status(400).json({ message: "This job is already taken." });
    }

    const fundiAccount = await getById(COLLECTIONS.fundis, fundiId);
    if (!fundiAccount) return res.status(404).json({ message: "Fundi account not found." });

    if (!fundiAccount.is_verified) {
      return res.status(403).json({
        message:
          fundiAccount.verification_status === "Rejected"
            ? "Your fundi account was not verified. Please contact admin."
            : "Your fundi account is pending admin verification. You cannot apply yet.",
      });
    }

    if (fundiAccount.is_banned) {
      return res.status(403).json({ message: "Your fundi account has been banned by admin." });
    }

    const existing = (await whereEqual(COLLECTIONS.applications, "job_id", jobId)).find(
      (application) => String(application.fundi_id) === String(fundiId)
    );

    if (existing) {
      return res.status(400).json({ message: "You have already applied for this job." });
    }

    await addWithId(COLLECTIONS.applications, {
      job_id: Number(jobId),
      fundi_id: Number(fundiId),
      message: message || "",
      status: "Pending",
      applied_at: timestamp(),
    });

    await createNotification(
      job.client_id,
      "client",
      "application",
      `${fundiAccount.name || "A fundi"} applied for "${job.title}".`,
      { job_id: Number(jobId) }
    );

    res.status(201).json({ message: "Application submitted successfully." });
  } catch (err) {
    console.error("Apply error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/fundi/:id", authenticate, async (req, res) => {
  if (req.user.role !== "fundi" || String(req.user.id) !== String(req.params.id)) {
    return res.status(403).json({ message: "You can only view your own applications" });
  }
  try {
    const [applications, jobs, assignments, clients] = await Promise.all([
      all(COLLECTIONS.applications),
      all(COLLECTIONS.jobs),
      all(COLLECTIONS.jobAssignments),
      all(COLLECTIONS.clients),
    ]);

    const jobById = new Map(jobs.map((job) => [String(job.id), job]));
    const clientById = new Map(clients.map((client) => [String(client.id), client]));

    const rows = applications
      .filter((application) => String(application.fundi_id) === String(req.params.id))
      .map((application) => {
        const job = jobById.get(String(application.job_id));
        const accepted = applications.find(
          (item) =>
            String(item.job_id) === String(application.job_id) &&
            item.status === "Accepted"
        );
        const assignment = assignments.find(
          (item) =>
            String(item.job_id) === String(application.job_id) &&
            String(item.fundi_id) === String(application.fundi_id)
        );
        const client = job ? clientById.get(String(job.client_id)) : null;
        const canViewClientLocation =
          application.status === "Accepted" &&
          assignment &&
          String(assignment.fundi_id) === String(req.user.id);

        return {
          id: application.id,
          job_id: application.job_id,
          status: application.status,
          message: application.message,
          applied_at: application.applied_at,
          title: job?.title,
          description: job?.description,
          location: job?.location,
          client_location: canViewClientLocation ? client?.location || "" : null,
          client_apartment: canViewClientLocation ? client?.apartment || "" : null,
          client_latitude: canViewClientLocation ? client?.latitude ?? null : null,
          client_longitude: canViewClientLocation ? client?.longitude ?? null : null,
          client_place_id: canViewClientLocation ? client?.place_id || "" : null,
          skill_required: job?.skill_required,
          budget_type: job?.budget_type || "negotiable",
          budget_amount: job?.budget_amount ?? null,
          job_created_at: job?.created_at,
          completed_at: assignment?.completed_at || null,
          agreed_price: assignment?.agreed_price ?? null,
          completion_requested_at: assignment?.completion_requested_at || null,
          payment_status: assignment?.payment_status || "Not started",
          job_status: assignment?.completed_at
            ? "Completed"
            : assignment?.payment_status === "Pending"
              ? "Payment Pending"
              : assignment?.completion_requested_at
                ? "Awaiting Payment"
            : assignment || accepted
              ? "In Progress"
              : "Open",
          is_taken: assignment || accepted ? 1 : 0,
        };
      });

    res.json(sortByDateDesc(rows, "applied_at"));
  } catch (err) {
    console.error("Fundi applications fetch error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/job/:jobId", async (req, res) => {
  try {
    const [applications, fundis] = await Promise.all([
      whereEqual(COLLECTIONS.applications, "job_id", req.params.jobId),
      all(COLLECTIONS.fundis),
    ]);
    const fundiById = new Map(fundis.map((fundi) => [String(fundi.id), fundi]));

    const statusOrder = { Accepted: 1, Pending: 2, Rejected: 3 };
    const rows = applications
      .map((application) => {
        const fundi = fundiById.get(String(application.fundi_id)) || {};
        return {
          id: application.id,
          job_id: application.job_id,
          status: application.status,
          message: application.message,
          applied_at: application.applied_at,
          fundi_id: fundi.id || application.fundi_id,
          name: fundi.name,
          email: fundi.email,
          phone_number: fundi.phone_number,
          skill: fundi.skill,
          location: fundi.location,
          rating: fundi.rating,
        };
      })
      .sort(
        (a, b) =>
          (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99) ||
          new Date(b.applied_at || 0) - new Date(a.applied_at || 0)
      );

    res.json(rows);
  } catch (err) {
    console.error("Job applications fetch error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/:id/accept", async (req, res) => {
  try {
    const applicationId = req.params.id;
    const application = await getById(COLLECTIONS.applications, applicationId);

    if (!application) return res.status(404).json({ message: "Application not found." });

    const job = await getById(COLLECTIONS.jobs, application.job_id);
    const accepted = await getAcceptedApplication(application.job_id);

    if (accepted && String(accepted.id) !== String(applicationId)) {
      return res.status(400).json({ message: "This job already has an accepted fundi." });
    }

    const allForJob = await whereEqual(COLLECTIONS.applications, "job_id", application.job_id);
    await Promise.all(
      allForJob.map((item) =>
        updateById(COLLECTIONS.applications, item.id, {
          status: String(item.id) === String(applicationId) ? "Accepted" : "Rejected",
        })
      )
    );

    const existingAssignments = await whereEqual(
      COLLECTIONS.jobAssignments,
      "job_id",
      application.job_id
    );

    if (!existingAssignments.length) {
      await addWithId(COLLECTIONS.jobAssignments, {
        job_id: Number(application.job_id),
        fundi_id: Number(application.fundi_id),
        assigned_at: timestamp(),
        completed_at: null,
        completion_requested_at: null,
        agreed_price: null,
        price_set_at: null,
        payment_status: "Not started",
        paid_at: null,
      });
    }

    await createNotification(
      application.fundi_id,
      "fundi",
      "application_accepted",
      `Your application for "${job?.title || "this job"}" was accepted.`,
      { job_id: Number(application.job_id) }
    );

    await createNotification(
      job.client_id,
      "client",
      "job_in_progress",
      `"${job.title}" is now in progress.`,
      { job_id: Number(application.job_id) }
    );

    res.json({ message: "Application accepted successfully." });
  } catch (err) {
    console.error("Application accept error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const application = await getById(COLLECTIONS.applications, req.params.id);

    if (!application || application.status !== "Pending") {
      return res.status(400).json({ message: "Only pending applications can be withdrawn." });
    }

    await deleteById(COLLECTIONS.applications, req.params.id);
    res.json({ message: "Application withdrawn." });
  } catch (err) {
    console.error("Application withdraw error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
