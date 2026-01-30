const express = require("express");
const router = express.Router();
const mentorshipController = require("../controllers/mentorship.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.use(authMiddleware);

// Admin views
router.get("/", roleMiddleware("admin"), mentorshipController.getAllMentorships);
router.post("/", roleMiddleware("admin"), mentorshipController.assignMentor);

// Teacher view
router.get("/my-mentees", roleMiddleware("teacher"), mentorshipController.getMyMentees);

// Student view
// Student view
router.get("/my-mentor", roleMiddleware("student"), mentorshipController.getMyMentor);

// Chat
router.get("/:mentorshipId/messages", mentorshipController.getMentorshipMessages);
router.post("/:mentorshipId/messages", mentorshipController.sendMentorshipMessage);

module.exports = router;
