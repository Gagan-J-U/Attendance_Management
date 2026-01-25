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
