const mongoose = require("mongoose");

const subjectAssignmentSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true
    },

    classGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassGroup",
      required: true
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    subjectAssignmentType: {
      type: String,
      enum: ["THEORY", "LAB", "TUTORIAL"],
      required: true
    },

    offeringType: {
      type: String,
      enum: ["REGULAR", "REMEDIAL", "HONORS"],
      required: true
    },

    academicYear: {
      type: String,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);
module.exports = mongoose.model("SubjectAssignment", subjectAssignmentSchema);