const { getPool } = require("../db");

// Multi-step assistant conversations, stored in MySQL (assistant_sessions) so they
// survive restarts and work with more than one server instance.
// `ctx` is { key, userId }; key is "<userId>:<browser session id>".

const SESSION_TTL_MINUTES = 15;

async function getSession(ctx) {
  const [rows] = await getPool().execute(
    `SELECT data FROM assistant_sessions
     WHERE session_key = ? AND user_id = ?
       AND updated_at > (CURRENT_TIMESTAMP - INTERVAL ${SESSION_TTL_MINUTES} MINUTE)`,
    [ctx.key, ctx.userId]
  );
  if (!rows[0]) {
    return null;
  }
  // mysql2 parses JSON columns; older MySQL/MariaDB setups may return a string.
  const { data } = rows[0];
  return typeof data === "string" ? JSON.parse(data) : data;
}

async function saveSession(ctx, session) {
  await getPool().execute(
    `INSERT INTO assistant_sessions (session_key, user_id, data, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE data = VALUES(data), user_id = VALUES(user_id), updated_at = CURRENT_TIMESTAMP`,
    [ctx.key, ctx.userId, JSON.stringify(session)]
  );
  return session;
}

async function clearSession(ctx) {
  await getPool().execute("DELETE FROM assistant_sessions WHERE session_key = ?", [ctx.key]);
}

async function deleteExpiredSessions() {
  await getPool().execute(
    `DELETE FROM assistant_sessions
     WHERE updated_at < (CURRENT_TIMESTAMP - INTERVAL ${SESSION_TTL_MINUTES} MINUTE)`
  );
}

const cleanupTimer = setInterval(() => {
  deleteExpiredSessions().catch((error) => {
    // The pool is not ready during startup; anything else is worth logging.
    if (!/not initialized/i.test(error.message)) {
      console.error("Assistant session cleanup failed:", error.message);
    }
  });
}, 5 * 60 * 1000);

// Do not keep the process alive just for this timer.
cleanupTimer.unref();

module.exports = {
  getSession,
  saveSession,
  clearSession,
  deleteExpiredSessions,
};
