const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Protect all routes
router.use(authMiddleware);

// Send Message (Any authenticated user in the context can send - validation in controller)
router.post("/send", chatController.sendMessage);

// Get Messages
router.get("/:subjectAssignmentId", chatController.getMessages);

module.exports = router;
