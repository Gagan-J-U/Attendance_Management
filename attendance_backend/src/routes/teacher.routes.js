const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const adminOnly = role("admin");
const teacherOnly = role("teacher");
const adminTeacherOnly = role(["admin", "teacher"]);

const {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacherStatus,
  updateFingerprint,
  updateTeacherProfile
} = require("../controllers/teacher.controller");

router.use(auth);

// teacher self actions (must come first)
router.patch("/me/fingerprint", teacherOnly, updateFingerprint);

// admin actions
router.post("/", adminOnly, createTeacher);
router.get("/", adminOnly, getAllTeachers);
router.patch("/:id/status", adminOnly, updateTeacherStatus);
router.put("/:id", adminOnly, updateTeacherProfile);

// admin + teacher
router.get("/:id", adminTeacherOnly, getTeacherById);

module.exports = router;
