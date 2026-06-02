const pool = require('./src/config/db');

async function makeAdmin() {
  try {
    await pool.query("UPDATE usuario SET rol = 'Admin' WHERE correo = 'franciscoarias108@gmail.com'");
    console.log('Done!');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
makeAdmin();
