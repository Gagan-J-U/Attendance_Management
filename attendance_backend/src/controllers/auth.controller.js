const jwt = require("jsonwebtoken");
const User = require("../models/users");

/**
 * LOGIN
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true });
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
      user: {
        id: user._id,
        name: user.name,
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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    await User.create({
      name,
      email,
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
