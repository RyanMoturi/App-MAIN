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

/* API route to get users
app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});*/

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

/* API route to get list of available jobs
app.get('/jobs', (req, res) => {
  db.query('SELECT * FROM jobs', (err, results) => {
    if (err) {
      console.error('Error fetching jobs:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
}); */

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
