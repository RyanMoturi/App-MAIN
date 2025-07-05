// ✅ index.js (Backend Node.js + Express)
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Keep this only
const db = require('./db');
const jwt = require('jsonwebtoken');
const jobRoutes = require('./jobRoutes');

const SECRET_KEY = 'your_secret_key'; // 🔒 Store in .env in production

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// ✅ SIGNUP Route
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

      // Save fundi skills if applicable
      if (role === 'fundi' && skills) {
        const skillList = skills.split(',').map(skill => skill.trim());
        const skillQuery = 'INSERT INTO user_skills (user_id, skill) VALUES (?, ?)';
        skillList.forEach(skill => {
          db.query(skillQuery, [userId, skill], (err) => {
            if (err) console.error('Skill insert error:', err);
          });
        });
      }

      // ✅ Create JWT
      const token = jwt.sign({ id: userId, name, email, role }, SECRET_KEY, { expiresIn: '1h' });
      res.status(201).json({ message: 'User registered successfully!', token });
    });
  } catch (err) {
    console.error('Signup bcrypt error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// ✅ LOGIN Route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Login failed' });
    if (results.length === 0) return res.status(400).json({ error: 'User not found' });

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // ✅ Create JWT
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ token });
  });
});

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

app.use('/api', jobRoutes);

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
