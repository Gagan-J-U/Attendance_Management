const mongoose = require("mongoose");

const classMessageSchema = new mongoose.Schema(
  {
    subjectAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectAssignment",
      required: true
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    message: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ClassMessage",
  classMessageSchema
);
