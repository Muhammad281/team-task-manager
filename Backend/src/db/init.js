require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function init() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database tables created successfully');
  await pool.end();
}

init().catch((err) => {
  console.error('Database init failed:', err.message);
  process.exit(1);
});