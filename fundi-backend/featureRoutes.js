const express = require("express");
const {
  COLLECTIONS,
  addWithId,
  all,
  createNotification,
  getById,
  sortByDateAsc,
  sortByDateDesc,
  timestamp,
  updateById,
  whereEqual,
} = require("./firestoreStore");
const { authenticate } = require("./authMiddleware");

const matches = (value, search) =>
  String(value || "").toLowerCase().includes(String(search || "").toLowerCase());

const getUserName = async (userId, role) => {
  const collection = role === "client" ? COLLECTIONS.clients : COLLECTIONS.fundis;
  const user = await getById(collection, userId);
  return user?.name || "Unknown";
};

const getAcceptedApplication = async (jobId) => {
  const applications = await whereEqual(COLLECTIONS.applications, "job_id", jobId);
  return applications.find((application) => application.status === "Accepted") || null;
};

const ensureAssignmentForApplication = async (application) => {
  const existing = await whereEqual(COLLECTIONS.jobAssignments, "job_id", application.job_id);
  if (existing.length) return existing[0];

  return addWithId(COLLECTIONS.jobAssignments, {
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
};

const updateFundiRating = async (fundiId) => {
  const reviews = await whereEqual(COLLECTIONS.reviews, "fundi_id", fundiId);
  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
            reviews.length) *
            100
        ) / 100
      : 0;

  await updateById(COLLECTIONS.fundis, fundiId, { rating: avgRating });
  return avgRating;
};

