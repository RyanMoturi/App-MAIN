// ✅ index.js (Backend Node.js + Express)
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');
const jobRoutes = require('./jobRoutes');
const authRoutes = require('./authRoutes');
const portfolioRoutes = require('./portfolioRoutes');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

// ✅ Changed default port from 5000 to 5001
const PORT = process.env.PORT || 5001;

const app = express();
app.use(express.json());
app.use(cors());

// ✅ JWT Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token missing' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  });
};

// ✅ Protected Route Example
app.get('/dashboard', authenticateJWT, (req, res) => {
  res.json({
    message: `Welcome ${req.user.name}, your role is ${req.user.role}`
  });
});

// ✅ Route mounting
app.use('/api', jobRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', portfolioRoutes);
app.use('/uploads', express.static('uploads'));
// ✅ Start Server with Socket.io
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use('/api', require('./featureRoutes')(io));

io.on('connection', (socket) => {
  socket.on('join', ({ userId, userRole }) => {
    if (userId && userRole) {
      socket.join(`user_${userRole}_${userId}`);
    }
  });

  socket.on('send_message', (data) => {
    io.to(`user_${data.receiver_role}_${data.receiver_id}`).emit('receive_message', data);
  });

  socket.on('send_notification', (data) => {
    io.to(`user_${data.user_role}_${data.user_id}`).emit('receive_notification', data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});