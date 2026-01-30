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
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    expiresAt: {
      type: Date,
      default: () => Date.now() + 15 * 60 * 1000 // 15 minutes from creation
    },
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

// Index for background job to find expired active sessions quickly
attendanceSessionSchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model(
  "AttendanceSession",
  attendanceSessionSchema
);
