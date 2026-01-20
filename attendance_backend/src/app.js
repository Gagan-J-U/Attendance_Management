const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const subjectRoutes = require("./routes/subject.routes");
const studentRoutes = require("./routes/student.routes");
const teacherRoutes = require("./routes/teacher.routes");
const timeSlotRoutes = require("./routes/timeSlot.routes");
const classroomRoutes = require("./routes/classroom.routes");
const classGroupRoutes = require("./routes/classGroup.routes");
const subjectAssignmentRoutes = require("./routes/subjectAssignment.routes");

const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/students",studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/timeslots", timeSlotRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/classgroups", classGroupRoutes);
app.use("/api/subject-assignments", subjectAssignmentRoutes);

app.get("/", (req, res) => {
  res.send("Attendance Backend Running");
});

module.exports = app;

