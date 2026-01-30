const User = require("../models/users");
const xlsx = require("xlsx");
const bcrypt = require("bcrypt");

/**
 * Bulk Upload Students
 * POST /api/bulk/students
 */
exports.bulkUploadStudents = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const results = { success: 0, errors: [] };

        for (const [index, row] of data.entries()) {
            try {
                const { name, email, password, rollNo, department, semester, section, phoneNumber } = row;

                if (!name || !email || !password || !rollNo || !department || !semester || !section) {
                    results.errors.push({ row: index + 2, message: "Missing required fields" });
                    continue;
                }

                // Check duplicate email
                const existing = await User.findOne({ email });
                if (existing) {
                    results.errors.push({ row: index + 2, email, message: "Email already exists" });
                    continue;
                }

                await User.create({
                    name,
                    email,
                    password, // pre-save hook handles hashing
                    phoneNumber,
                    role: "student",
                    studentInfo: {
                        rollNo: rollNo.toString(),
                        department,
                        semester: Number(semester),
                        section
                    }
                });
                results.success++;
            } catch (err) {
                results.errors.push({ row: index + 2, message: err.message });
            }
        }

        res.status(200).json({ message: "Bulk upload completed", summary: results });

    } catch (error) {
        console.error("Bulk Upload Students Error:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Bulk Upload Teachers
 * POST /api/bulk/teachers
 */
exports.bulkUploadTeachers = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const results = { success: 0, errors: [] };

        for (const [index, row] of data.entries()) {
            try {
                const { name, email, password, employeeId, department, phoneNumber } = row;

                if (!name || !email || !password || !employeeId || !department) {
                    results.errors.push({ row: index + 2, message: "Missing required fields" });
                    continue;
                }

                const existing = await User.findOne({ email });
                if (existing) {
                    results.errors.push({ row: index + 2, email, message: "Email already exists" });
                    continue;
                }

                await User.create({
                    name,
                    email,
                    password,
                    phoneNumber,
                    role: "teacher",
                    teacherInfo: {
                        employeeId: employeeId.toString(),
                        department
                    }
                });
                results.success++;
            } catch (err) {
                results.errors.push({ row: index + 2, message: err.message });
            }
        }

        res.status(200).json({ message: "Bulk upload completed", summary: results });

    } catch (error) {
        console.error("Bulk Upload Teachers Error:", error);
        res.status(500).json({ message: error.message });
    }
};
