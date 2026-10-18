const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getComments, addComment, deleteComment } = require("../controllers/commentController");

router.get("/:complaintId", getComments);
router.post("/:complaintId", protect, addComment);
router.delete("/:id", protect, deleteComment);

module.exports = router;