const TimeSlot = require("../models/timeSlot");

/**
 * CREATE TIME SLOT
 */
exports.createTimeSlot = async (req, res) => {
  try {
    const { name, startTime, endTime } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({
        message: "Name, startTime and endTime are required"
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        message: "startTime must be before endTime"
      });
    }

    // 🔥 Overlap check
    const overlappingSlot = await TimeSlot.findOne({
      isActive: true,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });

    if (overlappingSlot) {
      return res.status(409).json({
        message: "Time slot overlaps with existing slot"
      });
    }

    await TimeSlot.create({
      name,
      startTime,
      endTime
    });

    return res.status(201).json({
      message: "Time slot created successfully"
    });

  } catch (err) {
    console.error("Create timeslot error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ALL TIME SLOTS
 */
exports.getAllTimeSlots = async (req, res) => {
  try {
    const slots = await TimeSlot.find({ isActive: true }).sort({
      startTime: 1
    });

    return res.status(200).json(slots);

  } catch (err) {
    console.error("Get timeslots error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE TIME SLOT
 */
exports.updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime } = req.body;

    if (startTime && endTime && startTime >= endTime) {
      return res.status(400).json({
        message: "startTime must be before endTime"
      });
    }

    // 🔥 Overlap check (exclude current slot)
    if (startTime && endTime) {
      const overlappingSlot = await TimeSlot.findOne({
        _id: { $ne: id },
        isActive: true,
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      });

      if (overlappingSlot) {
        return res.status(409).json({
          message: "Updated time slot overlaps with existing slot"
        });
      }
    }

    const updatedSlot = await TimeSlot.findByIdAndUpdate(
      id,
      { name, startTime, endTime },
      { new: true, runValidators: true }
    );

    if (!updatedSlot) {
      return res.status(404).json({
        message: "Time slot not found"
      });
    }

    return res.status(200).json({
      message: "Time slot updated successfully"
    });

  } catch (err) {
    console.error("Update timeslot error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE TIME SLOT
 */
exports.deleteTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await TimeSlot.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Time slot not found"
      });
    }

    return res.status(200).json({
      message: "Time slot deleted successfully"
    });

  } catch (err) {
    console.error("Delete timeslot error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
