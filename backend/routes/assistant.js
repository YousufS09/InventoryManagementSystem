const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth } = require("../middleware/authMiddleware");
const { chatWithAssistant } = require("../controllers/assistantController");

const router = express.Router();

// Each chat message can trigger several paid LLM calls, so cap it per user.
const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `user:${req.user.id}`,
  message: { error: "Too many assistant requests. Please wait a minute and try again." },
});

router.use(requireAuth);

router.post("/chat", assistantLimiter, chatWithAssistant);

module.exports = router;
