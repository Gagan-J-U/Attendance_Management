const express = require("express");
const router = express.Router();
const timetableController = require("../controllers/timetable.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.use(authMiddleware);

router.get("/weekly/:classGroupId", timetableController.getWeeklyTimetable);
router.post("/override", roleMiddleware("teacher", "admin"), timetableController.createOverride);
router.post("/extra", roleMiddleware("teacher", "admin"), timetableController.createExtraClass);
router.get("/teacher-status/:teacherId", roleMiddleware("teacher", "admin"), timetableController.getTeacherStatus);

module.exports = router;
