const express = require("express");
const { signup, signin, logout, profile } = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);
router.get("/profile", requireAuth, profile);

module.exports = router;
