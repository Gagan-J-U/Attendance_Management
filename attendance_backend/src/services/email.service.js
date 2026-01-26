const nodemailer = require("nodemailer");

// Create transport configuration
const transportConfig = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

const transport = nodemailer.createTransport(transportConfig);

// Verify transport connection on startup
transport.verify((error, success) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server is ready to send emails");
  }
});

exports.sendOTPEmail = async (email, otp) => {
  console.log(`Attempting to send OTP email to ${email}...`);
  
  const mailOptions = {
    from: `"Attendance Management" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password - OTP",
    text: `Your OTP for password reset is: ${otp}. This OTP is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4a90e2; text-align: center;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>You requested a password reset. Use the following 6-digit OTP to verify your request:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; color: #333; letter-spacing: 5px;">
          ${otp}
        </div>
        <p style="margin-top: 20px;">This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">Attendance Management - Automated Message</p>
      </div>
    `,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(`OTP sent to ${email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Detailed Email Error:", error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};