module.exports = (io) => {
  const router = express.Router();

  router.get("/fundis", async (req, res) => {
    const { skill, location } = req.query;

    try {
      let rows = await all(COLLECTIONS.fundis);

      if (skill) rows = rows.filter((fundi) => matches(fundi.skill, skill));
      if (location) rows = rows.filter((fundi) => matches(fundi.location, location));

      rows.sort(
        (a, b) =>
          Number(b.rating || 0) - Number(a.rating || 0) ||
          String(a.name || "").localeCompare(String(b.name || ""))
      );

      res.json(
        rows.map(({ id, name, skill, bio, location, rating }) => ({
          id,
          name,
          skill,
          bio,
          location,
          rating,
        }))
      );
    } catch (err) {
      console.error("Error searching fundis:", err);
      res.status(500).json({ error: "Failed to search fundis" });
    }
  });

  router.get("/fundis/:fundiId", async (req, res) => {
    try {
      const fundi = await getById(COLLECTIONS.fundis, req.params.fundiId);
      if (!fundi) return res.status(404).json({ error: "Fundi not found" });

      const { id, name, skill, bio, location, rating } = fundi;
      res.json({ id, name, skill, bio, location, rating });
    } catch (err) {
      console.error("Error fetching fundi:", err);
      res.status(500).json({ error: "Failed to fetch fundi" });
    }
  });

  router.post("/jobs/:jobId/apply", async (req, res) => {
    const { jobId } = req.params;
    const { fundi_id, message } = req.body;

    try {
      const job = await getById(COLLECTIONS.jobs, jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });

      const fundi = await getById(COLLECTIONS.fundis, fundi_id);
      if (!fundi?.is_verified) {
        return res.status(403).json({ error: "Your account is pending admin verification" });
      }

      if (fundi.is_banned) {
        return res.status(403).json({ error: "Your account has been banned by admin" });
      }

      if (await getAcceptedApplication(jobId)) {
        return res.status(400).json({ error: "This job is already taken" });
      }

      const duplicate = (await whereEqual(COLLECTIONS.applications, "job_id", jobId)).find(
        (application) => String(application.fundi_id) === String(fundi_id)
      );

      if (duplicate) {
        return res.status(400).json({ error: "You already applied to this job" });
      }

      await addWithId(COLLECTIONS.applications, {
        job_id: Number(jobId),
        fundi_id: Number(fundi_id),
        message: message || "",
        status: "Pending",
        applied_at: timestamp(),
      });

      res.status(201).json({ message: "Application submitted" });
    } catch (err) {
      console.error("Error applying to job:", err);
      res.status(500).json({ error: "Failed to submit application" });
    }
  });

  router.get("/jobs/:jobId/applications", async (req, res) => {
    try {
      const [applications, fundis] = await Promise.all([
        whereEqual(COLLECTIONS.applications, "job_id", req.params.jobId),
        all(COLLECTIONS.fundis),
      ]);
      const fundiById = new Map(fundis.map((fundi) => [String(fundi.id), fundi]));

      const rows = applications.map((application) => {
        const fundi = fundiById.get(String(application.fundi_id)) || {};
        return {
          ...application,
          fundi_name: fundi.name,
          skill: fundi.skill,
        };
      });

      res.json(sortByDateDesc(rows, "applied_at"));
    } catch (err) {
      console.error("Error fetching applications:", err);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  router.get("/jobs/:jobId/accepted-fundi", async (req, res) => {
    try {
      const accepted = await getAcceptedApplication(req.params.jobId);
      if (!accepted) return res.json(null);

      const fundi = await getById(COLLECTIONS.fundis, accepted.fundi_id);
      res.json(
        fundi
          ? {
              fundi_id: fundi.id,
              name: fundi.name,
              skill: fundi.skill,
              rating: fundi.rating,
            }
          : null
      );
    } catch (err) {
      console.error("Error fetching accepted fundi:", err);
      res.status(500).json({ error: "Failed to fetch accepted fundi" });
    }
  });

  router.post("/applications/:applicationId/:action", async (req, res) => {
    const { applicationId, action } = req.params;
    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    try {
      const application = await getById(COLLECTIONS.applications, applicationId);
      if (!application) return res.status(404).json({ error: "Application not found" });

      const job = await getById(COLLECTIONS.jobs, application.job_id);

      if (action === "accept") {
        const allForJob = await whereEqual(COLLECTIONS.applications, "job_id", application.job_id);
        await Promise.all(
          allForJob.map((item) =>
            updateById(COLLECTIONS.applications, item.id, {
              status: String(item.id) === String(applicationId) ? "Accepted" : "Rejected",
            })
          )
        );

        await ensureAssignmentForApplication(application);

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
      } else {
        await updateById(COLLECTIONS.applications, applicationId, { status: "Rejected" });
      }

      res.json({ message: `Application ${action}ed` });
    } catch (err) {
      console.error("Error updating application:", err);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  router.post("/messages", async (req, res) => {
    const { job_id, sender_id, receiver_id, sender_role, receiver_role, content } = req.body;
    if (!job_id || !sender_id || !receiver_id || !sender_role || !receiver_role || !content?.trim()) {
      return res.status(400).json({ error: "Missing required message fields" });
    }

    try {
      const [job, assignments, messages] = await Promise.all([
        getById(COLLECTIONS.jobs, job_id),
        whereEqual(COLLECTIONS.jobAssignments, "job_id", job_id),
        whereEqual(COLLECTIONS.messages, "job_id", job_id),
      ]);

      const assignment = assignments.find(
        (item) =>
          String(item.fundi_id) === String(sender_id) ||
          String(item.fundi_id) === String(receiver_id)
      );

      const isClientContact =
        job &&
        String(job.client_id) === String(sender_id) &&
        sender_role === "client" &&
        receiver_role === "fundi";

      const existingThread = messages.some(
        (message) =>
          (String(message.sender_id) === String(sender_id) &&
            message.sender_role === sender_role &&
            String(message.receiver_id) === String(receiver_id) &&
            message.receiver_role === receiver_role) ||
          (String(message.sender_id) === String(receiver_id) &&
            message.sender_role === receiver_role &&
            String(message.receiver_id) === String(sender_id) &&
            message.receiver_role === sender_role)
      );

      if (!assignment && !isClientContact && !existingThread) {
        return res.status(403).json({
          error: "Messages are only available for accepted jobs or client contact requests",
        });
      }

      const newMessage = await addWithId(COLLECTIONS.messages, {
        job_id: Number(job_id),
        sender_id: Number(sender_id),
        receiver_id: Number(receiver_id),
        sender_role,
        receiver_role,
        content: content.trim(),
        sent_at: timestamp(),
      });

      const senderName = await getUserName(sender_id, sender_role);
      const notificationContent = `${senderName} sent you a message about "${job?.title || "this job"}".`;
      await createNotification(receiver_id, receiver_role, "message", notificationContent, {
        job_id: Number(job_id),
        other_user_id: Number(sender_id),
        other_user_role: sender_role,
        other_user_name: senderName,
        job_title: job?.title || "Job conversation",
      });

      const messagePayload = {
        ...newMessage,
        sent_at: new Date().toISOString(),
      };

      if (io) {
        io.to(`user_${receiver_role}_${receiver_id}`).emit("receive_message", messagePayload);
        io.to(`user_${receiver_role}_${receiver_id}`).emit("receive_notification", {
          type: "message",
          content: notificationContent,
          job_id: Number(job_id),
          other_user_id: Number(sender_id),
          other_user_role: sender_role,
          other_user_name: senderName,
          job_title: job?.title || "Job conversation",
        });
      }

      res.status(201).json({ message: "Message sent", data: messagePayload });
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  router.get("/messages", async (req, res) => {
    const { jobId, userId, userRole, otherUserId, otherUserRole } = req.query;
    if (!jobId || !userId || !userRole || !otherUserId || !otherUserRole) {
      return res.status(400).json({ error: "Missing query parameters" });
    }

    try {
      const rows = (await whereEqual(COLLECTIONS.messages, "job_id", jobId)).filter(
        (message) =>
          (String(message.sender_id) === String(userId) &&
            message.sender_role === userRole &&
            String(message.receiver_id) === String(otherUserId) &&
            message.receiver_role === otherUserRole) ||
          (String(message.sender_id) === String(otherUserId) &&
            message.sender_role === otherUserRole &&
            String(message.receiver_id) === String(userId) &&
            message.receiver_role === userRole)
      );

      res.json(sortByDateAsc(rows, "sent_at"));
    } catch (err) {
      console.error("Error fetching messages:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  router.get("/conversations", async (req, res) => {
    const { userId, userRole } = req.query;
    if (!userId || !userRole) {
      return res.status(400).json({ error: "userId and userRole are required" });
    }

    try {
      const [jobs, assignments, messages, clients, fundis] = await Promise.all([
        all(COLLECTIONS.jobs),
        all(COLLECTIONS.jobAssignments),
        all(COLLECTIONS.messages),
        all(COLLECTIONS.clients),
        all(COLLECTIONS.fundis),
      ]);
      const jobById = new Map(jobs.map((job) => [String(job.id), job]));
      const clientById = new Map(clients.map((client) => [String(client.id), client]));
      const fundiById = new Map(fundis.map((fundi) => [String(fundi.id), fundi]));
      const conversations = new Map();

      const addConversation = ({ job_id, other_user_id, other_user_role, assigned_at, completed_at }) => {
        const job = jobById.get(String(job_id));
        const otherUser =
          other_user_role === "client"
            ? clientById.get(String(other_user_id))
            : fundiById.get(String(other_user_id));
        const relevantMessages = messages.filter(
          (message) =>
            String(message.job_id) === String(job_id) &&
            ((String(message.sender_id) === String(userId) &&
              message.sender_role === userRole &&
              String(message.receiver_id) === String(other_user_id) &&
              message.receiver_role === other_user_role) ||
              (String(message.sender_id) === String(other_user_id) &&
                message.sender_role === other_user_role &&
                String(message.receiver_id) === String(userId) &&
                message.receiver_role === userRole))
        );
        const lastMessage = sortByDateDesc(relevantMessages, "sent_at")[0];
        const key = `${job_id}:${other_user_role}:${other_user_id}`;

        conversations.set(key, {
          job_id: Number(job_id),
          job_title: job?.title,
          other_user_id: Number(other_user_id),
          other_user_role,
          other_user_name: otherUser?.name || "Unknown",
          assigned_at,
          completed_at: completed_at || null,
          last_message: lastMessage?.content || "Conversation ready",
          last_sent_at: lastMessage?.sent_at || assigned_at,
        });
      };

      for (const assignment of assignments) {
        const job = jobById.get(String(assignment.job_id));
        if (!job) continue;

        if (userRole === "client" && String(job.client_id) === String(userId)) {
          addConversation({
            job_id: assignment.job_id,
            other_user_id: assignment.fundi_id,
            other_user_role: "fundi",
            assigned_at: assignment.assigned_at,
            completed_at: assignment.completed_at,
          });
        }

        if (userRole === "fundi" && String(assignment.fundi_id) === String(userId)) {
          addConversation({
            job_id: assignment.job_id,
            other_user_id: job.client_id,
            other_user_role: "client",
            assigned_at: assignment.assigned_at,
            completed_at: assignment.completed_at,
          });
        }
      }

      for (const message of messages) {
        if (message.sender_role === userRole && String(message.sender_id) === String(userId)) {
          addConversation({
            job_id: message.job_id,
            other_user_id: message.receiver_id,
            other_user_role: message.receiver_role,
            assigned_at: message.sent_at,
            completed_at: null,
          });
        }

        if (message.receiver_role === userRole && String(message.receiver_id) === String(userId)) {
          addConversation({
            job_id: message.job_id,
            other_user_id: message.sender_id,
            other_user_role: message.sender_role,
            assigned_at: message.sent_at,
            completed_at: null,
          });
        }
      }

      res.json(sortByDateDesc([...conversations.values()], "last_sent_at"));
    } catch (err) {
      console.error("Error fetching conversations:", err);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  router.get("/notifications", async (req, res) => {
    const { userId, userRole } = req.query;
    if (!userId || !userRole) {
      return res.status(400).json({ error: "userId and userRole are required" });
    }

    try {
      const rows = (await whereEqual(COLLECTIONS.notifications, "user_id", userId)).filter(
        (notification) => notification.user_role === userRole
      );
      res.json(sortByDateDesc(rows, "created_at"));
    } catch (err) {
      console.error("Error fetching notifications:", err);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  router.post("/notifications/mark-read", async (req, res) => {
    const { notificationId, userId, userRole } = req.body;
    if (!notificationId || !userId || !userRole) {
      return res.status(400).json({ error: "Missing notification fields" });
    }

    try {
      const notification = await getById(COLLECTIONS.notifications, notificationId);
      if (
        notification &&
        String(notification.user_id) === String(userId) &&
        notification.user_role === userRole
      ) {
        await updateById(COLLECTIONS.notifications, notificationId, { is_read: 1 });
      }
      res.json({ message: "Notification marked as read" });
    } catch (err) {
      console.error("Error marking notification read:", err);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  router.post("/reviews", authenticate, async (req, res) => {
    const { job_id, client_id, fundi_id, rating, comment } = req.body;
    if (!job_id || !client_id || !fundi_id || !rating) {
      return res.status(400).json({ error: "Missing required review fields" });
    }
    if (req.user.role !== "client" || String(req.user.id) !== String(client_id)) {
      return res.status(403).json({ error: "Only the job's client can submit this review" });
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    try {
      const [job, assignments] = await Promise.all([
        getById(COLLECTIONS.jobs, job_id),
        whereEqual(COLLECTIONS.jobAssignments, "job_id", job_id),
      ]);
      const assignment = assignments.find(
        (item) => String(item.fundi_id) === String(fundi_id)
      );

      if (!assignment?.completed_at || String(job?.client_id) !== String(client_id)) {
        return res.status(400).json({ error: "Complete the job before reviewing it" });
      }

      const existing = (await whereEqual(COLLECTIONS.reviews, "job_id", job_id)).find(
        (review) => String(review.client_id) === String(client_id)
      );
      if (existing) {
        return res.status(400).json({ error: "You already reviewed this job" });
      }

      await addWithId(COLLECTIONS.reviews, {
        job_id: Number(job_id),
        client_id: Number(client_id),
        fundi_id: Number(fundi_id),
        rating: Number(rating),
        comment: comment || "",
        created_at: timestamp(),
      });

      const avgRating = await updateFundiRating(fundi_id);
      await createNotification(
        fundi_id,
        "fundi",
        "rated",
        `You received a ${rating}-star review for "${job.title}".`,
        { job_id: Number(job_id) }
      );

      res.status(201).json({ message: "Review submitted", avgRating });
    } catch (err) {
      console.error("Error submitting review:", err);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });

  router.get("/fundi/:fundiId/reviews", async (req, res) => {
    try {
      const [reviews, clients, jobs] = await Promise.all([
        whereEqual(COLLECTIONS.reviews, "fundi_id", req.params.fundiId),
        all(COLLECTIONS.clients),
        all(COLLECTIONS.jobs),
      ]);
      const clientById = new Map(clients.map((client) => [String(client.id), client]));
      const jobById = new Map(jobs.map((job) => [String(job.id), job]));

      res.json(
        sortByDateDesc(
          reviews.map((review) => ({
            ...review,
            client_name: clientById.get(String(review.client_id))?.name,
            job_title: jobById.get(String(review.job_id))?.title,
          })),
          "created_at"
        )
      );
    } catch (err) {
      console.error("Error fetching reviews:", err);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  router.get("/jobs/:jobId/review", async (req, res) => {
    try {
      const rows = await whereEqual(COLLECTIONS.reviews, "job_id", req.params.jobId);
      res.json(rows[0] || null);
    } catch (err) {
      console.error("Error fetching job review:", err);
      res.status(500).json({ error: "Failed to fetch review" });
    }
  });

  return router;
};
