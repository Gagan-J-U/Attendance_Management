const Note = require("../models/notes");
const SubjectAssignment = require("../models/subjectAssignment");
const path = require("path");

/**
 * Upload a Note
 * POST /api/notes
 */
exports.uploadNote = async (req, res) => {
  try {
    const { subjectAssignmentId, title, description } = req.body;
    const uploadedBy = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!subjectAssignmentId || !title) {
        return res.status(400).json({ message: "SubjectAssignmentId and Title are required" });
    }

    // Verify SubjectAssignment exists
    const assignment = await SubjectAssignment.findById(subjectAssignmentId);
    if (!assignment) {
        return res.status(404).json({ message: "Subject Assignment not found" });
    }

    // Authorization: Only Teacher of the subject or Admin can upload
    // (Assuming req.user is populated by auth middleware)
    if (req.user.role === "teacher" && assignment.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You are not authorized to add notes to this subject." });
    }

    const note = await Note.create({
      subjectAssignmentId,
      uploadedBy,
      title,
      description,
      fileUrl: req.file.path // Storing local path for now, or cloud URL if middleware handles it
    });

    res.status(201).json({ message: "Note uploaded successfully", note });

  } catch (error) {
    console.error("Upload Note Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Notes for a Subject
 * GET /api/notes/:subjectAssignmentId
 */
exports.getNotes = async (req, res) => {
    try {
        const { subjectAssignmentId } = req.params;
        const userId = req.user._id;

        // Strict Access Control from "do all these everywhere" request
        const assignment = await SubjectAssignment.findById(subjectAssignmentId).populate("classGroupId");
        if (!assignment) {
             return res.status(404).json({ message: "Subject Assignment not found" });
        }

        if (req.user.role === "student") {
             if (!assignment.classGroupId.students.includes(userId)) {
                 return res.status(403).json({ message: "Access denied." });
             }
        } else if (req.user.role === "teacher") {
             if (assignment.teacherId.toString() !== userId.toString()) {
                 return res.status(403).json({ message: "Access denied." });
             }
        }

        const notes = await Note.find({ subjectAssignmentId, isActive: true })
            .populate("uploadedBy", "name role")
            .sort({ createdAt: -1 });

        res.status(200).json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete Note
 * DELETE /api/notes/:id
 */
exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note.findById(id);
        
        if (!note) return res.status(404).json({ message: "Note not found" });

        // Auth
        if (req.user.role !== "admin") {
             if (note.uploadedBy.toString() !== req.user._id.toString()) {
                 return res.status(403).json({ message: "Access denied" });
             }
        }

        note.isActive = false; // Soft delete
        await note.save();

        res.status(200).json({ message: "Note deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
