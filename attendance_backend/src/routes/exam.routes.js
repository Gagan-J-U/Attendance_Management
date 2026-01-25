const express = require("express");
const router = express.Router();
const examController = require("../controllers/exam.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.use(authMiddleware);

router.post("/", roleMiddleware("admin"), examController.createExam);

module.exports = router;
