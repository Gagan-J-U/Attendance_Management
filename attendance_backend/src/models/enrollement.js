const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    subjectAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectAssignment",
      required: true
    },

    enrolledAt: {
      type: Date,
      default: Date.now
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/**
 * Prevent duplicate enrollment
 */
enrollmentSchema.index(
  {
    studentId: 1,
    classGroupId: 1
  },
  { unique: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);
