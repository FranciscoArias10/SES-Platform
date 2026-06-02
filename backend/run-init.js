const fs = require('fs');
const path = require('path');
const pool = require('./src/config/db');

async function runInit() {
  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running init.sql...');
    await pool.query(sql);
    console.log('init.sql executed successfully!');
  } catch (error) {
    console.error('Error running init.sql:', error.message);
  } finally {
    process.exit();
  }
}

runInit();
