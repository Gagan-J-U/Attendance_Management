const TeacherAttendance = require("../models/teacherAttendance");

/**
 * Mark Teacher Status (Busy, On-leave, etc.)
 * POST /api/teacher-attendance/status
 */
exports.markStatus = async (req, res) => {
    try {
        const { date, timeSlotId, status, remark, method } = req.body;
        const teacherId = req.user._id;

        // Upsert logic
        const query = { 
            teacherId, 
            date: new Date(date), 
            timeSlotId: timeSlotId || null 
        };
        
        const update = { 
            status, 
            remark, 
            method: method || "manual",
            markedBy: req.user._id 
        };
        
        const options = { upsert: true, new: true, setDefaultsOnInsert: true };

        const attendance = await TeacherAttendance.findOneAndUpdate(query, update, options);

        res.status(200).json({
            message: "Status updated successfully",
            attendance
        });

    } catch (error) {
        console.error("Mark teacher status error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Get My Attendance Records
 * GET /api/teacher-attendance/me
 */
exports.getMyAttendance = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const { startDate, endDate } = req.query;

        const query = { teacherId };
        if (startDate && endDate) {
            query.date = { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate) 
            };
        }

        const records = await TeacherAttendance.find(query)
            .populate("timeSlotId")
            .sort({ date: -1 });

        res.status(200).json(records);
    } catch (error) {
        console.error("Get teacher attendance error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
