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

    offeringType: {
      type: String,
      enum: ["regular", "elective", "open-elective"],
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