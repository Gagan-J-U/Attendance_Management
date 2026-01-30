const express = require("express");
const router = express.Router();
const teacherAttendanceController = require("../controllers/teacherAttendance.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.use(authMiddleware);

router.post("/status", roleMiddleware("teacher", "admin"), teacherAttendanceController.markStatus);
router.get("/me", roleMiddleware("teacher"), teacherAttendanceController.getMyAttendance);

module.exports = router;
