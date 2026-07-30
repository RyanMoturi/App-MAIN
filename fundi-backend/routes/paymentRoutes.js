const express = require("express");
const jwt = require("jsonwebtoken");
const {
  COLLECTIONS,
  addWithId,
  all,
  createNotification,
  getById,
  timestamp,
  updateById,
  whereEqual,
} = require("../firestoreStore");
const {
  initiateStkPush,
  normalizeKenyanPhone,
  requiredConfiguration,
} = require("../darajaService");

const router = express.Router();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;

  if (!token) return res.status(401).json({ error: "Token missing" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (_error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

const getJobAndAssignment = async (jobId) => {
  const [job, assignments] = await Promise.all([
    getById(COLLECTIONS.jobs, jobId),
    whereEqual(COLLECTIONS.jobAssignments, "job_id", jobId),
  ]);

  return { job, assignment: assignments[0] || null };
};

const publicPaymentState = (job, assignment, payment = null) => ({
  job_id: job.id,
  budget_type: job.budget_type || "negotiable",
  budget_amount: job.budget_amount ?? null,
  agreed_price: assignment?.agreed_price ?? null,
  price_set_at: assignment?.price_set_at || null,
  completion_requested_at: assignment?.completion_requested_at || null,
  payment_status: assignment?.payment_status || "Not started",
  paid_at: assignment?.paid_at || null,
  mpesa_receipt_number:
    assignment?.payment_status === "Paid"
      ? payment?.mpesa_receipt_number || null
      : null,
});

router.get("/config", authenticate, (_req, res) => {
  try {
    requiredConfiguration();
    res.json({ configured: true });
  } catch (_error) {
    res.json({ configured: false });
  }
});

router.get("/jobs/:jobId", authenticate, async (req, res) => {
  try {
    const { job, assignment } = await getJobAndAssignment(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const isClient =
      req.user.role === "client" &&
      String(req.user.id) === String(job.client_id);
    const isFundi =
      req.user.role === "fundi" &&
      String(req.user.id) === String(assignment?.fundi_id);

    if (!isClient && !isFundi) {
      return res.status(403).json({ error: "Not authorized for this job" });
    }

    const payments = await whereEqual(
      COLLECTIONS.payments,
      "job_id",
      job.id
    );
    const payment = payments.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )[0];

    res.json(publicPaymentState(job, assignment, payment));
  } catch (error) {
    console.error("Payment state error:", error);
    res.status(500).json({ error: "Failed to load payment state" });
  }
});

router.put("/jobs/:jobId/agreed-price", authenticate, async (req, res) => {
  try {
    const price = Math.round(Number(req.body.price));
    const { job, assignment } = await getJobAndAssignment(req.params.jobId);

    if (!job) return res.status(404).json({ error: "Job not found" });
    if (
      req.user.role !== "client" ||
      String(req.user.id) !== String(job.client_id)
    ) {
      return res.status(403).json({ error: "Only the client can set the agreed price" });
    }
    if (!assignment) {
      return res.status(400).json({ error: "Connect with a fundi first" });
    }
    if (!Number.isFinite(price) || price < 1) {
      return res.status(400).json({ error: "Enter an agreed price of at least KES 1" });
    }
    if (assignment.payment_status === "Paid") {
      return res.status(400).json({ error: "This job has already been paid" });
    }
    if (assignment.payment_status === "Pending") {
      return res.status(400).json({ error: "A payment request is already pending" });
    }

    await updateById(COLLECTIONS.jobAssignments, assignment.id, {
      agreed_price: price,
      price_set_at: timestamp(),
      payment_status: assignment.payment_status || "Not started",
    });

    await createNotification(
      assignment.fundi_id,
      "fundi",
      "price_agreed",
      `The agreed price for "${job.title}" is KES ${price.toLocaleString()}.`,
      { job_id: Number(job.id) }
    );

    res.json({ message: "Agreed price saved", agreed_price: price });
  } catch (error) {
    console.error("Set agreed price error:", error);
    res.status(500).json({ error: "Failed to save agreed price" });
  }
});

router.put("/jobs/:jobId/request-completion", authenticate, async (req, res) => {
  try {
    const { job, assignment } = await getJobAndAssignment(req.params.jobId);

    if (!job) return res.status(404).json({ error: "Job not found" });
    if (
      req.user.role !== "fundi" ||
      String(req.user.id) !== String(assignment?.fundi_id)
    ) {
      return res.status(403).json({ error: "Only the assigned fundi can finish this job" });
    }
    if (!assignment?.agreed_price) {
      return res.status(400).json({
        error: "Ask the client to enter the agreed price before finishing the job",
      });
    }
    if (assignment.payment_status === "Paid") {
      return res.status(400).json({ error: "This job has already been paid" });
    }

    if (!assignment.completion_requested_at) {
      await updateById(COLLECTIONS.jobAssignments, assignment.id, {
        completion_requested_at: timestamp(),
        payment_status:
          assignment.payment_status === "Failed"
            ? "Not started"
            : assignment.payment_status || "Not started",
      });

      await createNotification(
        job.client_id,
        "client",
        "payment_requested",
        `${req.user.name || "Your fundi"} marked "${job.title}" as finished. Pay KES ${Number(
          assignment.agreed_price
        ).toLocaleString()} via M-PESA.`,
        { job_id: Number(job.id) }
      );
    }

    res.json({
      message: "The client has been asked to review and pay for the completed work",
    });
  } catch (error) {
    console.error("Completion request error:", error);
    res.status(500).json({ error: "Failed to request completion" });
  }
});

router.post("/jobs/:jobId/stk-push", authenticate, async (req, res) => {
  try {
    const { job, assignment } = await getJobAndAssignment(req.params.jobId);

    if (!job) return res.status(404).json({ error: "Job not found" });
    if (
      req.user.role !== "client" ||
      String(req.user.id) !== String(job.client_id)
    ) {
      return res.status(403).json({ error: "Only the client can pay for this job" });
    }
    if (!assignment?.completion_requested_at) {
      return res.status(400).json({ error: "The fundi has not marked the work as finished" });
    }
    if (!assignment.agreed_price) {
      return res.status(400).json({ error: "Set the agreed price first" });
    }
    if (assignment.payment_status === "Paid") {
      return res.status(400).json({ error: "This job has already been paid" });
    }

    const previousPayments = await whereEqual(
      COLLECTIONS.payments,
      "job_id",
      job.id
    );
    if (previousPayments.some((payment) => payment.status === "Pending")) {
      return res.status(409).json({
        error: "An M-PESA prompt is already pending. Complete it or wait for it to expire.",
      });
    }

    const client = await getById(COLLECTIONS.clients, job.client_id);
    const phone = normalizeKenyanPhone(req.body.phone || client?.phone_number);
    if (!phone) {
      return res.status(400).json({
        error: "Enter a valid Safaricom number, for example 0712345678.",
      });
    }

    const result = await initiateStkPush({
      amount: assignment.agreed_price,
      phoneNumber: phone,
      accountReference: `Job${job.id}`,
    });

    const payment = await addWithId(COLLECTIONS.payments, {
      job_id: Number(job.id),
      assignment_id: Number(assignment.id),
      client_id: Number(job.client_id),
      fundi_id: Number(assignment.fundi_id),
      amount: result.amount,
      phone_number: result.phone,
      merchant_request_id: result.MerchantRequestID,
      checkout_request_id: result.CheckoutRequestID,
      response_code: result.ResponseCode,
      response_description: result.ResponseDescription,
      customer_message: result.CustomerMessage,
      status: "Pending",
      created_at: timestamp(),
      updated_at: timestamp(),
    });

    await updateById(COLLECTIONS.jobAssignments, assignment.id, {
      payment_status: "Pending",
      payment_id: payment.id,
    });

    res.status(202).json({
      message:
        result.CustomerMessage ||
        "Check your phone and enter your M-PESA PIN to complete payment.",
      checkout_request_id: result.CheckoutRequestID,
      payment_status: "Pending",
    });
  } catch (error) {
    console.error("STK Push error:", error.details || error);
    res.status(error.code === "DARAJA_NOT_CONFIGURED" ? 503 : 502).json({
      error: error.message || "Could not send the M-PESA prompt",
    });
  }
});

router.post("/daraja/callback", async (req, res) => {
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback?.CheckoutRequestID) return;

    const payments = await all(COLLECTIONS.payments);
    const payment = payments.find(
      (item) => item.checkout_request_id === callback.CheckoutRequestID
    );
    if (!payment || payment.status === "Paid") return;

    const metadata = Object.fromEntries(
      (callback.CallbackMetadata?.Item || []).map((item) => [
        item.Name,
        item.Value ?? null,
      ])
    );
    const callbackPhone = normalizeKenyanPhone(metadata.PhoneNumber);
    const callbackAmount = Number(metadata.Amount);
    const callbackMatchesPayment =
      callbackPhone === payment.phone_number &&
      Number.isFinite(callbackAmount) &&
      callbackAmount === Number(payment.amount);
    const succeeded =
      Number(callback.ResultCode) === 0 && callbackMatchesPayment;
    const resultDescription =
      Number(callback.ResultCode) === 0 && !callbackMatchesPayment
        ? "M-PESA callback details did not match the payment request."
        : callback.ResultDesc || "";

    await updateById(COLLECTIONS.payments, payment.id, {
      status: succeeded ? "Paid" : "Failed",
      result_code: Number(callback.ResultCode),
      result_description: resultDescription,
      mpesa_receipt_number: metadata.MpesaReceiptNumber || null,
      transaction_date: metadata.TransactionDate || null,
      callback_phone_number: callbackPhone,
      paid_amount: metadata.Amount || null,
      updated_at: timestamp(),
      paid_at: succeeded ? timestamp() : null,
    });

    const assignment = await getById(
      COLLECTIONS.jobAssignments,
      payment.assignment_id
    );
    const job = await getById(COLLECTIONS.jobs, payment.job_id);
    if (!assignment || !job) return;

    if (succeeded) {
      await updateById(COLLECTIONS.jobAssignments, assignment.id, {
        payment_status: "Paid",
        paid_at: timestamp(),
        completed_at: timestamp(),
      });
      await Promise.all([
        createNotification(
          payment.client_id,
          "client",
          "payment_successful",
          `Payment of KES ${Number(payment.amount).toLocaleString()} for "${job.title}" was successful.`,
          { job_id: Number(job.id) }
        ),
        createNotification(
          payment.fundi_id,
          "fundi",
          "payment_received",
          `The client paid KES ${Number(payment.amount).toLocaleString()} for "${job.title}".`,
          { job_id: Number(job.id) }
        ),
      ]);
    } else {
      await updateById(COLLECTIONS.jobAssignments, assignment.id, {
        payment_status: "Failed",
      });
      await createNotification(
        payment.client_id,
        "client",
        "payment_failed",
        `M-PESA payment for "${job.title}" was not completed: ${
          resultDescription || "please try again"
        }.`,
        { job_id: Number(job.id) }
      );
    }
  } catch (error) {
    console.error("Daraja callback processing error:", error);
  }
});

module.exports = router;
