const AttendanceSession = require("../models/attendanceSession");
const AttendanceRecord = require("../models/attendanceRecord");
const Timetable = require("../models/timetable");
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

        if (session.isLocked) {
            return res.status(400).json({ message: "Session is locked. Cannot update attendance." });
        }

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

        if (session.method !== 'fingerprint') {
            return res.status(400).json({ message: "Fingerprint attendance is not enabled for this session." });
        }

        if (new Date() > session.expiresAt) {
            return res.status(400).json({ message: "Fingerprint attendance period has expired." });
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
        }).populate({
            path: "timetableId",
            populate: { path: "subjectAssignmentId" }
        });

        for (const session of expiredSessions) {
            console.log(`Auto-closing and marking absentees for session ${session._id}`);
            const classGroupId = session.timetableId.subjectAssignmentId.classGroupId;
            await closeSessionLogic(session, classGroupId);
            
            // Mark as inactive so it's hidden from students, but don't lock it 
            // yet if you want teachers to still have manual access.
            // Actually, the user says "no need to call close", implying it should finish everything.
            // Let's lock it for good measure to finalize the record.
            session.isActive = false;
            session.isLocked = true; 
            await session.save();
        }
    } catch (error) {
        console.error("Error in auto-close job:", error);
    }
};
/**
 * Start Attendance Session (Teacher)
 * POST /api/attendance/start
 */
exports.startAttendanceSession = async (req, res) => {
    try {
        const { timetableId, date, method } = req.body;
        const takenBy = req.user._id;

        if (!timetableId || !date || !method) {
            return res.status(400).json({ message: "timetableId, date, and method are required" });
        }

        const sessionDate = new Date(date);
        const timetable = await Timetable.findById(timetableId).populate("timeSlotId");
        if (!timetable) return res.status(404).json({ message: "Timetable slot not found" });

        // Enforce Timing: 10 mins before start to 10 mins after end
        const now = new Date();
        const [startHours, startMins] = timetable.timeSlotId.startTime.split(":").map(Number);
        const [endHours, endMins] = timetable.timeSlotId.endTime.split(":").map(Number);

        const classStartTime = new Date(sessionDate);
        classStartTime.setHours(startHours, startMins, 0, 0);

        const classEndTime = new Date(sessionDate);
        classEndTime.setHours(endHours, endMins, 0, 0);

        const allowedStart = new Date(classStartTime.getTime() - 10 * 60 * 1000);
        const allowedEnd = new Date(classEndTime.getTime() + 10 * 60 * 1000);

        if (now < allowedStart || now > allowedEnd) {
            return res.status(400).json({ 
                message: "Attendance can only be started between 10 minutes before and 10 minutes after the scheduled class time." 
            });
        }

        // Auto-end in 15 mins
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const session = await AttendanceSession.create({
            timetableId,
            date: sessionDate,
            takenBy,
            method,
            expiresAt,
            isActive: true,
            isLocked: false
        });

        res.status(201).json(session);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Attendance session already exists for this slot and date." });
        }
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Session Status
 * GET /api/attendance/session/:sessionId
 */
exports.getSessionStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await AttendanceSession.findById(sessionId)
            .populate("timetableId");
        
        if (!session) return res.status(404).json({ message: "Session not found" });

        res.status(200).json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
