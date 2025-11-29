require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

async function run() {
  try {
    console.log("BREVO_EMAIL:", process.env.BREVO_EMAIL);
    console.log(
      "BREVO_SMTP_KEY:",
      process.env.BREVO_SMTP_KEY ? "Set ✓" : "Not set ✗"
    );

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.BREVO_EMAIL,
      to: "relax8219@gmail.com",
      subject: "Brevo SMTP test",
      text: "If you see this, SMTP is working.",
    });

    console.log("Email sent, messageId:", info.messageId);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();