const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const adminOnly = role("admin");

const {
  createClassGroup,
  getAllClassGroups,
  getClassGroupById,
  assignClassTeacher,
  updateClassGroupStatus
  ,addStudentToClassGroup,
  removeStudentFromClassGroup
} = require("../controllers/classGroup.controller");

router.use(auth);

// list class groups (role-aware)
router.post("/", adminOnly, createClassGroup);
router.get("/", getAllClassGroups);
router.get("/:id", getClassGroupById);

router.patch("/:id/teacher", adminOnly, assignClassTeacher);
router.patch("/:id/status", adminOnly, updateClassGroupStatus);

router.post("/:id/students", adminOnly, addStudentToClassGroup);
router.delete("/:id/students/:studentId", adminOnly, removeStudentFromClassGroup);


module.exports = router;
