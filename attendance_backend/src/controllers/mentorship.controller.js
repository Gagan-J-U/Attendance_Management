const Mentorship = require("../models/mentorship");
const User = require("../models/users");
const MentorshipMessage = require("../models/mentorshipMessage");

/**
 * Assign Mentor (Admin Only)
 * POST /api/mentorship
 */
exports.assignMentor = async (req, res) => {
    try {
        const { mentorId, studentIds, academicYear, semester } = req.body;

        if (!mentorId || !studentIds || !Array.isArray(studentIds) || !academicYear || !semester) {
            return res.status(400).json({ message: "mentorId, studentIds (array), academicYear, and semester are required" });
        }

        // Verify Mentor (Teacher)
        const mentor = await User.findOne({ _id: mentorId, role: "teacher", isActive: true });
        if (!mentor) return res.status(404).json({ message: "Mentor (Teacher) not found" });

        const results = {
            success: [],
            error: []
        };

        for (const studentId of studentIds) {
            try {
                // Verify Student
                const student = await User.findOne({ _id: studentId, role: "student", isActive: true });
                if (!student) {
                    results.error.push({ studentId, message: "Student not found or inactive" });
                    continue;
                }

                // Check if student already has a mentor for this period
                const existing = await Mentorship.findOne({ studentId, academicYear, semester, isActive: true });
                if (existing) {
                    results.error.push({ studentId, message: "Student already has an active mentor for this semester" });
                    continue;
                }

                const mentorship = await Mentorship.create({
                    mentorId,
                    studentId,
                    academicYear,
                    semester
                });
                results.success.push({ studentId, mentorshipId: mentorship._id });
            } catch (err) {
                results.error.push({ studentId, message: err.message });
            }
        }

        res.status(200).json({ 
            message: `Processed ${studentIds.length} assignments`, 
            summary: results 
        });

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
/**
 * Get Mentorship Messages
 * GET /api/mentorship/:mentorshipId/messages
 */
exports.getMentorshipMessages = async (req, res) => {
    try {
        const { mentorshipId } = req.params;
        const messages = await MentorshipMessage.find({ mentorshipId })
            .populate("senderId", "name role")
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Send Mentorship Message
 * POST /api/mentorship/:mentorshipId/messages
 */
exports.sendMentorshipMessage = async (req, res) => {
    try {
        const { mentorshipId } = req.params;
        const { message } = req.body;
        const senderId = req.user._id;

        if (!message) return res.status(400).json({ message: "Message is required" });

        const newMessage = await MentorshipMessage.create({
            mentorshipId,
            senderId,
            message
        });

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get All Mentorships (Admin)
 */
exports.getAllMentorships = async (req, res) => {
    try {
        const mentorships = await Mentorship.find()
            .populate("mentorId", "name email teacherInfo")
            .populate("studentId", "name email studentInfo")
            .sort({ createdAt: -1 });

        res.status(200).json(mentorships);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
