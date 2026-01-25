const AttendanceSession = require("../models/attendanceSession");
const AttendanceRecord = require("../models/attendanceRecord");
const User = require("../models/users");
const ClassGroup = require("../models/classGroup");

/**
 * Mark Manual Attendance (Teacher)
 * POST /api/attendance/manual
 */
exports.markManualAttendance = async (req, res) => {
    try {
        const { sessionId, studentStatuses } = req.body; 
        // studentStatuses: [{ studentId, status: "present"/"absent"/"late" }]

        const session = await AttendanceSession.findById(sessionId);
        if (!session) return res.status(404).json({ message: "Session not found" });

        // Bulk write for efficiency
        const operations = studentStatuses.map(s => ({
            updateOne: {
                filter: { attendanceSessionId: sessionId, studentId: s.studentId },
                update: { 
                    status: s.status, 
                    markedBy: req.user?._id, // Teacher ID
                    markedAt: new Date()
                },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await AttendanceRecord.bulkWrite(operations);
        }

        res.status(200).json({ message: "Attendance updated" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Mark Fingerprint (Student/Device)
 * POST /api/attendance/fingerprint
 */
exports.markFingerprintAttendance = async (req, res) => {
    try {
        const { sessionId, deviceId } = req.body; 
        const studentId = req.user._id; // Trust the JWT

        // 1. Find ACTIVE Session
        const session = await AttendanceSession.findById(sessionId);
        
        if (!session) {
             return res.status(404).json({ message: "Session not found" });
        }

        if (!session.isActive || session.isLocked) {
            return res.status(400).json({ message: "Session is closed or inactive." });
        }

        // 2. Mark Attendance
        const record = await AttendanceRecord.findOneAndUpdate(
            { attendanceSessionId: sessionId, studentId },
            { 
                status: "present", 
                method: "fingerprint",
                markedAt: new Date(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ message: "Marked present", record });

    } catch (error) {
        console.error("Mark Fingerprint Error:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Close Session & Auto-Mark Absent
 * POST /api/attendance/close
 */
/**
 * Close Session Logic (Internal Helper)
 */
const closeSessionLogic = async (session) => {
    // 1. Lock Session
    session.isActive = false;
    session.isLocked = true;
    await session.save();

    // 2. Fetch Class Group & Students
    // We need the classGroupId from the timetable -> subjectAssignment
    // This is expensive, but necessary.
    const timetable = await require("../models/timetable")
        .findById(session.timetableId)
        .populate("subjectAssignmentId");
        
    if (!timetable || !timetable.subjectAssignmentId) {
         console.error(`Timetable or SubjectAssignment not found for session ${session._id}`);
         return 0;
    }

    const classGroupId = timetable.subjectAssignmentId.classGroupId;

    // Optimize: Select only needed fields
    const classGroup = await ClassGroup.findById(classGroupId).populate("students", "_id");
    if (!classGroup) {
         console.error(`ClassGroup not found for session ${session._id}`);
         return 0;
    }

    const allStudentIds = classGroup.students.map(s => s._id.toString());

    // 3. Find Existing Present Records
    const existingRecords = await AttendanceRecord.find({
        attendanceSessionId: session._id
    }).select("studentId");
    
    const presentStudentIds = new Set(existingRecords.map(r => r.studentId.toString()));

    // 4. Identify Absentees
    const absentStudentIds = allStudentIds.filter(id => !presentStudentIds.has(id));

    // 5. Bulk Insert Absent Records
    const absentOps = absentStudentIds.map(id => ({
        attendanceSessionId: session._id,
        studentId: id,
        status: "absent",
        markedBy: null, // System
        remark: "Auto-System",
        markedAt: new Date()
    }));

    if (absentOps.length > 0) {
        await AttendanceRecord.insertMany(absentOps);
    }

    return absentOps.length;
};

/**
 * Close Session & Auto-Mark Absent
 * POST /api/attendance/close
 */
exports.closeSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await AttendanceSession.findById(sessionId);
        if (!session) return res.status(404).json({ message: "Session not found" });

        if (session.isLocked) {
             return res.status(400).json({ message: "Session already closed" });
        }

        const absentCount = await closeSessionLogic(session);

        res.status(200).json({ message: "Session closed, absentees marked.", absentCount });

    } catch (error) {
        console.error("Close Session Error:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Background Job: Close Expired Sessions
 */
exports.closeExpiredSessions = async () => {
    try {
        const now = new Date();
        // Find active sessions that have passed their expiry time
        const expiredSessions = await AttendanceSession.find({
            isActive: true,
            expiresAt: { $lt: now }
        });

        if (expiredSessions.length > 0) {
            console.log(`Found ${expiredSessions.length} expired sessions. Closing...`);
            
            // Limit concurrency to avoid overwhelming DB
             for (const session of expiredSessions) {
                try {
                    await closeSessionLogic(session);
                } catch (err) {
                    console.error(`Failed to auto-close session ${session._id}:`, err);
                }
            }
            console.log("Expired sessions closed.");
        }
    } catch (error) {
        console.error("Error in auto-close job:", error);
    }
};
