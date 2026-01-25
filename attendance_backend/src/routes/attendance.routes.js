const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.use(authMiddleware);

router.post("/manual", roleMiddleware("teacher", "admin"), attendanceController.markManualAttendance);
// Fingerprint is typically from a shared device or student app.
// If shared device, it might need a special "device" token/role, but assuming student/admin/teacher logins for now.
router.post("/fingerprint", attendanceController.markFingerprintAttendance);
router.post("/close", roleMiddleware("teacher", "admin"), attendanceController.closeSession);

module.exports = router;
