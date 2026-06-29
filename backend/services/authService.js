const bcrypt = require("bcrypt");
const { getPool } = require("../db");

const SALT_ROUNDS = 10;
   
async function getUserByEmail(email) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, username, email, password, createdAt FROM `user` WHERE email = ? LIMIT 1",
    [email.toLowerCase()]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function createUser({ username, email, password }) {
  const pool = getPool();
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const createdAt = new Date();

  const [result] = await pool.query(
    "INSERT INTO `user` (username, email, password, createdAt) VALUES (?, ?, ?, ?)",
    [username, email.toLowerCase(), hashedPassword, createdAt]
  );

  return { id: result.insertId, username, email: email.toLowerCase(), createdAt };
}

async function authenticateUser(email, password){
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  return isMatch ? user : null;
}

module.exports = { getUserByEmail, createUser, authenticateUser };