const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema({
  classGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClassGroup",
    required: true
  },
  studentCount: {
    type: Number,
    required: true
  },
  classroomNumber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    required: true
  }
}, { _id: false });

const invigilatorSchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    classroomNumber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classroom",
        required: true
    }
}, { _id: false });

const examScheduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    // Using strings for flexibility like "10:00" - "12:00"
    startTime: {
        type: String,
        required: true
    },
    
    endTime: {
        type: String,
        required: true
    },

    allocations: [allocationSchema],
    
    invigilators: [invigilatorSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    
    isActive: {
        type: Boolean,
        default: true
    }
  },
  { timestamps: true }
);

// Indexes for quick lookup
examScheduleSchema.index({ date: 1 });
examScheduleSchema.index({ "allocations.classGroupId": 1 });
examScheduleSchema.index({ "invigilators.teacherId": 1 });

module.exports = mongoose.model("ExamSchedule", examScheduleSchema);
