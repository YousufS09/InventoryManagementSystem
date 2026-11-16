const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

function readTokenFromCookie(cookieHeader) {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key === "token") {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : readTokenFromCookie(req.headers.cookie);

  if (!token) {
    return res.status(401).json({ error: "Authorization token required." });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = { requireAuth };
