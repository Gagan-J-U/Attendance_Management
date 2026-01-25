const Mentorship = require("../models/mentorship");
const User = require("../models/users");

/**
 * Assign Mentor (Admin Only)
 * POST /api/mentorship
 */
exports.assignMentor = async (req, res) => {
    try {
        const { mentorId, studentId, academicYear, semester } = req.body;

        if (!mentorId || !studentId || !academicYear || !semester) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Verify Mentor (Teacher)
        const mentor = await User.findOne({ _id: mentorId, role: "teacher", isActive: true });
        if (!mentor) return res.status(404).json({ message: "Mentor (Teacher) not found" });

        // Verify Student
        const student = await User.findOne({ _id: studentId, role: "student", isActive: true });
        if (!student) return res.status(404).json({ message: "Student not found" });

        // Check if student already has a mentor for this period?
        // Usually 1 mentor per student per sem/year.
        const existing = await Mentorship.findOne({ studentId, academicYear, semester, isActive: true });
        if (existing) {
             return res.status(409).json({ message: "Student already has a mentor for this semester" });
        }

        const mentorship = await Mentorship.create({
            mentorId,
            studentId,
            academicYear,
            semester
        });

        res.status(201).json({ message: "Mentor assigned successfully", mentorship });

    } catch (error) {
        console.error("Assign Mentor Error:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get My Mentees (Teacher)
 * GET /api/mentorship/my-mentees
 */
exports.getMyMentees = async (req, res) => {
    try {
        const mentorId = req.user._id;
        const mentees = await Mentorship.find({ mentorId, isActive: true })
            .populate("studentId", "name email studentInfo");

        res.status(200).json(mentees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get My Mentor (Student)
 * GET /api/mentorship/my-mentor
 */
exports.getMyMentor = async (req, res) => {
    try {
        const studentId = req.user._id;
        // Assuming latest active mentor
        const mentorship = await Mentorship.findOne({ studentId, isActive: true })
            .populate("mentorId", "name email teacherInfo")
            .sort({ createdAt: -1 });

        if (!mentorship) return res.status(404).json({ message: "No active mentor found" });

        res.status(200).json(mentorship);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
