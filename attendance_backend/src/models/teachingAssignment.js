const mongoose = require("mongoose");

const teachingAssignmentSchema = new mongoose.Schema(
  {
    subjectAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectAssignment",
      required: true
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date // null = currently active
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/**
 * Prevent overlapping assignments for same teacher & class
 */
teachingAssignmentSchema.index(
  {
    classGroupId: 1,
    teacherId: 1,
    startDate: 1
  },
  { unique: true }
);

module.exports = mongoose.model(
  "TeachingAssignment",
  teachingAssignmentSchema
);
