const router=require("express").Router();
const{getAllStudents,getStudentById,updateStudentStatus,createStudent,updateFingerprint,bulkUploadStudentsExcel}=require("../controllers/student.controller");
const auth=require("../middlewares/auth.middleware");
const adminOnly=require("../middlewares/role.middleware")("admin");
const studentOnly=require("../middlewares/role.middleware")("student");
const upload = require("../middlewares/upload.middleware");


router.use(auth);

router.post("/", adminOnly, createStudent);
router.get("/", adminOnly, getAllStudents);

router.get("/:id", getStudentById);

router.patch("/:id/status", adminOnly, updateStudentStatus);

// Student self fingerprint update
router.patch("/me/fingerprint", studentOnly, updateFingerprint);

router.post("/bulk-upload", adminOnly, upload.single("file"), bulkUploadStudentsExcel);





module.exports=router;