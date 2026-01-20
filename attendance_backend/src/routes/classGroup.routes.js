const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const adminOnly = role("admin");

const {
  createClassGroup,
  getClassGroups,
  getClassGroupById,
  assignClassTeacher,
  updateClassGroupStatus
} = require("../controllers/classGroup.controller");

router.use(auth);

// list class groups (role-aware)
router.get("/", getClassGroups);

// create class group
router.post("/", adminOnly, createClassGroup);

// detailed view
router.get("/:id", getClassGroupById);

// assign / change class teacher
router.patch("/:id/class-teacher", adminOnly, assignClassTeacher);

// activate / deactivate
router.patch("/:id/status", adminOnly, updateClassGroupStatus);

module.exports = router;
