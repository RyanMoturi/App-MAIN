// authRoutes.js (PART 1)

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const router = express.Router();
const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET || 'your_fallback_secret';

// ================= CLIENT SIGNUP =================
router.post('/signup/client', async (req, res) => {
  const { name, email, password, location, phone_number } = req.body;

  if (!password)
    return res.status(400).json({ error: 'Password is required' });

  try {
    const [existing] = await db.query(
      'SELECT * FROM clients WHERE email = ?',
      [email]
    );

    if (existing.length)
      return res.status(400).json({
        error: 'Email already in use',
      });

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await db.query(
      `INSERT INTO clients
      (name,email,location,password_hash,phone_number)
      VALUES (?,?,?,?,?)`,
      [name, email, location, hashedPassword, phone_number]
    );

    res.status(201).json({
      message: 'Client registered successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Server error during client signup',
    });
  }
});

// ================= FUNDI SIGNUP =================
router.post('/signup/fundi', async (req, res) => {
  const {
    name,
    email,
    password,
    skill,
    bio,
    location,
  } = req.body;

  if (!password)
    return res.status(400).json({
      error: 'Password is required',
    });

  try {
    const [existing] = await db.query(
      'SELECT * FROM fundis WHERE email=?',
      [email]
    );

    if (existing.length)
      return res.status(400).json({
        error: 'Email already in use',
      });

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await db.query(
      `INSERT INTO fundis
      (name,email,skill,bio,location,password_hash,rating)
      VALUES (?,?,?,?,?,?,?)`,
      [
        name,
        email,
        skill,
        bio || '',
        location,
        hashedPassword,
        0,
      ]
    );

    res.status(201).json({
      message: 'Fundi registered successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Server error during fundi signup',
    });
  }
});

// ================= ADMIN SIGNUP =================
router.post('/signup/admin', async (req, res) => {
  const {
    full_name,
    email,
    username,
    password,
  } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT * FROM admins WHERE email=?',
      [email]
    );

    if (existing.length)
      return res.status(400).json({
        error: 'Admin already exists',
      });

    const hashedPassword = await bcrypt.hash(
      password,
      saltRounds
    );

    await db.query(
      `INSERT INTO admins
      (full_name,email,username,password_hash,role)
      VALUES (?,?,?,?,?)`,
      [
        full_name,
        email,
        username,
        hashedPassword,
        'Super Admin',
      ]
    );

    res.status(201).json({
      message: 'Admin created successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Server error',
    });
  }
});

// ================= LOGIN =================
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!['client', 'fundi', 'admin'].includes(role)) {
    return res.status(400).json({
      error: 'Invalid role specified',
    });
  }

  let table = '';

  if (role === 'client') table = 'clients';
  if (role === 'fundi') table = 'fundis';
  if (role === 'admin') table = 'admins';

  try {
    const [rows] = await db.query(
      `SELECT * FROM ${table} WHERE email=?`,
      [email]
    );

    if (!rows.length)
      return res.status(401).json({
        error: 'User not found',
      });

    const user = rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch)
      return res.status(401).json({
        error: 'Invalid password',
      });

    const token = jwt.sign(
      {
        id: user.id,
        role,
      },
      jwtSecret,
      {
        expiresIn: '7d',
      }
    );

    const response = {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role,
      },
    };

    if (role === 'client') {
      response.clientId = user.id;
      response.user.name = user.name;
      response.user.location = user.location;
    }

    if (role === 'fundi') {
      response.fundiId = user.id;
      response.user.name = user.name;
      response.user.location = user.location;
      response.user.skill = user.skill;
      response.user.bio = user.bio;
    }

    if (role === 'admin') {
      response.adminId = user.id;
      response.user.name = user.full_name;
      response.user.username = user.username;
    }

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Server error during login',
    });
  }
});

