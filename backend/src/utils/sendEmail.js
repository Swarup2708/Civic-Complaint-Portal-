
const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text, attachments = []) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      attachments,
    });

    console.log("Email sent successfully");
    return true;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return false;
  }
};

module.exports = sendEmail;
