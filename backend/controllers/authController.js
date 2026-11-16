const jwt = require("jsonwebtoken");
const { createUser, authenticateUser, getUserByEmail } = require("../services/authService");
const { jwtSecret, jwtExpiresIn, isProduction } = require("../config");
const { validate, signupSchema, signinSchema } = require("../utils/validation");

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  };
}

function createToken(user) {
  const payload = { id: user.id, email: user.email, username: user.username };
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

async function signup(req, res) {
  const { data, error } = validate(signupSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const user = await createUser(data);
    const token = createToken(user);

    res.cookie("token", token, getCookieOptions());

    return res.status(201).json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Failed to create account." });
  }
}

async function signin(req, res) {
  const { data, error } = validate(signinSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const user = await authenticateUser(data.email, data.password);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = createToken(user);
    res.cookie("token", token, getCookieOptions());

    return res.status(200).json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("Signin error:", err);
    return res.status(500).json({ error: "Failed to sign in." });
  }
}

function profile(req, res) {
  const { id, username, email } = req.user;
  return res.status(200).json({ user: { id, username, email } });
}

function logout(req, res) {
  const { maxAge, ...clearOptions } = getCookieOptions();
  res.clearCookie("token", clearOptions);
  return res.status(200).json({ message: "Logged out successfully." });
}

module.exports = { signup, signin, logout, profile };
