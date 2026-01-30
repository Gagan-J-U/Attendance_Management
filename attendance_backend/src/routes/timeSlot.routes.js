const router=require("express").Router();
const auth=require("../middlewares/auth.middleware");
const adminOnly=require("../middlewares/role.middleware")("admin");
const{createTimeSlot,getAllTimeSlots,updateTimeSlot,deleteTimeSlot}=require("../controllers/timeSlot.controller");

router.use(auth);

router.post("/",adminOnly,createTimeSlot);
router.get("/",getAllTimeSlots);
router.patch("/:id",adminOnly,updateTimeSlot);
router.delete("/:id",adminOnly,deleteTimeSlot);

module.exports=router;