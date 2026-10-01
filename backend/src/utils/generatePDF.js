const PDFDocument = require("pdfkit");
const fs = require("fs");

const generateComplaintPDF = (complaint, filePath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).text("Civic Complaint Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Complaint ID: ${complaint._id}`);
    doc.text(`Title: ${complaint.title}`);
    doc.text(`Category: ${complaint.category}`);
    doc.text(`Area: ${complaint.area}`);
    doc.text(`Description: ${complaint.description}`);
    doc.text(`Status: ${complaint.status}`);
    doc.text(`Date: ${complaint.createdAt}`);

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

const generateConsolidatedPDF = (summaryData, filePath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).text("Civic Complaint Summary Report", { align: "center" });
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.moveDown(1.5);

    let currentArea = null;
    summaryData.forEach((item) => {
      if (item._id.area !== currentArea) {
        currentArea = item._id.area;
        doc.moveDown(0.5).fontSize(13).text(`AREA: ${currentArea}`, { underline: true });
      }
      doc.fontSize(11).text(
        `  ${item._id.category} — ${item.count} complaints (Pending: ${item.pending}, In Progress: ${item.inProgress}, Resolved: ${item.resolved})`
      );
    });

    doc.end();
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

module.exports = { generateComplaintPDF, generateConsolidatedPDF };

