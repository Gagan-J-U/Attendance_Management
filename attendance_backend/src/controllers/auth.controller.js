const jwt = require("jsonwebtoken");
const User = require("../models/users");
const OTP = require("../models/otp");
const { sendOTPEmail } = require("../services/email.service");

/**
 * LOGIN
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
  token,
  expiresIn: 7 * 24 * 60 * 60, // seconds
  user: {
    id: user._id,
    name: user.name,
    email: user.email,   // 👈 useful for UI
    role: user.role
  }
});

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * REGISTER
 * (No token issued — user must login)
 */
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      role,
      studentInfo,
      teacherInfo,
      adminInfo
    } = req.body;

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    await User.create({
      name,
      email: email.trim().toLowerCase(),
      password,
      phoneNumber,
      role,
      studentInfo,
      teacherInfo,
      adminInfo
    });

    res.status(201).json({
      message: "Registration successful. Please login to continue."
    });
  } catch (err) {
    res.status(500).json({
      message: "Registration failed",
      error: err.message
    });
  }
};

/**
 * FORGOT PASSWORD - Send OTP
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`Forgot Password request for: [${normalizedEmail}]`);
    
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`User not found for forgot password: [${normalizedEmail}]`);
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB (replaces existing if any due to same email)
    await OTP.findOneAndUpdate(
      { email: normalizedEmail },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send Email
    await sendOTPEmail(user.email, otp);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Forgot Password error:", err);
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

/**
 * VERIFY OTP
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`Verifying OTP for: [${normalizedEmail}] with OTP: [${otp}]`);

    const otpEntry = await OTP.findOne({ email: normalizedEmail, otp });

    if (!otpEntry) {
      console.log(`OTP missmatch or expired for: [${normalizedEmail}]`);
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
};

/**
 * RESET PASSWORD
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`Resetting password for: [${normalizedEmail}]`);

    // Verify OTP again for security during reset
    const otpEntry = await OTP.findOne({ email: normalizedEmail, otp });
    if (!otpEntry) {
      console.log(`Invalid OTP during reset for: [${normalizedEmail}]`);
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`User not found during reset for: [${normalizedEmail}]`);
      // List all users to see if there's a case mismatch (temp debug)
      const allUsers = await User.find({}, "email");
      console.log("Current Users in DB:", allUsers.map(u => u.email));
      
      return res.status(404).json({ message: "User not found" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Delete OTP after use
    await OTP.deleteOne({ _id: otpEntry._id });

    console.log(`Password reset success for: [${normalizedEmail}]`);
    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password error:", err);
    res.status(500).json({ message: "Failed to reset password", error: err.message });
  }
};
