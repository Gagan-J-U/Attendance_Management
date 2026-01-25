const mongoose = require("mongoose");

const timetableOverrideSchema = new mongoose.Schema(
  {
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timetable",
      required: true
    },

    // The specific date this override applies to
    date: {
      type: Date,
      required: true
    },

    isCancelled: {
      type: Boolean,
      default: false
    },

    // If substituted, who is taking the class?
    modifiedTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    originalTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
      // optional, useful for history
    },

    reason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Ensure only one override per timetable slot per date
timetableOverrideSchema.index(
  { timetableId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("TimetableOverride", timetableOverrideSchema);
