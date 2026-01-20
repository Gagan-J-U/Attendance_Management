const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema(
  {
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timetable",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    takenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // teacher / substitute
      required: true
    },

    method: {
      type: String,
      enum: ["fingerprint", "manual", "qr"],
      required: true
    },

    isLocked: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/**
 * One attendance per timetable slot per day
 */
attendanceSessionSchema.index(
  {
    timetableId: 1,
    date: 1
  },
  { unique: true }
);

module.exports = mongoose.model(
  "AttendanceSession",
  attendanceSessionSchema
);
