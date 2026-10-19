const { Resend } = require("resend");
const fs = require("fs");
const path = require("path");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text, attachments = []) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing");
    }

    const recipient = to || process.env.MUNICIPAL_EMAIL;

    if (!recipient) {
      throw new Error("Municipal email recipient is missing");
    }

    const resendAttachments = [];

    for (const attachment of attachments) {
      if (attachment.path && fs.existsSync(attachment.path)) {
        const fileContent = await fs.promises.readFile(attachment.path);

        resendAttachments.push({
          filename:
            attachment.filename || path.basename(attachment.path),
          content: fileContent.toString("base64"),
        });
      } else if (attachment.content) {
        const content = Buffer.isBuffer(attachment.content)
          ? attachment.content.toString("base64")
          : Buffer.from(attachment.content).toString("base64");

        resendAttachments.push({
          filename: attachment.filename || "attachment.txt",
          content,
        });
      } else {
        console.warn("Skipping unavailable attachment:", attachment.filename);
      }
    }

    const { data, error } = await resend.emails.send({
      from: "Civic Complaint Portal <onboarding@resend.dev>",
      to: [recipient],
      subject,
      text,
      ...(resendAttachments.length > 0
        ? { attachments: resendAttachments }
        : {}),
    });

    if (error) {
      console.error("Resend email error:", error);
      return false;
    }

    console.log("Email accepted by Resend. ID:", data?.id);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return false;
  }
};

module.exports = sendEmail;
