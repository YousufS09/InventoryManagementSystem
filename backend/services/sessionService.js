const sessions = {};

function getSession(sessionId) {
  return sessions[sessionId] || null;
}

function saveSession(
  sessionId,
  sessionData
) {
  sessions[sessionId] =
    sessionData;
  return sessions[sessionId];
}

function updateSessionData(
  sessionId,
  data
) {
  if (!sessions[sessionId]) {
    return null;
  }

  sessions[sessionId].data = {
    ...sessions[sessionId].data,
    ...data,
  };

  return sessions[sessionId];
}

function clearSession(
  sessionId
) {
  delete sessions[sessionId];
}

module.exports = {
  getSession,
  saveSession,
  updateSessionData,
  clearSession,
};