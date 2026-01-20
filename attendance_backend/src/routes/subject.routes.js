const router=require("express").Router();
const auth=require("../middlewares/auth.middleware");
const adminAuth=require("../middlewares/role.middleware");
const {updateSubjectStatus,allSubjects,newSubject,editSubject}=require("../controllers/subject.controller");

router.use(auth);
router.use(adminAuth("admin"));

router.get("/",allSubjects);
router.post("/",newSubject);
router.put("/:id",editSubject);
router.patch("/:id/status",updateSubjectStatus);
module.exports=router;