const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    subjectAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectAssignment",
      required: true
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String
    },

    fileUrl: {
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

module.exports = mongoose.model("Note", noteSchema);
