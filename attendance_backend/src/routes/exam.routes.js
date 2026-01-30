const express = require("express");
const router = express.Router();
const examController = require("../controllers/exam.controller");
const { createExam, getAllExams, deleteExam } = examController;
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.use(authMiddleware);

router.post("/", roleMiddleware("admin"), createExam);
router.get("/", getAllExams);
router.delete("/:id", roleMiddleware("admin"), deleteExam || ((req, res) => res.status(501).json({message: "Not implemented"})));

module.exports = router;
