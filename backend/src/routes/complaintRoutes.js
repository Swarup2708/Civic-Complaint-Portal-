const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  upvoteComplaint,
  updateStatus,
  deleteComplaint,
  getMyComplaints,
  getComplaintCounts,
} = require("../controllers/complaintController");

// Specific routes FIRST (before /:id, otherwise Express treats these as an id)
router.get("/my-complaints", protect, getMyComplaints);
router.get("/stats/counts", getComplaintCounts);

// General complaint routes
router.post("/", upload.single("photo"), createComplaint);
router.get("/", getComplaints);
router.get("/:id", getComplaintById);
router.patch("/:id/upvote", upvoteComplaint);
router.patch("/:id/status", upload.single("resolutionPhoto"), updateStatus);
router.delete("/:id", deleteComplaint);

module.exports = router;