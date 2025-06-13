// db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',        // ✅ Localhost instead of fundi_connection
  user: 'root',
  password: '1a2bacadae',
  database: 'fundi_app',
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('✅ Connected to database.');
});

module.exports = connection;
