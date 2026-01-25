const ClassMessage = require("../models/classMessage");
const SubjectAssignment = require("../models/subjectAssignment");

/**
 * Send Message
 * POST /api/chat/send
 */
exports.sendMessage = async (req, res) => {
    try {
        const { subjectAssignmentId, message } = req.body;
        const senderId = req.user._id;

        if (!subjectAssignmentId || !message) {
            return res.status(400).json({ message: "Missing fields" });
        }

        // Verify SubjectAssignment exists and Populate classGroup for student check
        const assignment = await SubjectAssignment.findById(subjectAssignmentId).populate("classGroupId");
        if (!assignment) {
             return res.status(404).json({ message: "Subject Assignment not found" });
        }

        // Authorization Checks
        if (req.user.role === "student") {
            const isStudentInGroup = assignment.classGroupId.students.includes(senderId);
            if (!isStudentInGroup) {
                return res.status(403).json({ message: "You are not part of this class group." });
            }
        } 
        else if (req.user.role === "teacher") {
             if (assignment.teacherId.toString() !== senderId.toString()) {
                 return res.status(403).json({ message: "You are not the teacher for this subject." });
             }
        } 
        // Admin allowed by default if role middleware passes
        
        const newMessage = await ClassMessage.create({
            subjectAssignmentId,
            senderId,
            message
        });

        const populatedMessage = await ClassMessage.findById(newMessage._id).populate("senderId", "name role");

        res.status(201).json(populatedMessage);

    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Messages
 * GET /api/chat/:subjectAssignmentId?page=1&limit=50
 */
exports.getMessages = async (req, res) => {
    try {
        const { subjectAssignmentId } = req.params;
        const userId = req.user._id;

        // Verify Access
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

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            ClassMessage.find({ subjectAssignmentId })
                .populate("senderId", "name role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ClassMessage.countDocuments({ subjectAssignmentId })
        ]);

        res.status(200).json({
            messages: messages.reverse(),
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
