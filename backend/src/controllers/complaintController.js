const path = require("path");
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const Comment = require("../models/Comment");
const { generateComplaintPDF } = require("../utils/generatePDF");
const forwardComplaintToMunicipal = require("../utils/forwardComplaint");

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
    const { title, description, area, address } = req.body;

    if (!title || !description || !area || !address) {
      return res
        .status(400)
        .json({ message: "Title, address, area and description are required" });
    }

    const category = detectCategory(`${title} ${description}`);
    const photoUrl = req.file ? req.file.path : null;
    console.log("PHOTO URL:", photoUrl);

    const complaint = new Complaint({
      title: title.trim(),
      description: description.trim(),
      area: area.trim(),
      address: address.trim(),
      category,
      photoUrl,
      createdBy: req.user ? req.user.id : null,
    });
    console.log("Uploaded photo URL:", photoUrl);
    await complaint.save();

    // Municipal office ko auto-email (background mein)
    forwardComplaintToMunicipal(complaint).catch((err) =>
      console.error("Auto-forward failed:", err.message)
    );

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all complaints (filters + priority order: zyada upvotes pehle, tie mein purani pehle)
exports.getComplaints = async (req, res) => {
  try {
    const { category, status, area } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (area) filter.area = area;

    const complaints = await Complaint.find(filter).sort({ upvotes: -1, createdAt: 1 });
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

// Upvote complaint (ek user, ek upvote)
exports.upvoteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const userId = req.user.id;
    const alreadyUpvoted = complaint.upvotedBy.some((id) => id.toString() === userId);

    if (alreadyUpvoted) {
      return res.status(400).json({ message: "You have already upvoted this complaint" });
    }

    complaint.upvotedBy.push(userId);
    complaint.upvotes = complaint.upvotedBy.length;
    await complaint.save();

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update status (admin) - Resolved ke liye photo proof zaroori
exports.updateStatus = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const existing = await Complaint.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (status === "Resolved" && !req.file && !existing.resolutionPhoto) {
      return res.status(400).json({
        message: "Resolution photo is required to mark a complaint as Resolved",
      });
    }

    const updateData = { status };
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (req.file) updateData.resolutionPhoto = req.file.path;

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

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

// Delete complaint (admin)
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    await Comment.deleteMany({ complaint: req.params.id });
    res.json({ message: "Complaint deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logged-in citizen ki apni complaints (Profile page)
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complaint count badges
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

// Admin: ek complaint ka PDF download
exports.downloadComplaintReport = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const filePath = path.resolve("uploads", `complaint-${complaint._id}.pdf`);
    await generateComplaintPDF(complaint, filePath);
    res.download(filePath, `Complaint-${complaint._id}.pdf`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: complaint ko municipal office ko (PDF ke saath) email karo
exports.forwardComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const sent = await forwardComplaintToMunicipal(complaint);
    if (!sent) {
      return res
        .status(502)
        .json({ message: "Email could not be sent. Please check the email settings in .env" });
    }

    res.json({ message: "Complaint details and PDF report were emailed to the municipal office" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};