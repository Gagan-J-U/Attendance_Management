const express = require("express");
const router = express.Router();
const bulkController = require("../controllers/bulk.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const upload = require("../middlewares/bulkUpload.middleware");

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.post("/students", upload.single("file"), bulkController.bulkUploadStudents);
router.post("/teachers", upload.single("file"), bulkController.bulkUploadTeachers);

module.exports = router;
