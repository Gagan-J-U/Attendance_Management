const mongoose = require("mongoose");
const Timetable = require("../models/timetable");
const TimetableOverride = require("../models/timetableOverride");
const SubjectAssignment = require("../models/subjectAssignment");
const TimeSlot = require("../models/timeSlot");
const User = require("../models/users");
const Classroom = require("../models/classroom");
const ClassGroup = require("../models/classGroup");
const ExamSchedule = require("../models/examSchedule");
const TeachingAssignment = require("../models/teachingAssignment");

/**
 * Helper to get day name
 */
const getDayName = (date) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
};

/**
 * Get Weekly Timetable
 * GET /timetable/weekly/:classGroupId?weekOffset=0
 */
exports.getWeeklyTimetable = async (req, res) => {
  try {
    const { classGroupId } = req.params;
    let { weekOffset } = req.query;

    weekOffset = parseInt(weekOffset) || 0;

    // 1. Calculate Start (Monday) and End (Sunday) based on weekOffset
    const today = new Date();
    const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)
    // Adjust to Monday of the *current* week
    // ISO week starts on Monday (1). 
    // If today is Sunday (0), the Monday of this week was 6 days ago.
    const distToMon = currentDay === 0 ? -6 : 1 - currentDay;
    
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + distToMon);
    currentMonday.setHours(0, 0, 0, 0);

    // Apply offset
    const start = new Date(currentMonday);
    start.setDate(start.getDate() + (weekOffset * 7));
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    // 2. Fetch Assignments & Teachers
    const assignments = await SubjectAssignment.find({
      classGroupId,
      isActive: true
    }).select("_id subjectId");
    
    const assignmentIds = assignments.map((a) => a._id);

    const activeTeachingAssignments = await TeachingAssignment.find({
        subjectAssignmentId: { $in: assignmentIds },
        isActive: true
    }).populate("teacherId", "name email");

    const assignmentTeacherMap = {};
    activeTeachingAssignments.forEach(ta => {
        assignmentTeacherMap[ta.subjectAssignmentId.toString()] = ta.teacherId;
    });

    // 3. Fetch Regular Timetables
    const regularTimetables = await Timetable.find({
      subjectAssignmentId: { $in: assignmentIds },
      isExtraClass: false,
      isActive: true
    })
      .populate("timeSlotId")
      .populate({
        path: "subjectAssignmentId",
        populate: { path: "subjectId", select: "subjectName subjectCode" }
      })
      .populate("classroomNumber");

    // 4. Fetch Extra Classes
    const extraClasses = await Timetable.find({
      subjectAssignmentId: { $in: assignmentIds },
      isExtraClass: true,
      extraClassDate: { $gte: start, $lte: end },
      isActive: true
    })
      .populate("timeSlotId")
      .populate({
        path: "subjectAssignmentId",
        populate: { path: "subjectId", select: "subjectName subjectCode" }
      })
      .populate("classroomNumber");

    // 5. Fetch Overrides
    const overrides = await TimetableOverride.find({
      date: { $gte: start, $lte: end },
      timetableId: { $in: regularTimetables.map(t => t._id) }
    }).populate("modifiedTeacherId", "name email");

    const overrideMap = {};
    overrides.forEach(o => {
       const key = `${o.timetableId.toString()}_${new Date(o.date).toDateString()}`;
       overrideMap[key] = o;
    });

    // 6. Fetch Exams (Global Override)
    const exams = await ExamSchedule.find({
        date: { $gte: start, $lte: end },
        isActive: true,
        "allocations.classGroupId": classGroupId
    }).populate("invigilators.teacherId")
      .populate("allocations.classroomNumber");

    // 7. Assemble Result
    const schedule = {};
    const loopDate = new Date(start);

    while (loopDate <= end) {
      const dateStr = loopDate.toISOString().split('T')[0];
      const dayName = getDayName(loopDate);
      const dateKey = loopDate.toDateString(); 

      schedule[dateStr] = [];

      // A. EXAMS
      const daysExams = exams.filter(e => new Date(e.date).toDateString() === dateKey);
      
      daysExams.forEach(exam => {
          const alloc = exam.allocations.find(a => a.classGroupId.toString() === classGroupId);
          if (alloc) {
              schedule[dateStr].push({
                  type: "EXAM",
                  title: exam.title,
                  classroom: alloc.classroomNumber, 
                  startTime: exam.startTime,
                  endTime: exam.endTime,
                  studentCount: alloc.studentCount
              });
          }
      });

      // B. Regular Classes
      regularTimetables.forEach(tt => {
        if (tt.dayOfWeek === dayName) {
            
          // Check Exam Conflict
          const isExamConflict = daysExams.some(exam => {
             // Basic time string comparison (e.g. "09:00" vs "10:00")
             // Assumes 24h format in both.
             return (tt.timeSlotId.startTime >= exam.startTime && tt.timeSlotId.startTime < exam.endTime) || (tt.timeSlotId.endTime > exam.startTime && tt.timeSlotId.endTime <= exam.endTime);
          });

          if (isExamConflict) return; 

          const overrideKey = `${tt._id.toString()}_${dateKey}`;
          const override = overrideMap[overrideKey];

          if (override && override.isCancelled) return; 

          let teacher = assignmentTeacherMap[tt.subjectAssignmentId._id.toString()] || null;
          let isSubstitution = false;

          if (override && override.modifiedTeacherId) {
            teacher = override.modifiedTeacherId;
            isSubstitution = true;
          }

          schedule[dateStr].push({
            type: isSubstitution ? "SUBSTITUTION" : "REGULAR",
            timetableId: tt._id,
            slot: tt.timeSlotId,
            subject: tt.subjectAssignmentId.subjectId,
            teacher: teacher,
            classroom: tt.classroomNumber,
            isCancelled: false
          });
        }
      });

      // C. Extra Classes
      extraClasses.forEach(ec => {
        if (new Date(ec.extraClassDate).toDateString() === dateKey) {
             const isExamConflict = daysExams.some(exam => {
                 return (ec.timeSlotId.startTime >= exam.startTime && ec.timeSlotId.startTime < exam.endTime);
             });
             if (isExamConflict) return;

             let teacher = assignmentTeacherMap[ec.subjectAssignmentId._id.toString()] || null;
             
             schedule[dateStr].push({
                type: "EXTRA",
                timetableId: ec._id,
                slot: ec.timeSlotId,
                subject: ec.subjectAssignmentId.subjectId,
                teacher: teacher,
                classroom: ec.classroomNumber
             });
        }
      });

      // Sort
      schedule[dateStr].sort((a, b) => {
          const t1 = a.slot ? a.slot.startTime : a.startTime;
          const t2 = b.slot ? b.slot.startTime : b.startTime;
          return t1.localeCompare(t2);
      });

      loopDate.setDate(loopDate.getDate() + 1);
    }

    res.status(200).json({ range: { start, end }, schedule });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Create Override (Substitute or Cancel)
 */
