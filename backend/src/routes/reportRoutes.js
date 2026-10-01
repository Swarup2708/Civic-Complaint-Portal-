const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { generateConsolidatedReport } = require("../controllers/reportController");

router.get("/consolidated", protect, adminOnly, generateConsolidatedReport);

module.exports = router;