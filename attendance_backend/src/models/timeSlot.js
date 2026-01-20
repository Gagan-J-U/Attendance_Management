const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
  {
    slotName: {
      type: String, // e.g. "Period 1", "Lab Slot"
      required: true
    },

    startTime: {
      type: String, // "09:00"
      required: true
    },

    endTime: {
      type: String, // "09:50"
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/**
 * Prevent duplicate slots with same time range
 */
timeSlotSchema.index(
  { startTime: 1, endTime: 1 },
  { unique: true }
);

module.exports = mongoose.model("TimeSlot", timeSlotSchema);
