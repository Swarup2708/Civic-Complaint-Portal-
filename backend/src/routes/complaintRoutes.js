const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  upvoteComplaint,
  updateStatus,
  deleteComplaint,
  getMyComplaints,
  getComplaintCounts,
  downloadComplaintReport,
  forwardComplaint,
} = require("../controllers/complaintController");

// Specific routes FIRST (before /:id)
router.get("/my-complaints", protect, getMyComplaints);
router.get("/stats/counts", getComplaintCounts);

// General complaint routes
router.post("/", protect, upload.single("photo"), createComplaint);
router.get("/", getComplaints);
router.get("/:id", getComplaintById);
router.patch("/:id/upvote", protect, upvoteComplaint);

// Admin-only routes
router.patch("/:id/status", protect, adminOnly, upload.single("resolutionPhoto"), updateStatus);
router.get("/:id/report", protect, adminOnly, downloadComplaintReport);
router.post("/:id/forward", protect, adminOnly, forwardComplaint);
router.delete("/:id", protect, adminOnly, deleteComplaint);

module.exports = router;