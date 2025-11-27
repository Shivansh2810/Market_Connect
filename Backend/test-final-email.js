require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testFinalConfig() {
  try {
    console.log("Testing Brevo SMTP Configuration...");
    console.log("BREVO_EMAIL:", process.env.BREVO_EMAIL);
    console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
    console.log("BREVO_SMTP_KEY:", process.env.BREVO_SMTP_KEY ? "Set ✓" : "Not set ✗");

    await transporter.verify();
    console.log("✅ Brevo SMTP connection successful!");

    const info = await transporter.sendMail({
      from: {
        name: "Market Connect",
        address: process.env.EMAIL_FROM || process.env.BREVO_EMAIL,
      },
      to: "pnama811@gmail.com",
      subject: "Test - Forgot Password Email Working!",
      html: `
        <h1>✅ Email System is Working!</h1>
        <p>This is a test email for the forgot password functionality.</p>
        <p>Your email configuration is now properly set up.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    });

    console.log("✅ Test email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("\n🎉 SUCCESS! Check pnama811@gmail.com inbox!");
  } catch (error) {
    console.error("❌ Test failed:");
    console.error("Error:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  }
}

testFinalConfig();
