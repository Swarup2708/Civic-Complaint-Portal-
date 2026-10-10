const Complaint = require("../models/Complaint");
const { generateConsolidatedPDF } = require("../utils/generatePDF");
const sendEmail = require("../utils/sendEmail");
const path = require("path");

exports.generateConsolidatedReport = async (req, res) => {
  try {
    const summary = await Complaint.aggregate([
      {
        $group: {
          _id: { area: "$area", category: "$category" },
          count: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
        },
      },
      { $sort: { "_id.area": 1 } },
    ]);

    const filePath = path.resolve("uploads", `consolidated-report-${Date.now()}.pdf`);
    await generateConsolidatedPDF(summary, filePath);

    await sendEmail(
      process.env.MUNICIPAL_EMAIL,
      "Weekly Civic Complaint Summary Report",
      "Please find attached the consolidated area-wise and category-wise complaint report.",
      [{ filename: "Civic-Complaint-Report.pdf", path: filePath }]
    );

    res.json({ message: "Consolidated report generated and emailed", summary, filePath });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};