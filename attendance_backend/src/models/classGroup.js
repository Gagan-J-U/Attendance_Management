const mongoose = require("mongoose");

const classGroupSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true
    },

    semester: {
      type: Number,
      required: true
    },

    section: {
      type: String,
      required: true
    },

    academicYear: {
      type: String,
      required: true
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    classTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
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
classGroupSchema.index({ students: 1 });

module.exports = mongoose.model("ClassGroup", classGroupSchema);
