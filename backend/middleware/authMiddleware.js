const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  let token = null;

  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // 2. Check Cookie header fallback
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(";").reduce((acc, c) => {
      const [key, ...valParts] = c.trim().split("=");
      acc[key] = valParts.join("=");
      return acc;
    }, {});
    token = cookies.token;
  }

  const secret = process.env.JWT_SECRET || "secret-key";

  if (!token) {
    return res.status(401).json({ error: "Authorization token required." });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = { requireAuth };
