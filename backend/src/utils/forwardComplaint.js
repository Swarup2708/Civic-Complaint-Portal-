const path = require("path");
const { generateComplaintPDF } = require("./generatePDF");
const sendEmail = require("./sendEmail");

// Complaint ka PDF banao aur municipal office ko email karo
const forwardComplaintToMunicipal = async (complaint) => {
  const filePath = path.resolve("uploads", `complaint-${complaint._id}.pdf`);
  await generateComplaintPDF(complaint, filePath);

  const text = [
    "A new civic complaint has been reported on the Civic Complaint Portal.",
    "",
    `Complaint ID : ${complaint._id}`,
    `Title        : ${complaint.title}`,
    `Category     : ${complaint.category}`,
    `Address      : ${complaint.address || "-"}`,
    `Area         : ${complaint.area}`,
    `Status       : ${complaint.status}`,
    `Reported on  : ${new Date(complaint.createdAt).toLocaleString()}`,
    "",
    "Description:",
    complaint.description,
    "",
    "The detailed report is attached as a PDF.",
  ].join("\n");

  return sendEmail(
    process.env.MUNICIPAL_EMAIL,
    `New Civic Complaint: ${complaint.title} (${complaint.area})`,
    text,
    [{ filename: `Complaint-${complaint._id}.pdf`, path: filePath }]
  );
};

module.exports = forwardComplaintToMunicipal;