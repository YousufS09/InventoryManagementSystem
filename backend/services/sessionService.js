// In-memory store for multi-step assistant conversations (e.g. "create customer" asking one field at a time).
// Entries expire after SESSION_TTL_MS of inactivity so memory cannot grow without limit.
// Note: data is lost on restart and is not shared between server instances.

const SESSION_TTL_MS = 15 * 60 * 1000;
const MAX_SESSIONS = 5000;

const sessions = new Map();

function isExpired(entry) {
  return Date.now() - entry.updatedAt > SESSION_TTL_MS;
}

function getSession(key) {
  const entry = sessions.get(key);
  if (!entry) {
    return null;
  }
  if (isExpired(entry)) {
    sessions.delete(key);
    return null;
  }
  return entry.session;
}

function saveSession(key, session) {
  // Map keeps insertion order, so the first key is the oldest. Drop it when full.
  if (!sessions.has(key) && sessions.size >= MAX_SESSIONS) {
    sessions.delete(sessions.keys().next().value);
  }
  sessions.delete(key);
  sessions.set(key, { session, updatedAt: Date.now() });
  return session;
}

function clearSession(key) {
  sessions.delete(key);
}

const cleanupTimer = setInterval(() => {
  for (const [key, entry] of sessions) {
    if (isExpired(entry)) {
      sessions.delete(key);
    }
  }
}, 60 * 1000);

// Do not keep the process alive just for this timer.
cleanupTimer.unref();

module.exports = {
  getSession,
  saveSession,
  clearSession,
};
