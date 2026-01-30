const ExamSchedule = require("../models/examSchedule");
const TimeSlot = require("../models/timeSlot");

/**
 * Create Exam Schedule
 * POST /api/exams
 */
exports.createExam = async (req, res) => {
  try {
    const { title, date, startTime, endTime, allocations, invigilators } = req.body;
    
    // Allocations: [{ classGroupId, studentCount, classroomNumber }]
    // Invigilators: [{ teacherId, classroomNumber }]

    // TODO: VALIDATION
    // 1. Check if classrooms are free? 
    // Since Exam is a "Global Override", we might allowing overbooking regular classes,
    // but we should check if *another exam* uses the room.
    
    const existingExams = await ExamSchedule.find({
        date: new Date(date),
        isActive: true,
        $or: [
           { "allocations.classroomNumber": { $in: allocations.map(a => a.classroomNumber) } },
           { "invigilators.classroomNumber": { $in: invigilators.map(i => i.classroomNumber) } }
        ]
    });
    
    // Check time overlap
    // Simple string check
    const hasOverlap = existingExams.some(exam => {
        return (startTime >= exam.startTime && startTime < exam.endTime) || (endTime > exam.startTime && endTime <= exam.endTime);
    });

    if (hasOverlap) {
        return res.status(409).json({ message: "Conflict with another scheduled exam in selected rooms." });
    }

    const exam = new ExamSchedule({
      title,
      date: new Date(date),
      startTime,
      endTime,
      allocations,
      invigilators,
      createdBy: req.user?._id // Assuming auth middleware
    });

    await exam.save();
    res.status(201).json(exam);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get All Exams (Admin)
 * GET /api/exams
 */
exports.getAllExams = async (req, res) => {
    try {
        const { startDate, endDate, classGroupId } = req.query;
        let query = { isActive: true };

        if (startDate && endDate) {
            query.date = { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate) 
            };
        }

        if (classGroupId) {
            query["allocations.classGroupId"] = classGroupId;
        }

        const exams = await ExamSchedule.find(query)
            .populate("allocations.classGroupId", "department semester section")
            .populate("allocations.classroomNumber", "roomName block")
            .populate("invigilators.teacherId", "name email")
            .populate("invigilators.classroomNumber", "roomName block text")
            .sort({ date: 1, startTime: 1 });

        res.status(200).json(exams);
    } catch (error) {
        console.error("Get exams error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Delete/Deactivate Exam
 * DELETE /api/exams/:id
 */
exports.deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await ExamSchedule.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!exam) return res.status(404).json({ message: "Exam not found" });
        res.status(200).json({ message: "Exam deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
