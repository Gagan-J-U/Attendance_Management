const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    attendanceSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: true
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // teacher / system
    },

    markedAt: {
      type: Date,
      default: Date.now
    },

    remark: {
      type: String
    }
  },
  { timestamps: true }
);

/**
 * One record per student per attendance session
 */
attendanceRecordSchema.index(
  {
    attendanceSessionId: 1,
    studentId: 1
  },
  { unique: true }
);

module.exports = mongoose.model(
  "AttendanceRecord",
  attendanceRecordSchema
);