exports.createOverride = async (req, res) => {
    try {
        const { timetableId, date, isCancelled, modifiedTeacherId, reason } = req.body;
        
        // Upsert strategy: If an override exists for this date/slot, update it.
        const query = { timetableId, date: new Date(date) };
        const update = { isCancelled, modifiedTeacherId, reason };
        const options = { upsert: true, new: true, setDefaultsOnInsert: true };

        const override = await TimetableOverride.findOneAndUpdate(query, update, options);
        res.status(200).json(override);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Create Extra Class
 */
exports.createExtraClass = async (req, res) => {
    try {
        const { subjectAssignmentId, date, timeSlotId, classroomId } = req.body;
        const slot = await TimeSlot.findById(timeSlotId);
        const assignment = await SubjectAssignment.findById(subjectAssignmentId);
        if (!slot || !assignment) return res.status(404).json({ message: "Invalid data" });

        // Check Classroom Availability logic (omitted for brevity, same as plan)
        // ... (Implement Conflict Check if needed)

        const extraClass = new Timetable({
            subjectAssignmentId,
            isExtraClass: true,
            extraClassDate: new Date(date),
            timeSlotId,
            classroomNumber: classroomId,
            valdiFrom: new Date(),
            academicYear: assignment.academicYear
        });

        await extraClass.save();
        res.status(201).json(extraClass);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Get Teacher Status
 * GET /timetable/teacher-status/:teacherId?date=YYYY-MM-DD
 */
exports.getTeacherStatus = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { date } = req.query; 

        if(!date) return res.status(400).json({message: "Date required"});

        const checkDate = new Date(date);
        
        // 1. Check TeacherAttendance
        const TeacherAttendance = require("../models/teacherAttendance");
        const attendance = await TeacherAttendance.findOne({
            teacherId,
            date: checkDate
        });

        if (attendance) {
            if (["absent", "on-leave"].includes(attendance.status)) {
                return res.status(200).json({ status: attendance.status.toUpperCase(), detail: attendance.remark });
            }
             if (attendance.status === "busy") {
                return res.status(200).json({ status: "BUSY", detail: attendance.remark });
            }
        }

        // 2. Check Exam Invigilation
        const exams = await ExamSchedule.find({
            date: checkDate,
            isActive: true,
            "invigilators.teacherId": teacherId
        });

        if (exams.length > 0) {
             return res.status(200).json({ status: "BUSY", detail: "Invigilation Duty" });
        }

        return res.status(200).json({ status: "FREE" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
