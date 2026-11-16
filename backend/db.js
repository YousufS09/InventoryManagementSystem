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

// Creates the tables the app needs when they do not exist yet.
// Existing tables are left untouched.
async function ensureSchema(pool) {
  const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const statements = schemaSql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function initDB() {
  if (pool) return pool;

  try {
    const ssl = DB_SSL
      ? {
          ca: fs.readFileSync(path.join(__dirname, "certs", "aiven-ca.pem")),
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
      dateStrings: ["DATE"],
      ssl,
    });

    const conn = await pool.getConnection();
    console.log(`Connected to MySQL: ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    conn.release();

    await ensureSchema(pool);
    return pool;
  } catch (error) {
    pool = undefined;
    // Connection errors such as ECONNREFUSED arrive as an AggregateError with an
    // empty message, so log the code as well.
    console.error("MySQL connection error:", error.code || "", error.message || "");
    throw error;
  }
}

function getPool() {
  if (!pool) throw new Error("DB not initialized. Call initDB() first.");
  return pool;
}

module.exports = { initDB, getPool };
