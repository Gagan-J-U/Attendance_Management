const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const adminOnly = role("admin");

const {
  createClassroom,
  getAllClassrooms,
  getClassroomById,
  updateClassroom,
  updateClassroomStatus
} = require("../controllers/classroom.controller");

router.use(auth);

router.post("/", adminOnly, createClassroom);
router.get("/", adminOnly, getAllClassrooms);
router.get("/:id", adminOnly, getClassroomById);
router.put("/:id", adminOnly, updateClassroom);
router.patch("/:id/status", adminOnly, updateClassroomStatus);

module.exports = router;