// ================= ADMIN DASHBOARD =================
router.get('/dashboard', async (req, res) => {

  try {

    const [[clientCount]] = await db.query(
      'SELECT COUNT(*) AS totalClients FROM clients'
    );

    const [[fundiCount]] = await db.query(
      'SELECT COUNT(*) AS totalFundis FROM fundis'
    );

    const [[jobCount]] = await db.query(
      'SELECT COUNT(*) AS totalJobs FROM jobs'
    );

    const [[skillCount]] = await db.query(
      'SELECT COUNT(DISTINCT skill) AS totalSkills FROM fundis'
    );

    const [recentClients] = await db.query(
      `SELECT id,name,email,created_at
       FROM clients
       ORDER BY created_at DESC
       LIMIT 5`
    );

    const [recentFundis] = await db.query(
      `SELECT id,name,skill,location,rating,created_at
       FROM fundis
       ORDER BY created_at DESC
       LIMIT 5`
    );

    res.json({
      clients: clientCount.totalClients,
      fundis: fundiCount.totalFundis,
      jobs: jobCount.totalJobs,
      skills: skillCount.totalSkills,
      recentClients,
      recentFundis,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Dashboard failed',
    });
  }
});
// ================= GET ALL CLIENTS =================
router.get('/clients', async (req, res) => {
  try {
    const [clients] = await db.query(`
      SELECT
        id,
        name,
        email,
        location,
        phone_number,
        created_at
      FROM clients
      ORDER BY created_at DESC
    `);

    res.json(clients);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to load clients'
    });
  }
});

// ================= SEARCH CLIENTS =================
router.get('/clients/search/:search', async (req, res) => {
  const search = `%${req.params.search}%`;

  try {
    const [clients] = await db.query(
      `SELECT
        id,
        name,
        email,
        location,
        phone_number,
        created_at
      FROM clients
      WHERE
        name LIKE ?
        OR email LIKE ?
        OR location LIKE ?
      ORDER BY created_at DESC`,
      [search, search, search]
    );

    res.json(clients);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Search failed'
    });
  }
});

// ================= DELETE CLIENT =================
router.delete('/client/:id', async (req, res) => {
  try {

    const [result] = await db.query(
      'DELETE FROM clients WHERE id=?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    res.json({
      message: 'Client deleted successfully'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to delete client'
    });
  }
});

// ================= GET ALL FUNDIS =================
router.get('/fundis', async (req, res) => {
  try {

    const [fundis] = await db.query(`
      SELECT
        id,
        name,
        email,
        skill,
        location,
        rating,
        created_at
      FROM fundis
      ORDER BY created_at DESC
    `);

    res.json(fundis);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to load fundis'
    });
  }
});

// ================= SEARCH FUNDIS =================
router.get('/fundis/search/:search', async (req, res) => {

  const search = `%${req.params.search}%`;

  try {

    const [fundis] = await db.query(
      `SELECT
        id,
        name,
        email,
        skill,
        location,
        rating,
        created_at
      FROM fundis
      WHERE
        name LIKE ?
        OR skill LIKE ?
        OR email LIKE ?
        OR location LIKE ?
      ORDER BY created_at DESC`,
      [search, search, search, search]
    );

    res.json(fundis);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Search failed'
    });
  }
});

// ================= DELETE FUNDI =================
router.delete('/fundi/:id', async (req, res) => {

  try {

    const [result] = await db.query(
      'DELETE FROM fundis WHERE id=?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Fundi not found'
      });
    }

    res.json({
      message: 'Fundi deleted successfully'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to delete fundi'
    });
  }
});

// ================= REPORTS =================
router.get('/reports', async (req, res) => {

  try {

    const [[clients]] = await db.query(
      'SELECT COUNT(*) AS total FROM clients'
    );

    const [[fundis]] = await db.query(
      'SELECT COUNT(*) AS total FROM fundis'
    );

    const [[jobs]] = await db.query(
      'SELECT COUNT(*) AS total FROM jobs'
    );

    const [[applications]] = await db.query(
      'SELECT COUNT(*) AS total FROM job_applications'
    );

    const [[reviews]] = await db.query(
      'SELECT COUNT(*) AS total FROM reviews'
    );

    res.json({
      totalClients: clients.total,
      totalFundis: fundis.total,
      totalJobs: jobs.total,
      totalApplications: applications.total,
      totalReviews: reviews.total
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to load reports'
    });
  }
});

module.exports = router;