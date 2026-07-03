// ✅ index.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const db = require("./db");

// Routes
const jobRoutes = require("./jobRoutes");
const authRoutes = require("./routes/authRoutes");
const clientRoutes = require("./routes/clientRoutes");
const fundiRoutes = require("./routes/fundiRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");
const portfolioRoutes = require("./portfolioRoutes");

const app = express();

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cors());

// ================= JWT Middleware =================
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Token missing",
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: "Invalid token",
      });
    }

    req.user = user;
    next();
  });
};

// ================= Protected Test Route =================
app.get("/dashboard", authenticateJWT, (req, res) => {
  res.json({
    message: `Welcome ${req.user.name}, your role is ${req.user.role}`,
  });
});

// ================= API Routes =================
app.use("/api", jobRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/client", clientRoutes);

app.use("/api/fundi", fundiRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api", portfolioRoutes);

app.use("/uploads", express.static("uploads"));

// ================= Socket.IO =================
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
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
    io.to(`user_${data.receiver_role}_${data.receiver_id}`)
      .emit("receive_message", data);
  });

  socket.on("send_notification", (data) => {
    io.to(`user_${data.user_role}_${data.user_id}`)
      .emit("receive_notification", data);
  });
});

// ================= Start Server =================
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});