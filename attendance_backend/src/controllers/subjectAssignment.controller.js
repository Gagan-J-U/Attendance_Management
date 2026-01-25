const SubjectAssignment = require("../models/subjectAssignment");
const Subject = require("../models/subject");
const ClassGroup = require("../models/classGroup");
const User = require("../models/users");
const AttendanceAggregationService =
  require("../services/attendanceAggregation.service");


exports.getSubjectAssignments = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    let query = {};

    if (role === "teacher") {
      query.teacherId = userId;
    }

    if (role === "student") {
      const classGroups = await ClassGroup.find({
        students: userId
      }).select("_id");

      query.classGroupId = {
        $in: classGroups.map(cg => cg._id)
      };
    }

    // admin → no filter

    const assignments = await SubjectAssignment.find(query)
      .populate("subjectId", "subjectName subjectCode credits")
      .populate("classGroupId", "department semester section academicYear")
      .populate("teacherId", "name email");

    return res.status(200).json(assignments);

  } catch (err) {
    console.error("Get subject assignments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getSubjectAssignmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, _id: userId } = req.user;

    const assignment = await SubjectAssignment.findById(id)
      .populate("subjectId", "name code")
      .populate("classGroupId", "department semester section students")
      .populate("teacherId", "name email");

    if (!assignment) {
      return res.status(404).json({ message: "Subject assignment not found" });
    }

    // =========================
    // STUDENT VIEW
    // =========================
    if (role === "student") {
      const isStudentInGroup = assignment.classGroupId.students
        .map(s => s.toString())
        .includes(userId.toString());

      if (!isStudentInGroup) {
        return res.status(403).json({ message: "Access denied" });
      }


      // fetch student's attendance (aggregation later)
      const attendance =
      await AttendanceAggregationService.getStudentAttendanceDetails(
        userId,
        assignment._id
      );

    return res.status(200).json({
        subject: assignment.subjectId,
        classGroup: assignment.classGroupId,
        teacher: assignment.teacherId,
        students: assignment.classGroupId.students,
      attendance
      });
    }

    // =========================
    // TEACHER / ADMIN VIEW
    // =========================
    const attendanceSummary =
  await AttendanceAggregationService.getTeacherAttendanceSummary(
    assignment._id
  );

    return res.status(200).json({
      subject: assignment.subjectId,
      classGroup: assignment.classGroupId,
      teacher: assignment.teacherId,
      students: assignment.classGroupId.students,
      attendanceSummary
    });

  } catch (err) {
    console.error("Get subject assignment details error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};





exports.createSubjectAssignment = async (req, res) => {
  try {
    const {
      subjectId,
      classGroupId,
      teacherId,
      academicYear,
      offeringType,
      subjectAssignmentType
    } = req.body;

    if (
      !subjectId ||
      !classGroupId ||
      !teacherId ||
      !academicYear ||
      !offeringType ||
      !subjectAssignmentType
    ) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    // validate subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(400).json({ message: "Invalid subject" });
    }

    // validate class group
    const classGroup = await ClassGroup.findById(classGroupId);
    if (!classGroup) {
      return res.status(400).json({ message: "Invalid class group" });
    }

    // validate teacher
    const teacher = await User.findOne({
      _id: teacherId,
      role: "teacher",
      isActive: true
    });

    if (!teacher) {
      return res.status(400).json({ message: "Invalid teacher" });
    }

    // prevent duplicate ACTIVE assignment
    const exists = await SubjectAssignment.findOne({
      subjectId,
      classGroupId,
      teacherId,
      subjectAssignmentType,
      academicYear,
      isActive: true
    });

    if (exists) {
      return res.status(409).json({
        message: "Active subject assignment already exists"
      });
    }

    await SubjectAssignment.create({
      subjectId,
      classGroupId,
      teacherId,
      academicYear,
      offeringType,
      subjectAssignmentType,
      isActive: true
    });

    return res.status(201).json({
      message: "Subject assignment created successfully"
    });

  } catch (err) {
    console.error("Create subject assignment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateSubjectAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be boolean"
      });
    }

    const assignment = await SubjectAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        message: "Subject assignment not found"
      });
    }

    // prevent reactivation if you want strict immutability
    if (assignment.isActive === false && isActive === true) {
      return res.status(403).json({
        message: "Inactive subject assignment cannot be reactivated"
      });
    }

    assignment.isActive = isActive;
    await assignment.save();

    return res.status(200).json({
      message: `Subject assignment ${isActive ? "activated" : "deactivated"}`
    });

  } catch (err) {
    console.error("Update subject assignment status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
