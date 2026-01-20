const ClassGroup = require("../models/classGroup");
const User = require("../models/users");

/**
 * CREATE CLASS GROUP
 */
exports.createClassGroup = async (req, res) => {
  try {
    const {
      department,
      semester,
      section,
      academicYear,
      classTeacherId,
      defaultClassroomId
    } = req.body;

    if (!department || !semester || !section || !academicYear) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    const exists = await ClassGroup.findOne({
      department,
      semester,
      section,
      academicYear
    });

    if (exists) {
      return res.status(409).json({
        message: "Class group already exists"
      });
    }

    // Validate class teacher if provided
    if (classTeacherId) {
      const teacher = await User.findOne({
        _id: classTeacherId,
        role: "teacher",
        isActive: true
      });

      if (!teacher) {
        return res.status(400).json({
          message: "Invalid class teacher"
        });
      }
    }

    await ClassGroup.create({
      department,
      semester,
      section,
      academicYear,
      classTeacherId,
      defaultClassroomId
    });

    return res.status(201).json({
      message: "Class group created successfully"
    });

  } catch (err) {
    console.error("Create class group error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ALL CLASS GROUPS
 */
exports.getAllClassGroups = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;

    // =========================
    // ADMIN → ALL CLASS GROUPS
    // =========================
    if (role === "admin") {
      const groups = await ClassGroup.find()
        .populate("classTeacherId", "name email")
        .populate("defaultClassroomId", "roomNumber");

      return res.status(200).json(groups);
    }

    // =========================
    // CLASS TEACHER → OWN GROUPS
    // =========================
    if (role === "teacher") {
      const groups = await ClassGroup.find({
        classTeacherId: userId
      })
        .populate("classTeacherId", "name email")
        .populate("defaultClassroomId", "roomNumber");

      return res.status(200).json(groups);
    }

    // =========================
    // OTHERS → FORBIDDEN
    // =========================
    return res.status(403).json({
      message: "Access denied"
    });

  } catch (err) {
    console.error("Get all class groups error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


/**
 * GET CLASS GROUP BY ID
 */
exports.getClassGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await ClassGroup.findById(id)
      .populate("classTeacherId", "name email")
      .populate("defaultClassroomId", "roomNumber")
      .populate("students", "name usn email");

    if (!group) {
      return res.status(404).json({
        message: "Class group not found"
      });
    }

    return res.status(200).json(group);

  } catch (err) {
    console.error("Get class group error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * ASSIGN / CHANGE CLASS TEACHER
 */
exports.assignClassTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { classTeacherId } = req.body;

    const classGroup = await ClassGroup.findById(id);
    if (!classGroup) {
      return res.status(404).json({ message: "Class group not found" });
    }

    if (!classGroup.isActive) {
      return res.status(403).json({
        message: "Cannot modify inactive class group"
      });
    }

    const teacher = await User.findOne({
      _id: classTeacherId,
      role: "teacher",
      isActive: true
    });

    if (!teacher) {
      return res.status(400).json({ message: "Invalid teacher" });
    }

    classGroup.classTeacherId = classTeacherId;
    await classGroup.save();

    return res.status(200).json({
      message: "Class teacher assigned successfully"
    });

  } catch (err) {
    console.error("Assign class teacher error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


/**
 * ACTIVATE / DEACTIVATE CLASS GROUP
 */
exports.updateClassGroupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be boolean"
      });
    }

    const updated = await ClassGroup.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Class group not found"
      });
    }

    return res.status(200).json({
      message: "Class group status updated"
    });

  } catch (err) {
    console.error("Update class group status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


exports.addStudentToClassGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    const classGroup = await ClassGroup.findById(id);
    if (!classGroup) {
      return res.status(404).json({ message: "Class group not found" });
    }

    if (!classGroup.isActive) {
      return res.status(403).json({
        message: "Cannot modify inactive class group"
      });
    }

    const student = await User.findOne({
      _id: studentId,
      role: "student",
      isActive: true
    });

    if (!student) {
      return res.status(400).json({ message: "Invalid student" });
    }

    if (classGroup.students.includes(studentId)) {
      return res.status(409).json({
        message: "Student already in class group"
      });
    }

    classGroup.students.push(studentId);
    await classGroup.save();

    return res.status(200).json({
      message: "Student added to class group"
    });

  } catch (err) {
    console.error("Add student error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.removeStudentFromClassGroup = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    const classGroup = await ClassGroup.findById(id);
    if (!classGroup) {
      return res.status(404).json({ message: "Class group not found" });
    }

    if (!classGroup.isActive) {
      return res.status(403).json({
        message: "Cannot modify inactive class group"
      });
    }

    classGroup.students = classGroup.students.filter(
      s => s.toString() !== studentId
    );

    await classGroup.save();

    return res.status(200).json({
      message: "Student removed from class group"
    });

  } catch (err) {
    console.error("Remove student error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};