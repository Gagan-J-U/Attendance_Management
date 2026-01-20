const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: true,
      unique: true // CS501
    },

    subjectName: {
      type: String,
      required: true // DBMS
    },

    department: {
      type: String,
      required: true // owning department (CSE)
    },

    semester: {
      type: Number,
      required: true // default semester
    },

    credits: {
      type: Number
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
