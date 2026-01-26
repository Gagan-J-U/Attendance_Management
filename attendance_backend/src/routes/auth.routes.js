const express = require("express");
const { login, register, forgotPassword, verifyOTP, resetPassword } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;
