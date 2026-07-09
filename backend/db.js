const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "signup_signin_db";
const DB_SSL = process.env.DB_SSL === "true";

let pool;

async function ensureAuthSchema(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS \`user\` (
      id INT NOT NULL AUTO_INCREMENT,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_user_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function initDB() {
  if (pool) return pool;

  try {
    const ssl = DB_SSL
      ? {
          ca: fs.readFileSync(
            path.join(__dirname, "certs", "aiven-ca.pem")
          ),
          rejectUnauthorized: true,
        }
      : undefined;

    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl,
    });

    const conn = await pool.getConnection();
    console.log(`Connected to MySQL: ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    conn.release();

    await ensureAuthSchema(pool);
    return pool;
  } catch (error) {
    console.error("MySQL connection error:", error.message);
    throw error;
  }
}

function getPool() {
  if (!pool) throw new Error("DB not initialized. Call initDB() first.");
  return pool;
}

module.exports = { initDB, getPool };
