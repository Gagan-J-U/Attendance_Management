const mongoose = require("mongoose");

const classGroupSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      trim: true
    },

    semester: {
      type: Number,
      required: true,
      min: 1
    },

    section: {
      type: String,
      required: true,
      trim: true
    },

    academicYear: {
      type: String,
      required: true // e.g. "2025-26"
    },

    classTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    defaultClassroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom"
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// 🔒 Prevent duplicate class groups in same academic year
classGroupSchema.index(
  {
    department: 1,
    semester: 1,
    section: 1,
    academicYear: 1
  },
  { unique: true }
);

module.exports = mongoose.model("ClassGroup", classGroupSchema);
