// authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const router = express.Router();
const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET || 'your_fallback_secret';

// === CLIENT SIGNUP ===
router.post('/signup/client', async (req, res) => {
  const { name, email, password, location, phone_number } = req.body;

  if (!password) return res.status(400).json({ error: 'Password is required' });

  try {
    const [existing] = await db.query('SELECT * FROM clients WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await db.query(
      'INSERT INTO clients (name, email, location, password_hash, phone_number) VALUES (?, ?, ?, ?, ?)',
      [name, email, location, hashedPassword, phone_number]
    );

    res.status(201).json({ message: 'Client registered successfully' });
  } catch (err) {
    console.error('CLIENT SIGNUP ERROR:', err);
    res.status(500).json({ error: 'Server error during client signup' });
  }
});

// === FUNDI SIGNUP ===
router.post('/signup/fundi', async (req, res) => {
  const { name, email, password, skill, bio, location } = req.body;

  if (!password) return res.status(400).json({ error: 'Password is required' });

  try {
    const [existing] = await db.query('SELECT * FROM fundis WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await db.query(
      'INSERT INTO fundis (name, email, skill, bio, location, password_hash, rating) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, skill, bio || '', location, hashedPassword, 0.0]
    );

    res.status(201).json({ message: 'Fundi registered successfully' });
  } catch (err) {
    console.error('FUNDI SIGNUP ERROR:', err);
    res.status(500).json({ error: 'Server error during fundi signup' });
  }
});

// === UNIVERSAL LOGIN ===
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!['client', 'fundi'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  const table = role === 'client' ? 'clients' : 'fundis';

  try {
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);

    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, role }, jwtSecret, { expiresIn: '7d' });

    const responsePayload = {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        role,
        email: user.email,
        location: user.location,
      }
    };

    if (role === 'client') {
      responsePayload.clientId = user.id;
    } else {
      responsePayload.fundiId = user.id;
      responsePayload.user.skill = user.skill;
      responsePayload.user.bio = user.bio;
    }

    res.status(200).json(responsePayload);
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
