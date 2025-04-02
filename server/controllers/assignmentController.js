const Assignment = require("../models/assignmentModel");

const assignMultipleTeachers = async (req, res) => {
    try {
        const { assignments } = req.body;

        for (let i = 0; i < assignments.length; i++) {
            const { teacherId, courseId, divisions, batches } = assignments[i];

            const _assignment = await Assignment.findOne({ teacherId, courseId });
            if (_assignment) {
                return res.status(400).json({
                    success: false,
                    message: "Teacher already assigned to this course! Please update the assignment instead.",
                    data: null
                });
            }

            await Assignment.assignTeacher(teacherId, courseId, divisions, batches);
        }

        return res.status(200).json({
            success: true,
            message: "Teachers Assigned Successfully!",
            data: null
        });
    } catch (e) {
        console.log(e.message);
        return res.status(500).json({
            success: false,
            error: e.message,
            message: "Failed to assign teachers!",
            data: null
        })
    }
}

const assignTeacher = async (req, res) => {
    try {
        const { teacherId, courseId, divisions, batches } = req.body;

        const _assignment = await Assignment.findOne({ teacherId, courseId });
        if (_assignment) {
            return res.status(400).json({
                success: false,
                message: "Teacher already assigned to this course! Please update the assignment instead.",
                data: null
            });
        }

        const {
            assignment,
            teacher,
            course
        } = await Assignment.assignTeacher(teacherId, courseId, divisions, batches);

        return res.status(200).json({
            success: true,
            message: "Teacher Assigned Successfully!",
            data: {
                assignment,
                teacher,
                course
            }
        });
    } catch (error) {
        console.log(error.message);
        return res.status({
            success: false,
            error: error.message,
            message: "Failed to assign teacher!",
            data: null
        })
    }
}

const updateAssignment = async (req, res) => {
    try {
        const { id, divisions, batches } = req.body;

        const assignment = await Assignment.updateAssignment(id, divisions, batches);

        return res.status(200).json({
            success: true,
            message: "Assignment Updated Successfully!",
            data: assignment
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to update assignment!",
            data: null
        })
    }
}

const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await Assignment.deleteAssignment(id);

        return res.status(200).json({
            success: true,
            message: "Assignment Deleted Successfully!",
            data: assignment
        });
    } catch (error) {
        console.log(error.message);
        return res.status({
            success: false,
            error: error.message,
            message: "Failed to delete assignment!",
            data: null
        })
    }
}

module.exports = {
    assignMultipleTeachers,
    assignTeacher,
    updateAssignment,
    deleteAssignment
}