const Classroom = require("../models/classroom");

/**
 * CREATE CLASSROOM
 */
exports.createClassroom = async (req, res) => {
  try {
    const { roomNumber, building, capacity, type } = req.body;

    if (!roomNumber || !capacity || !type) {
      return res.status(400).json({
        message: "roomNumber, capacity and type are required"
      });
    }

    const exists = await Classroom.findOne({ roomNumber });
    if (exists) {
      return res.status(409).json({
        message: "Classroom already exists"
      });
    }

    await Classroom.create({
      roomNumber,
      building,
      capacity,
      type
    });

    return res.status(201).json({
      message: "Classroom created successfully"
    });

  } catch (err) {
    console.error("Create classroom error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ALL CLASSROOMS
 */
exports.getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ isActive: true })
      .sort({ roomNumber: 1 });

    return res.status(200).json(classrooms);

  } catch (err) {
    console.error("Get classrooms error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET CLASSROOM BY ID
 */
exports.getClassroomById = async (req, res) => {
  try {
    const { id } = req.params;

    const classroom = await Classroom.findById(id);
    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found"
      });
    }

    return res.status(200).json(classroom);

  } catch (err) {
    console.error("Get classroom error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE CLASSROOM
 */
exports.updateClassroom = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Classroom.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Classroom not found"
      });
    }

    return res.status(200).json({
      message: "Classroom updated successfully"
    });

  } catch (err) {
    console.error("Update classroom error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * ACTIVATE / DEACTIVATE CLASSROOM
 */
exports.updateClassroomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be boolean"
      });
    }

    const updated = await Classroom.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Classroom not found"
      });
    }

    return res.status(200).json({
      message: "Classroom status updated"
    });

  } catch (err) {
    console.error("Update classroom status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
