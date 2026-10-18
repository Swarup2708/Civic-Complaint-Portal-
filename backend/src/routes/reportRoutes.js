const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { generateConsolidatedReport, getAnalytics } = require("../controllers/reportController");

router.get("/consolidated", protect, adminOnly, generateConsolidatedReport);
router.get("/analytics", protect, adminOnly, getAnalytics);

module.exports = router;