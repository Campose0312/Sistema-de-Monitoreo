const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // Verifica que sea tu usuario
  password: '',      // Verifica que sea tu contraseña
  database: 'catatumbo_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();