const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ggshop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Tester la connexion
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connecté');
    connection.release();
  } catch (error) {
    console.error('❌ Erreur MySQL:', error.message);
    process.exit(1);
  }
};

testConnection();

module.exports = pool;
