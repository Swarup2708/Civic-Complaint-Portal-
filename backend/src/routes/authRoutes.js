const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { getProfile } = require("../controllers/authController");

router.get("/profile", protect, getProfile);
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;