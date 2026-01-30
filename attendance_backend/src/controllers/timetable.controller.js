const mongoose = require("mongoose");
const Timetable = require("../models/timetable");
const TimetableOverride = require("../models/timetableOverride");
const SubjectAssignment = require("../models/subjectAssignment");
const TimeSlot = require("../models/timeSlot");
const User = require("../models/users");
const Classroom = require("../models/classroom");
const ClassGroup = require("../models/classGroup");
const ExamSchedule = require("../models/examSchedule");

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
    
    const start = new Date(today);
    start.setDate(today.getDate() + distToMon + (weekOffset * 7));
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    // 2. Fetch Assignments (including the assigned teacher)
    const assignments = await SubjectAssignment.find({
      classGroupId,
      isActive: true
    }).populate("teacherId", "name email");
    
    const assignmentIds = assignments.map((a) => a._id);
    const teacherIds = [...new Set(assignments.map(a => a.teacherId?._id))].filter(Boolean);

    const assignmentTeacherMap = {};
    assignments.forEach(sa => {
        assignmentTeacherMap[sa._id.toString()] = sa.teacherId;
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
      $or: [
        { "allocations.classGroupId": classGroupId },
        { "invigilators.teacherId": { $in: teacherIds } }
      ]
    }).populate("allocations.classroomNumber")
      .populate("invigilators.teacherId")
      .populate("invigilators.classroomNumber");

    // 7. Fetch Teacher Absences for the week
    const TeacherAttendance = require("../models/teacherAttendance");
    const absences = await TeacherAttendance.find({
        teacherId: { $in: teacherIds },
        date: { $gte: start, $lte: end },
        status: { $in: ["absent", "on-leave", "busy"] }
    });

    const absenceMap = {};
    absences.forEach(a => {
        const key = `${a.teacherId.toString()}_${new Date(a.date).toDateString()}`;
        absenceMap[key] = a;
    });

    // 7. Assemble Result
    const schedule = {};
    const loopDate = new Date(start);

    // Helper to get YYYY-MM-DD in local time
    const toLocalISO = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    while (loopDate <= end) {
      const dateStr = toLocalISO(loopDate);
      const dayName = getDayName(loopDate);
      const dateKey = loopDate.toDateString(); 

      schedule[dateStr] = [];

      // A. EXAMS for Class
      const classExams = exams.filter(e => 
        new Date(e.date).toDateString() === dateKey && 
        e.allocations.some(a => a.classGroupId.toString() === classGroupId)
      );
      
      classExams.forEach(exam => {
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
      for (const tt of regularTimetables) {
        if (tt.dayOfWeek === dayName) {
            
          // Check Exam Conflict (Class-wide)
          const isExamConflict = classExams.some(exam => {
             return (tt.timeSlotId.startTime >= exam.startTime && tt.timeSlotId.startTime < exam.endTime) || (tt.timeSlotId.endTime > exam.startTime && tt.timeSlotId.endTime <= exam.endTime);
          });

          if (isExamConflict) continue; 

          const overrideKey = `${tt._id.toString()}_${dateKey}`;
          const override = overrideMap[overrideKey];

          if (override && override.isCancelled) continue; 

          let teacher = assignmentTeacherMap[tt.subjectAssignmentId._id.toString()] || null;
          let isSubstitution = false;

          if (override && override.modifiedTeacherId) {
            teacher = override.modifiedTeacherId;
            isSubstitution = true;
          }

          // 🔥 Check Teacher Availability (Busy/Absent)
          const teacherAbsenceKey = `${teacher?._id?.toString() || teacher?.toString()}_${dateKey}`;
          const isTeacherAbsent = absenceMap[teacherAbsenceKey];

          const teacherExams = exams.filter(e => 
            new Date(e.date).toDateString() === dateKey && 
            e.invigilators.some(i => i.teacherId?._id?.toString() === teacher?._id?.toString())
          );

          if (isTeacherAbsent || teacherExams.length > 0) continue; 

          schedule[dateStr].push({
            type: isSubstitution ? "SUBSTITUTION" : "REGULAR",
            timetableId: tt._id,
            slot: tt.timeSlotId,
            subjectAssignmentId: tt.subjectAssignmentId,
            subject: tt.subjectAssignmentId?.subjectId,
            teacher: teacher,
            classroom: tt.classroomNumber,
            isCancelled: false
          });
        }
      }

      // C. Extra Classes
      for (const ec of extraClasses) {
        if (new Date(ec.extraClassDate).toDateString() === dateKey) {
             const isExamConflict = classExams.some(exam => {
                 return (ec.timeSlotId.startTime >= exam.startTime && ec.timeSlotId.startTime < exam.endTime);
             });
             if (isExamConflict) continue;

             let teacher = assignmentTeacherMap[ec.subjectAssignmentId._id.toString()] || null;
             
             schedule[dateStr].push({
                type: "EXTRA",
                timetableId: ec._id,
                slot: ec.timeSlotId,
                subjectAssignmentId: ec.subjectAssignmentId,
                subject: ec.subjectAssignmentId?.subjectId,
                teacher: teacher,
                classroom: ec.classroomNumber
             });
        }
      }

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

        // Conflict Check
        const conflict = await Timetable.findOne({
            extraClassDate: new Date(date),
            timeSlotId,
            classroomNumber: classroomId,
            isActive: true
        });

        if (conflict) {
            return res.status(400).json({ message: "Classroom is already occupied at this time." });
        }

        const extraClass = new Timetable({
            subjectAssignmentId,
            isExtraClass: true,
            extraClassDate: new Date(date),
            timeSlotId,
            classroomNumber: classroomId,
            validFrom: new Date(),
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
/**
 * Get Teacher Weekly Timetable
 * GET /timetable/teacher-weekly/:teacherId?weekOffset=0
 */
exports.getTeacherWeeklyTimetable = async (req, res) => {
  try {
    const { teacherId } = req.params;
    let { weekOffset } = req.query;
    weekOffset = parseInt(weekOffset) || 0;

    const today = new Date();
    const currentDay = today.getDay();
    const distToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + distToMon);
    currentMonday.setHours(0, 0, 0, 0);

    const start = new Date(currentMonday);
    start.setDate(start.getDate() + (weekOffset * 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    // 1. Regular Classes for this teacher
    const assignments = await SubjectAssignment.find({ teacherId, isActive: true });
    const assignmentIds = assignments.map(a => a._id);

    const regularTimetables = await Timetable.find({
      subjectAssignmentId: { $in: assignmentIds },
      isExtraClass: false,
      isActive: true
    }).populate("timeSlotId").populate({
        path: "subjectAssignmentId",
        populate: [
            { path: "subjectId", select: "subjectName subjectCode" },
            { path: "classGroupId", select: "department semester section" }
        ]
    }).populate("classroomNumber");

    // 2. Extra Classes
    const extraClasses = await Timetable.find({
        subjectAssignmentId: { $in: assignmentIds },
        isExtraClass: true,
        extraClassDate: { $gte: start, $lte: end },
        isActive: true
    }).populate("timeSlotId").populate({
        path: "subjectAssignmentId",
        populate: [
            { path: "subjectId", select: "subjectName subjectCode" },
            { path: "classGroupId", select: "department semester section" }
        ]
    }).populate("classroomNumber");

    // 3. Substitutions (Overrides where this teacher is the modifiedTeacherId)
    const substitutions = await TimetableOverride.find({
        date: { $gte: start, $lte: end },
        modifiedTeacherId: teacherId
    }).populate({
        path: "timetableId",
        populate: [
            { path: "timeSlotId" },
            { path: "classroomNumber" },
            { 
                path: "subjectAssignmentId",
                populate: [
                    { path: "subjectId", select: "subjectName subjectCode" },
                    { path: "classGroupId", select: "department semester section" }
                ]
            }
        ]
    });

    // 4. Overrides for teacher's own regular classes (Cancellations)
    const ownOverrides = await TimetableOverride.find({
        date: { $gte: start, $lte: end },
        timetableId: { $in: regularTimetables.map(t => t._id) }
    });

    const overrideMap = {};
    ownOverrides.forEach(o => {
        const key = `${o.timetableId.toString()}_${new Date(o.date).toDateString()}`;
        overrideMap[key] = o;
    });

    // 5. Exam Duties
    const exams = await ExamSchedule.find({
        date: { $gte: start, $lte: end },
        isActive: true,
        "invigilators.teacherId": teacherId
    }).populate("invigilators.classroomNumber");

    // 6. Assemble Result
    const schedule = {};
    const loopDate = new Date(start);

    const toLocalISO = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    while (loopDate <= end) {
        const dateStr = toLocalISO(loopDate);
        const dayName = getDayName(loopDate);
        const dateKey = loopDate.toDateString();
        schedule[dateStr] = [];

        // A. EXAMS
        const daysExams = exams.filter(e => new Date(e.date).toDateString() === dateKey);
        daysExams.forEach(exam => {
            const duty = exam.invigilators.find(i => i?.teacherId && i.teacherId.toString() === teacherId);
            schedule[dateStr].push({
                type: "EXAM_DUTY",
                title: exam.title,
                classroom: duty ? duty.classroomNumber : null,
                startTime: exam.startTime,
                endTime: exam.endTime
            });
        });

        // B. Substitutions
        const daysSubs = substitutions.filter(s => new Date(s.date).toDateString() === dateKey);
        daysSubs.forEach(sub => {
            const tt = sub.timetableId;
            schedule[dateStr].push({
                type: "SUBSTITUTION",
                timetableId: tt._id,
                slot: tt.timeSlotId,
                subjectAssignmentId: tt.subjectAssignmentId,
                subject: tt.subjectAssignmentId?.subjectId,
                classGroup: tt.subjectAssignmentId?.classGroupId,
                classroom: tt.classroomNumber,
                reason: sub.reason
            });
        });

        // C. Regular Classes
        regularTimetables.forEach(tt => {
            if (tt.dayOfWeek === dayName) {
                const overrideKey = `${tt._id.toString()}_${dateKey}`;
                const override = overrideMap[overrideKey];

                if (override && (override.isCancelled || override.modifiedTeacherId)) {
                    // If cancelled or substituted by someone else, it's not on this teacher's schedule for this day
                    return;
                }

                schedule[dateStr].push({
                    type: "REGULAR",
                    timetableId: tt._id,
                    slot: tt.timeSlotId,
                    subjectAssignmentId: tt.subjectAssignmentId,
                    subject: tt.subjectAssignmentId?.subjectId,
                    classGroup: tt.subjectAssignmentId?.classGroupId,
                    classroom: tt.classroomNumber
                });
            }
        });

        // D. Extra Classes
        extraClasses.forEach(ec => {
            if (new Date(ec.extraClassDate).toDateString() === dateKey) {
                schedule[dateStr].push({
                    type: "EXTRA",
                    timetableId: ec._id,
                    slot: ec.timeSlotId,
                    subjectAssignmentId: ec.subjectAssignmentId,
                    subject: ec.subjectAssignmentId?.subjectId,
                    classGroup: ec.subjectAssignmentId?.classGroupId,
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
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create Regular Timetable Entry
 * POST /timetable
 */
exports.createTimetable = async (req, res) => {
    try {
        const { subjectAssignmentId, dayOfWeek, timeSlotId, classroomNumber, academicYear, validFrom } = req.body;
        
        // 1. Fetch assignment details to get teacher and class group
        const assignment = await SubjectAssignment.findById(subjectAssignmentId);
        if (!assignment) return res.status(404).json({ message: "Subject assignment not found" });

        const teacherId = assignment.teacherId;
        const classGroupId = assignment.classGroupId;

        // 2. Check for Conflicts
        // A. Classroom Conflict
        const roomConflict = await Timetable.findOne({
            dayOfWeek,
            timeSlotId,
            classroomNumber,
            isExtraClass: false,
            isActive: true
        });
        if (roomConflict) return res.status(400).json({ message: "Classroom is already occupied at this time." });

        // B. Class Group Conflict (A class can't have two subjects at once)
        const groupConflict = await Timetable.findOne({
            dayOfWeek,
            timeSlotId,
            isExtraClass: false,
            isActive: true
        }).populate({
            path: 'subjectAssignmentId',
            match: { classGroupId }
        });
        // Note: The above populate approach is okay, but simpler:
        const allRegular = await Timetable.find({ dayOfWeek, timeSlotId, isExtraClass: false, isActive: true })
            .populate('subjectAssignmentId');
        
        const hasGroupConflict = allRegular.some(t => t.subjectAssignmentId && t.subjectAssignmentId.classGroupId.toString() === classGroupId.toString());
        if (hasGroupConflict) return res.status(400).json({ message: "This class group already has another subject scheduled at this time." });

        // C. Teacher Conflict (A teacher can't be in two places at once)
        const hasTeacherConflict = allRegular.some(t => t.subjectAssignmentId && t.subjectAssignmentId.teacherId.toString() === teacherId.toString());
        if (hasTeacherConflict) return res.status(400).json({ message: "This teacher is already assigned to another class at this time." });

        const timetable = await Timetable.create({
            subjectAssignmentId,
            dayOfWeek,
            timeSlotId,
            classroomNumber,
            academicYear,
            validFrom: validFrom || new Date(),
            isExtraClass: false
        });

        res.status(201).json(timetable);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update Timetable Entry
 * PATCH /timetable/:id
 */
exports.updateTimetable = async (req, res) => {
    try {
        const { id } = req.params;
        const { dayOfWeek, timeSlotId, classroomNumber } = req.body;

        if (dayOfWeek || timeSlotId || classroomNumber) {
            // 1. Fetch assignment details
            const currentTt = await Timetable.findById(id).populate('subjectAssignmentId');
            if (!currentTt) return res.status(404).json({ message: "Timetable entry not found" });

            const sAsgnId = req.body.subjectAssignmentId || currentTt.subjectAssignmentId._id;
            const sAsgn = await SubjectAssignment.findById(sAsgnId);
            
            const teacherId = sAsgn.teacherId;
            const classGroupId = sAsgn.classGroupId;

            const targetDay = dayOfWeek || currentTt.dayOfWeek;
            const targetSlot = timeSlotId || currentTt.timeSlotId;
            const targetRoom = classroomNumber || currentTt.classroomNumber;

            // A. Room Conflict
            const roomConflict = await Timetable.findOne({
                _id: { $ne: id },
                dayOfWeek: targetDay,
                timeSlotId: targetSlot,
                classroomNumber: targetRoom,
                isExtraClass: false,
                isActive: true
            });
            if (roomConflict) return res.status(400).json({ message: "Classroom is already occupied at this time." });

            // B & C. Fetch all for day/slot
            const allRegular = await Timetable.find({ 
                _id: { $ne: id },
                dayOfWeek: targetDay, 
                timeSlotId: targetSlot, 
                isExtraClass: false, 
                isActive: true 
            }).populate('subjectAssignmentId');

            const hasGroupConflict = allRegular.some(t => t.subjectAssignmentId && t.subjectAssignmentId.classGroupId.toString() === classGroupId.toString());
            if (hasGroupConflict) return res.status(400).json({ message: "Class group conflict." });

            const hasTeacherConflict = allRegular.some(t => t.subjectAssignmentId && t.subjectAssignmentId.teacherId.toString() === teacherId.toString());
            if (hasTeacherConflict) return res.status(400).json({ message: "Teacher conflict." });
        }

        const updated = await Timetable.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "Timetable entry not find" });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Available Classrooms
 * GET /timetable/available-classrooms?dayOfWeek=...&timeSlotId=...&date=...
 */
exports.getAvailableClassrooms = async (req, res) => {
    try {
        const { dayOfWeek, timeSlotId, date, excludeTimetableId } = req.query;

        if (!timeSlotId) return res.status(400).json({ message: "timeSlotId is required" });

        const slot = await TimeSlot.findById(timeSlotId);
        if (!slot) return res.status(404).json({ message: "Time slot not found" });

        const occupiedClassroomIds = [];

        // 1. Check regular timetable (using dayOfWeek)
        if (dayOfWeek) {
            const query = {
                dayOfWeek,
                timeSlotId,
                isExtraClass: false,
                isActive: true
            };
            if (excludeTimetableId) {
                query._id = { $ne: excludeTimetableId };
            }
            const regularConflicts = await Timetable.find(query).select("classroomNumber");
            regularConflicts.forEach(c => occupiedClassroomIds.push(c.classroomNumber));
        }

        // 2. Check extra classes (if checking for a specific date)
        if (date) {
            const extraConflicts = await Timetable.find({
                extraClassDate: new Date(date),
                timeSlotId,
                isExtraClass: true,
                isActive: true
            }).select("classroomNumber");
            extraConflicts.forEach(c => occupiedClassroomIds.push(c.classroomNumber));
        }

        // 3. Check Exam Conflicts
        if (date) {
            // Exam startTime/endTime are strings like "09:00"
            const exams = await ExamSchedule.find({
                date: new Date(date),
                isActive: true,
                $or: [
                    { startTime: { $lte: slot.startTime }, endTime: { $gt: slot.startTime } },
                    { startTime: { $lt: slot.endTime }, endTime: { $gte: slot.endTime } }
                ]
            });
            
            exams.forEach(exam => {
                exam.allocations.forEach(alloc => {
                    occupiedClassroomIds.push(alloc.classroomNumber);
                });
            });
        }

        const allClassrooms = await Classroom.find({ isActive: true });
        const available = allClassrooms.filter(c => !occupiedClassroomIds.some(id => id.toString() === c._id.toString()));

        res.status(200).json(available);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Delete Timetable Entry
 * DELETE /timetable/:id
 */
exports.deleteTimetable = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Timetable.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Timetable entry not found" });
        res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Regular Timetable by Class Group
 * GET /timetable/class/:classGroupId
 */
exports.getTimetableByClass = async (req, res) => {
    try {
        const { classGroupId } = req.params;
        const assignments = await SubjectAssignment.find({ classGroupId, isActive: true });
        const assignmentIds = assignments.map(a => a._id);

        const timetables = await Timetable.find({
            subjectAssignmentId: { $in: assignmentIds },
            isExtraClass: false,
            isActive: true
        }).populate("timeSlotId")
          .populate({
              path: "subjectAssignmentId",
              populate: { path: "subjectId", select: "subjectName subjectCode" }
          })
          .populate("classroomNumber");

        res.status(200).json(timetables);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
