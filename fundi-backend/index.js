// index.js
const express = require('express');
const path = require('path');
const db = require('./db');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Serve HTML page via Express (only once)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 🔐 SIGNUP ROUTE
app.post('/signup', async (req, res) => {
  const { name, email, phone, password_hash } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password_hash, 10);

    const query = 'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)';
    db.query(query, [name, email, phone, hashedPassword], (err, result) => {
      if (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ error: 'Signup failed' });
      }
      res.status(201).json({ message: 'User registered successfully!' });
    });
  } catch (err) {
    console.error('Signup error (bcrypt):', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// 🔐 LOGIN ROUTE
app.post('/login', (req, res) => {
  const { email, password} = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed' });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = results[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
