const Complaint = require("../models/Complaint");

// Auto-categorization helper
function detectCategory(text) {
  const desc = text.toLowerCase();
  const categories = {
    Streetlight: ["light", "streetlight", "bulb", "pole", "andhera", "dark"],
    Garbage: ["garbage", "trash", "waste", "kachra", "dustbin", "smell"],
    Water: ["water", "leak", "paani", "pipe", "supply", "drainage"],
    Road: ["road", "pothole", "gaddha", "footpath", "traffic", "damage"],
  };

  for (const category in categories) {
    if (categories[category].some((keyword) => desc.includes(keyword))) {
      return category;
    }
  }
  return "Other";
}

// Create complaint
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, area } = req.body;
    const category = detectCategory(description);
    const photoUrl = req.file ? req.file.path : null;

    const complaint = new Complaint({
      title,
      description,
      area,
      category,
      photoUrl,
      createdBy: req.user ? req.user.id : null,
    });

    await complaint.save();
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all complaints (with optional filters)
exports.getComplaints = async (req, res) => {
  try {
    const { category, status, area } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (area) filter.area = area;

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single complaint
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upvote complaint
exports.upvoteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update status (admin)
// REPLACE your existing updateStatus function with this:
exports.updateStatus = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const updateData = { status };
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (req.file) updateData.resolutionPhoto = req.file.path;

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    // Create in-app notification for the citizen who filed it
    if (complaint.createdBy) {
      await Notification.create({
        user: complaint.createdBy,
        complaint: complaint._id,
        message: `Your complaint "${complaint.title}" is now ${status}`,
      });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete complaint
exports.deleteComplaint = async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: "Complaint deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Notification = require("../models/Notification");

// Get logged-in citizen's own complaints (for Profile Page)
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complaint count badges (Total / Pending / In Progress / Resolved)
exports.getComplaintCounts = async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: "Pending" });
    const inProgress = await Complaint.countDocuments({ status: "In Progress" });
    const resolved = await Complaint.countDocuments({ status: "Resolved" });

    res.json({ total, pending, inProgress, resolved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};