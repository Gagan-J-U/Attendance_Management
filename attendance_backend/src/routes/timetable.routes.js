const express = require("express");
const router = express.Router();
const timetableController = require("../controllers/timetable.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.use(authMiddleware);

router.get("/weekly/:classGroupId", timetableController.getWeeklyTimetable);
router.get("/teacher-weekly/:teacherId", roleMiddleware("teacher", "admin"), timetableController.getTeacherWeeklyTimetable);
router.post("/override", roleMiddleware("teacher", "admin"), timetableController.createOverride);
router.post("/extra", roleMiddleware("teacher", "admin"), timetableController.createExtraClass);
router.get("/teacher-status/:teacherId", roleMiddleware("teacher", "admin"), timetableController.getTeacherStatus);
router.get("/available-classrooms", roleMiddleware("admin", "teacher"), timetableController.getAvailableClassrooms);

// Admin Timetable Management
const adminOnly = roleMiddleware("admin");
router.post("/", adminOnly, timetableController.createTimetable);
router.patch("/:id", adminOnly, timetableController.updateTimetable);
router.delete("/:id", adminOnly, timetableController.deleteTimetable);
router.get("/class/:classGroupId", timetableController.getTimetableByClass);

module.exports = router;
