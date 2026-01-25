const mongoose = require("mongoose");

const classExchangeRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    targetTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Slot 1 (Requester's original slot)
    slot1: {
      timetableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Timetable",
        required: true
      },
      date: {
        type: Date,
        required: true
      }
    },

    // Slot 2 (Target Teacher's original slot)
    slot2: {
        timetableId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Timetable",
            required: true
        },
        date: {
            type: Date,
            required: true
        }
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING"
    },

    expiry: {
        type: Date,
        required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ClassExchangeRequest",
  classExchangeRequestSchema
);
