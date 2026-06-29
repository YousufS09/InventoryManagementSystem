const jwt = require("jsonwebtoken");
const { createUser, authenticateUser, getUserByEmail } = require("../services/authService");

function getCookieOptions() {
  const isProduction =
    process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  };
}

function createToken(user) {
  const payload = { id: user.id, email: user.email, username: user.username };
  const secret = process.env.JWT_SECRET || "secret-key";
  const expiresIn = process.env.JWT_EXPIRES_IN || "2h";

  return jwt.sign(payload, secret, { expiresIn });
}

async function signup(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required." });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const user = await createUser({ username, email, password });
    const token = createToken(user);

    res.cookie("token", token, getCookieOptions());

    res.status(201).json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create account." });
  }
}
  
async function signin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = createToken(user);
    res.cookie("token", token, getCookieOptions());

    res.status(200).json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to sign in." });
  }
}

function profile(req, res) {
  return res.status(200).json({ user: req.user });
}

function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  return res.status(200).json({ message: "Logged out successfully." });
}

module.exports = { signup, signin, logout, profile };
