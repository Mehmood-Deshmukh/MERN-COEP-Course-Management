const mongoose = require('mongoose');
const Assignment = require("../models/assignmentModel");
const Teacher = require("../models/teacherModel");
const Course = require("../models/courseModel");

const assignMultipleTeachers = async (req, res) => {
    try {
        const { assignments } = req.body;
        
        if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid assignment data. Expected an array of assignments.",
                data: null
            });
        }

        const results = {
            successful: [],
            failed: []
        };

        for (let i = 0; i < assignments.length; i++) {
            const { teacherId, courseId, divisions, batches } = assignments[i];
            
            if (!teacherId || !courseId || divisions === undefined || batches === undefined) {
                results.failed.push({
                    index: i,
                    error: "Missing required fields",
                    assignment: assignments[i]
                });
                continue;
            }

            try {
                if (!mongoose.Types.ObjectId.isValid(teacherId) || !mongoose.Types.ObjectId.isValid(courseId)) {
                    results.failed.push({
                        index: i,
                        error: "Invalid teacherId or courseId",
                        assignment: assignments[i]
                    });
                    continue;
                }

                const _assignment = await Assignment.findOne({ teacherId, courseId });
                if (_assignment && (divisions > 0 || batches > 0)) {
                    // results.failed.push({
                    //     index: i,
                    //     error: "Teacher already assigned to this course",
                    //     assignment: assignments[i]
                    // });

                    // update if already assigned
                    const result = await Assignment.updateAssignment(_assignment._id, divisions, batches);
                    results.successful.push({
                        index: i,
                        result
                    });
                    continue;
                }else if(_assignment && (divisions === 0 || batches === 0)){
                    // delete if already assigned
                    const result = await Assignment.deleteAssignment(_assignment._id);
                    results.successful.push({
                        index: i,
                        result
                    });
                    continue;
                }

                const result = await Assignment.assignTeacher(teacherId, courseId, divisions, batches);
                results.successful.push({
                    index: i,
                    result
                });
            } catch (error) {
                results.failed.push({
                    index: i,
                    error: error.message,
                    assignment: assignments[i]
                });
            }
        }

        const allFailed = results.successful.length === 0 && results.failed.length > 0;
        const status = allFailed ? 400 : 200;

        return res.status(status).json({
            success: results.successful.length > 0,
            message: allFailed 
                ? "Failed to assign any teachers" 
                : results.failed.length > 0 
                    ? "Some teachers assigned successfully with errors" 
                    : "All teachers assigned successfully",
            data: {
                successCount: results.successful.length,
                failCount: results.failed.length,
                results
            }
        });
    } catch (e) {
        console.log(e.message);
        return res.status(500).json({
            success: false,
            message: "Failed to assign teachers!",
            error: e.message,
            data: null
        });
    }
};

const assignTeacher = async (req, res) => {
    try {
        const { teacherId, courseId, divisions, batches } = req.body;
        
        if (!teacherId || !courseId || divisions === undefined || batches === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
                data: null
            });
        }

        if (!mongoose.Types.ObjectId.isValid(teacherId) || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid teacherId or courseId",
                data: null
            });
        }

        if (divisions < 0 || batches < 0) {
            return res.status(400).json({
                success: false,
                message: "Divisions and batches must be non-negative",
                data: null
            });
        }

        const _assignment = await Assignment.findOne({ teacherId, courseId });
        if (_assignment) {
            return res.status(400).json({
                success: false,
                message: "Teacher already assigned to this course! Please update the assignment instead.",
                data: null
            });
        }

        const result = await Assignment.assignTeacher(teacherId, courseId, divisions, batches);

        return res.status(200).json({
            success: true,
            message: "Teacher assigned successfully!",
            data: result
        });
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({
            success: false,
            error: error.message,
            message: "Failed to assign teacher!",
            data: null
        });
    }
};

const updateAssignment = async (req, res) => {
    try {
        const { id, divisions, batches } = req.body;
        
        if (!id || divisions === undefined || batches === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
                data: null
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid assignment ID",
                data: null
            });
        }

        if (divisions < 0 || batches < 0) {
            return res.status(400).json({
                success: false,
                message: "Divisions and batches must be non-negative",
                data: null
            });
        }

        const result = await Assignment.updateAssignment(id, divisions, batches);

        return res.status(200).json({
            success: true,
            message: "Assignment updated successfully!",
            data: result
        });
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({
            success: false,
            error: error.message,
            message: "Failed to update assignment!",
            data: null
        });
    }
};

const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Assignment ID is required",
                data: null
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid assignment ID",
                data: null
            });
        }

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
                data: null
            });
        }

        const result = await Assignment.deleteAssignment(id);

        return res.status(200).json({
            success: true,
            message: "Assignment deleted successfully!",
            data: result
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Failed to delete assignment!",
            data: null
        });
    }
};

const getAssignmentsByTeacher = async (req, res) => {   
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Teacher ID is required",
                data: null
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid teacher ID",
                data: null
            });
        }

        const teacher = await Teacher.findById(id);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found",
                data: null
            });
        }

        const assignments = await Assignment.find({ teacherId: id })
            .populate({
                path: 'courseId',
                select: 'subject curriculum sem year lectHrs labHrs'
            })
            .lean();
        
        return res.status(200).json({
            success: true,
            message: "Assignments fetched successfully",
            data: assignments
        });
    } catch (e) {
        console.log(e.message);
        return res.status(500).json({
            success: false,
            message: 'Error fetching assignments! Please try again!',
            error: e.message,
            data: null
        });
    }
};

module.exports = {
    assignMultipleTeachers,
    assignTeacher,
    updateAssignment,
    deleteAssignment,
    getAssignmentsByTeacher
}