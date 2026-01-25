const User = require("../models/users");
const XLSX = require("xlsx");


/**
 * ADMIN: Create single student
 */
exports.createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      studentInfo
    } = req.body;

    if (!name || !email || !password || !studentInfo) {
      return res.status(400).json({
        message: "Missing required student data"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    const student = await User.create({
      name,
      email,
      password,
      phoneNumber,
      role: "student",
      studentInfo
    });

    return res.status(201).json({
      message: "Student created successfully",
      studentId: student._id
    });

  } catch (err) {
    console.error("Create student error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * ADMIN: Get all active students
 */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      isActive: true
    }).select("-password");

    return res.status(200).json(students);

  } catch (err) {
    console.error("Get students error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * ADMIN + STUDENT (self): Get student by ID
 */
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // If student, allow only self
    if (req.user.role === "student" && req.user.userId !== id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await User.findOne({
      _id: id,
      role: "student"
    }).select("-password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json(student);

  } catch (err) {
    console.error("Get student error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * ADMIN: Activate / Deactivate student
 */
exports.updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be boolean"
      });
    }

    const student = await User.findOneAndUpdate(
      { _id: id, role: "student" },
      { isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({
      message: "Student status updated",
      student
    });

  } catch (err) {
    console.error("Update student status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};





exports.bulkUploadStudentsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Excel file is required"
      });
    }

    // Read workbook
    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer"
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      return res.status(400).json({
        message: "Excel file is empty"
      });
    }

    let created = 0;
    let skipped = [];

    for (const row of rows) {
      const {
        name,
        email,
        password,
        rollNo,
        department,
        semester,
        section,
        phoneNumber
      } = row;

      // Required fields check
      if (
        !name ||
        !email ||
        !password ||
        !rollNo ||
        !department ||
        !semester ||
        !section
      ) {
        skipped.push({
          email: email || "unknown",
          reason: "Missing required fields"
        });
        continue;
      }

      const exists = await User.findOne({ email });
      if (exists) {
        skipped.push({
          email,
          reason: "Email already exists"
        });
        continue;
      }

      try {
        await User.create({
          name,
          email,
          password,
          phoneNumber,
          role: "student",
          studentInfo: {
            rollNo,
            department,
            semester,
            section
          }
        });
        created++;
      } catch (err) {
        skipped.push({
          email,
          reason: "Validation failed"
        });
      }
    }

    return res.status(201).json({
      message: "Excel upload completed",
      created,
      skipped
    });

  } catch (err) {
    console.error("Excel bulk upload error:", err);
    return res.status(500).json({
      message: "Server error"
    });
  }
};
