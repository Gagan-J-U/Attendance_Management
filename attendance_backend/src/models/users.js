const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


const studentInfoSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true }
}, { _id: false });

const teacherInfoSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  department: { type: String, required: true }
}, { _id: false });

const adminInfoSchema = new mongoose.Schema({
  adminLevel: { type: Number, default: 1 }
}, { _id: false });

const userSchema = new mongoose.Schema({
  // common fields
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true },
  phoneNumber: { type: String },

  role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    required: true
  },

  isActive: { type: Boolean, default: true },

  // role-specific subdocuments
  studentInfo: { type: studentInfoSchema },
  teacherInfo: { type: teacherInfoSchema },
  adminInfo: { type: adminInfoSchema }

}, { timestamps: true });

userSchema.pre("save", async function () {
  

  // 1️⃣ Role validation
  if (this.role === "student" && !this.studentInfo) {
    throw new Error("Student info is required for student role");
  }

  if (this.role === "teacher" && !this.teacherInfo) {
    throw new Error("Teacher info is required for teacher role");
  }

  if (this.role === "admin" && !this.adminInfo) {
    throw new Error("Admin info is required for admin role");
  }

  // 2️⃣ Password hashing
  if (this.isModified("password")) {
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("PASSWORD HASHED");
  }
});




userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};



const User = mongoose.model("User", userSchema);

module.exports = User;
