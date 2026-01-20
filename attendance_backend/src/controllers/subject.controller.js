const Subject = require("../models/subject");

// CREATE SUBJECT
exports.newSubject = async (req, res) => {
  try {
    const { subjectCode } = req.body;

    const subjectExists = await Subject.findOne({ subjectCode });
    if (subjectExists) {
      return res.status(409).json({
        message: "Subject with this code already exists"
      });
    }

    await Subject.create(req.body);

    return res.status(201).json({
      message: "Subject created successfully"
    });

  } catch (err) {
    console.error("Create subject error:", err);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

// GET ALL SUBJECTS
exports.allSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true });

    return res.status(200).json(subjects);

  } catch (err) {
    console.error("Fetch subjects error:", err);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

// UPDATE SUBJECT
exports.editSubject = async (req, res) => {
  try {
    const subjectId = req.params.id;

    // 🚫 Prevent subjectCode update
    if (req.body.subjectCode) {
      return res.status(400).json({
        message: "Subject code cannot be updated"
      });
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      subjectId,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedSubject) {
      return res.status(404).json({
        message: "Subject not found"
      });
    }

    return res.status(200).json({
      message: "Subject updated successfully"
    });

  } catch (err) {
    console.error("Update subject error:", err);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

exports.updateSubjectStatus = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const { isActive } = req.body;

    // Validate input
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false"
      });
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      subjectId,
      { isActive },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedSubject) {
      return res.status(404).json({
        message: "Subject not found"
      });
    }

    return res.status(200).json({
      message: `Subject ${isActive ? "activated" : "deactivated"} successfully`
    });

  } catch (err) {
    console.error("Update subject status error:", err);
    return res.status(500).json({
      message: "Server error"
    });
  }
};
