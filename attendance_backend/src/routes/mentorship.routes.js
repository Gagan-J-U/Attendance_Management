const express = require("express");
const router = express.Router();
const mentorshipController = require("../controllers/mentorship.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.use(authMiddleware);

// Admin assigns rights
router.post("/", roleMiddleware("admin"), mentorshipController.assignMentor);

// Teacher view
router.get("/my-mentees", roleMiddleware("teacher"), mentorshipController.getMyMentees);

// Student view
router.get("/my-mentor", roleMiddleware("student"), mentorshipController.getMyMentor);

module.exports = router;
