const mongoose = require("mongoose");
const AttendanceRecord = require("../models/attendanceRecord");
const AttendanceSession = require("../models/attendanceSession");
const Timetable = require("../models/timetable");
const User = require("../models/users");

/**
 * STUDENT → detailed attendance timeline for ONE subject
 */
exports.getStudentAttendanceDetails = async (
  studentId,
  subjectAssignmentId
) => {
  // 1. Find all sessions held for this subject
  const sessions = await AttendanceSession.aggregate([
    {
      $lookup: {
        from: "timetables",
        localField: "timetableId",
        foreignField: "_id",
        as: "timetable"
      }
    },
    { $unwind: "$timetable" },
    {
      $match: {
        "timetable.subjectAssignmentId": new mongoose.Types.ObjectId(subjectAssignmentId)
      }
    },
    {
      $lookup: {
        from: "attendancerecords",
        let: { sessionId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$attendanceSessionId", "$$sessionId"] },
                  { $eq: ["$studentId", new mongoose.Types.ObjectId(studentId)] }
                ]
              }
            }
          }
        ],
        as: "record"
      }
    },
    { $addFields: { record: { $arrayElemAt: ["$record", 0] } } },
    {
      $lookup: {
        from: "timeslots",
        localField: "timetable.timeSlotId",
        foreignField: "_id",
        as: "timeSlot"
      }
    },
    { $unwind: "$timeSlot" },
    { $sort: { date: -1, "timeSlot.startTime": -1 } }
  ]);

  const totalClasses = sessions.length;
  // If record exists, use status. If not, and session is locked, it's 'absent'.
  // (Assuming system auto-marks, but this is a fallback)
  const present = sessions.filter(s => s.record && s.record.status === "present").length;
  const absent = sessions.filter(s => s.record && s.record.status === "absent").length;

  return {
    summary: {
      totalClasses,
      present,
      absent,
      percentage: totalClasses === 0 ? 0 : Number(((present / totalClasses) * 100).toFixed(2))
    },
    records: sessions.map(s => ({
      attendanceSessionId: s._id,
      date: s.date,
      dayOfWeek: s.timetable.dayOfWeek,
      timeSlot: s.timeSlot,
      status: s.record ? s.record.status : (s.isLocked ? "absent" : "pending")
    }))
  };
};

/**
 * TEACHER → summary per student for ONE subject
 */
exports.getTeacherAttendanceSummary = async (subjectAssignmentId) => {
  // 1. Get the list of all sessions for this assignment to know the "total classes" constant
  const sessions = await AttendanceSession.aggregate([
    {
       $lookup: {
         from: "timetables",
         localField: "timetableId",
         foreignField: "_id",
         as: "timetable"
       }
    },
    { $unwind: "$timetable" },
    {
      $match: {
        "timetable.subjectAssignmentId": new mongoose.Types.ObjectId(subjectAssignmentId)
      }
    }
  ]);

  const totalSessionsHeld = sessions.length;

  // 2. Aggregate records for these sessions
  const summary = await AttendanceRecord.aggregate([
    {
      $lookup: {
        from: "attendancesessions",
        localField: "attendanceSessionId",
        foreignField: "_id",
        as: "session"
      }
    },
    { $unwind: "$session" },
    {
      $lookup: {
        from: "timetables",
        localField: "session.timetableId",
        foreignField: "_id",
        as: "timetable"
      }
    },
    { $unwind: "$timetable" },
    {
      $match: {
        "timetable.subjectAssignmentId": new mongoose.Types.ObjectId(subjectAssignmentId)
      }
    },
    {
      $group: {
        _id: "$studentId",
        presentCount: {
          $sum: {
            $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0]
          }
        },
        absentCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "absent"] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        studentId: "$_id",
        present: "$presentCount",
        absent: "$absentCount",
        totalClasses: { $literal: totalSessionsHeld },
        percentage: {
          $cond: [
            { $eq: [totalSessionsHeld, 0] },
            0,
            {
              $multiply: [
                { $divide: ["$presentCount", totalSessionsHeld] },
                100
              ]
            }
          ]
        }
      }
    }
  ]);

  // attach student names
  const studentIds = summary.map(s => s.studentId);
  const students = await User.find({
    _id: { $in: studentIds }
  }).select("name");

  const nameMap = {};
  students.forEach(s => {
    nameMap[s._id.toString()] = s.name;
  });

  return summary.map(s => ({
    studentId: s.studentId,
    name: nameMap[s.studentId.toString()],
    totalClasses: s.totalClasses,
    present: s.present,
    absent: s.absent,
    percentage: Number(s.percentage.toFixed(2))
  }));
};
