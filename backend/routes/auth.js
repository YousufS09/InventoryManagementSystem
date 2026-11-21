const express = require("express");
const rateLimit = require("express-rate-limit");
const { signup, signin, logout, profile } = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Slows down password guessing: 10 attempts per IP every 15 minutes by default.
// AUTH_RATE_LIMIT raises it for automated tests, which sign up many users from one IP.
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
});

router.post("/signup", credentialsLimiter, signup);
router.post("/signin", credentialsLimiter, signin);
router.post("/logout", logout);
router.get("/profile", requireAuth, profile);

module.exports = router;
