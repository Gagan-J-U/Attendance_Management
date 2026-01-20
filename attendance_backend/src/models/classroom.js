const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    building: {
      type: String,
      trim: true
    },

    capacity: {
      type: Number,
      required: true,
      min: 1
    },

    type: {
      type: String,
      enum: ["theory", "lab", "seminar"],
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Classroom", classroomSchema);
