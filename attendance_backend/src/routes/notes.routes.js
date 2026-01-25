const express = require("express");
const router = express.Router();
const notesController = require("../controllers/notes.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const upload = require("../middlewares/noteUpload.middleware");

// Protect all routes
router.use(authMiddleware);

// Upload Note
router.post(
    "/", 
    roleMiddleware("teacher", "admin"), // Only teachers/admins can upload notes for now
    upload.single("file"), 
    notesController.uploadNote
);

// Get Notes
router.get("/:subjectAssignmentId", notesController.getNotes);

// Delete Note
router.delete("/:id", roleMiddleware("teacher", "admin"), notesController.deleteNote);

module.exports = router;
