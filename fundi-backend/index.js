const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const jobRoutes = require("./jobRoutes");
const authRoutes = require("./routes/authRoutes");
const clientRoutes = require("./routes/clientRoutes");
const fundiRoutes = require("./routes/fundiRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");
const portfolioRoutes = require("./portfolioRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

const app = express();
const SECRET_KEY = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === "production";

if (!SECRET_KEY) {
  throw new Error("JWT_SECRET is required.");
}

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json());
app.set("trust proxy", 1);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV || "development" });
});

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  });
};

app.get("/dashboard", authenticateJWT, (req, res) => {
  res.json({
    message: `Welcome ${req.user.name}, your role is ${req.user.role}`,
  });
});

app.use("/api", jobRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/fundi", fundiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api", portfolioRoutes);
app.use("/uploads", express.static("uploads"));

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.use("/api", require("./featureRoutes")(io));

io.on("connection", (socket) => {
  socket.on("join", ({ userId, userRole }) => {
    if (userId && userRole) {
      socket.join(`user_${userRole}_${userId}`);
    }
  });

  socket.on("send_message", (data) => {
    io.to(`user_${data.receiver_role}_${data.receiver_id}`).emit("receive_message", data);
  });

  socket.on("send_notification", (data) => {
    io.to(`user_${data.user_role}_${data.user_id}`).emit("receive_notification", data);
  });
});

server.listen(PORT, () => {
  console.log(`Fundi-Link API listening on port ${PORT} (${isProduction ? "production" : "development"})`);
});
