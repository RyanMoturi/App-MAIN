// ✅ index.js (Backend Node.js + Express)
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');
const jobRoutes = require('./jobRoutes');
const authRoutes = require('./authRoutes');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key'; // 🔒 fallback

const app = express();
const PORT = process.env.PORT || 5000;

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
    if (err) return res.status(403).json({ error: 'Invalid token' });

    req.user = user; // Attach decoded user info to request
    next();
  });
};

// ✅ Protected Route Example
app.get('/dashboard', authenticateJWT, (req, res) => {
  res.json({ message: `Welcome ${req.user.name}, your role is ${req.user.role}` });
});

// ✅ Route mounting
app.use('/api', jobRoutes);
app.use('/api/auth', authRoutes);

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
