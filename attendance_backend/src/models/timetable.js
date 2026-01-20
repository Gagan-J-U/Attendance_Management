const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
  {
    subjectAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectAssignment",
      required: true
    },

    // For regular weekly timetable
    dayOfWeek: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      required: function () {
        return !this.isExtraClass;
      }
    },

    timeSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeSlot",
      required: true
    },

    classroomNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true
    },

    academicYear: {
      type: String,
      required: true
    },

    // 🔥 EXTRA CLASS SUPPORT
    isExtraClass: {
      type: Boolean,
      default: false
    },

    extraClassDate: {
      type: Date,
      required: function () {
        return this.isExtraClass;
      }
    },

    isActive: {
      type: Boolean,
      default: true
    },

    validFrom: {
  type: Date,
  required: true
    },

validTo: {
  type: Date // null = currently valid
}

  },
  { timestamps: true }
);

timetableSchema.index(
  {
    subjectAssignmentId: 1,
    dayOfWeek: 1,
    timeSlotId: 1,
    academicYear: 1,
    isExtraClass: 1,
    extraClassDate: 1
  },
  { unique: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);