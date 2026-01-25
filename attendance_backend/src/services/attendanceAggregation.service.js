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
  const records = await AttendanceRecord.aggregate([
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(studentId)
      }
    },
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
      $match: {
        "session.subjectAssignmentId": new mongoose.Types.ObjectId(
          subjectAssignmentId
        )
      }
    },
    {
      $lookup: {
        from: "timetables",
        localField: "session.timetableId",
        foreignField: "_id",
        as: "timetable"
      }
    },
    { $unwind: "$timetable" }
  ]);

  const totalClasses = records.length;
  const present = records.filter(r => r.status === "present").length;
  const absent = records.filter(r => r.status === "absent").length;

  return {
    summary: {
      totalClasses,
      present,
      absent,
      percentage:
        totalClasses === 0
          ? 0
          : Number(((present / totalClasses) * 100).toFixed(2))
    },
    records: records.map(r => ({
      attendanceRecordId: r._id,
      date: r.session.date,
      dayOfWeek: r.timetable.dayOfWeek,
      timeSlot: r.timetable.timeSlotId, // frontend can map slot
      status: r.status
    }))
  };
};

/**
 * TEACHER → summary per student for ONE subject
 */
exports.getTeacherAttendanceSummary = async (subjectAssignmentId) => {
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
      $match: {
        "session.subjectAssignmentId": new mongoose.Types.ObjectId(
          subjectAssignmentId
        )
      }
    },
    {
      $group: {
        _id: "$studentId",
        totalClasses: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $eq: ["$status", "present"] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        studentId: "$_id",
        totalClasses: 1,
        present: 1,
        absent: {
          $subtract: ["$totalClasses", "$present"]
        },
        percentage: {
          $cond: [
            { $eq: ["$totalClasses", 0] },
            0,
            {
              $multiply: [
                { $divide: ["$present", "$totalClasses"] },
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
