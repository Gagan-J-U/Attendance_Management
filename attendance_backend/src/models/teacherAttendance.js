const mongoose = require("mongoose");

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    // NULL = whole day
    timeSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeSlot",
      default: null
    },

    status: {
      type: String,
      enum: ["present", "absent", "on-leave", "busy"],
      required: true
    },

    method: {
      type: String,
      enum: ["fingerprint", "manual", "system"],
      required: true
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // admin / system / self
    },

    remark: {
      type: String
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/**
 * Prevent duplicate attendance entries
 * - One full-day entry OR
 * - One slot-specific entry per day
 */
teacherAttendanceSchema.index(
  {
    teacherId: 1,
    date: 1,
    timeSlotId: 1
  },
  { unique: true }
);

module.exports = mongoose.model(
  "TeacherAttendance",
  teacherAttendanceSchema
);
