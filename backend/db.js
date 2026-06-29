const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'signup_signin_db';

let pool;

async function initDB() {
  if (pool) return pool;

  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test connection
    const conn = await pool.getConnection();
    console.log('✓ Connected to MySQL:', `${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    await conn.release();
    return pool;
    
  } catch (error) {
    console.error('✗ MySQL connection error:', error.message);
    throw error;
  }
}

function getPool() {
  if (!pool) throw new Error('DB not initialized. Call initDB() first.');
  return pool;
}

module.exports = { initDB, getPool };