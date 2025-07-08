// db.js
const mysql = require('mysql2/promise'); // ✅ Use promise-based MySQL

const pool = mysql.createPool({
  host: 'localhost',        // ✅ Localhost instead of fundi_connection
  user: 'root',
  password: '1a2bacadae',
  database: 'fundi_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Optional: test connection on startup
pool.getConnection()
  .then(() => console.log('✅ Connected to database.'))
  .catch(err => console.error('❌ DB Connection Error:', err));

module.exports = pool;
