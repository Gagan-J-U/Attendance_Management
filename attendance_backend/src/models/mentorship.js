const mongoose = require("mongoose");

const mentorshipSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true // must be a teacher
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    academicYear: {
      type: String,
      required: true // 2025-26
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/**
 * Prevent same mentor–student pair duplication
 */
mentorshipSchema.index(
  {
    mentorId: 1,
    studentId: 1,
    academicYear: 1
  },
  { unique: true }
);

module.exports = mongoose.model("Mentorship", mentorshipSchema);
