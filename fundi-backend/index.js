// ✅ index.js (Backend Node.js + Express)
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.post('/signup', async (req, res) => {
  const { name, email, phone, password_hash, role, skills } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password_hash, 10);
    const query = 'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, email, phone, hashedPassword, role], (err, result) => {
      if (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ error: err.sqlMessage || 'Signup failed' });
      }
      const userId = result.insertId;
      if (role === 'fundi' && skills) {
        const skillList = skills.split(',').map(skill => skill.trim());
        const skillQuery = 'INSERT INTO user_skills (user_id, skill) VALUES (?, ?)';
        skillList.forEach(skill => {
          db.query(skillQuery, [userId, skill], (err) => {
            if (err) console.error('Skill insert error:', err);
          });
        });
      }
      res.status(201).json({ message: 'User registered successfully!' });
    });
  } catch (err) {
    console.error('Signup bcrypt error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Login failed' });
    if (results.length === 0) return res.status(400).json({ error: 'User not found' });

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });

    res.status(200).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
