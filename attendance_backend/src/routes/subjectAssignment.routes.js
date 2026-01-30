const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const {getSubjectAssignments, createSubjectAssignment, updateSubjectAssignmentStatus,getSubjectAssignmentDetails, getSubjectAssignmentsByClass}=require("../controllers/subjectAssignment.controller");
const adminOnly = require("../middlewares/role.middleware")("admin");
router.use(auth);

router.get("/", getSubjectAssignments);
router.post("/", adminOnly, createSubjectAssignment);
router.get("/class/:classGroupId", getSubjectAssignmentsByClass);
router.get("/:id", getSubjectAssignmentDetails);
router.put("/:id", adminOnly, updateSubjectAssignmentStatus);

module.exports = router;