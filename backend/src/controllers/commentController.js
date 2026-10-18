const Comment = require("../models/Comment");
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ complaint: req.params.complaintId })
      .populate("user", "name role")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const comment = await Comment.create({
      complaint: complaint._id,
      user: req.user.id,
      text: text.trim(),
    });

    // Complaint ke owner ko notification, jab koi aur comment kare
    if (complaint.createdBy && complaint.createdBy.toString() !== req.user.id) {
      await Notification.create({
        user: complaint.createdBy,
        complaint: complaint._id,
        message: `New comment on your complaint "${complaint.title}"`,
      });
    }

    const populated = await comment.populate("user", "name role");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isOwner = comment.user.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed to delete this comment" });
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};