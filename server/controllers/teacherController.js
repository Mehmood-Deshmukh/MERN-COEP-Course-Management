const { Readable } = require('stream');
const csv = require('csv-parser');
const Teacher = require('../models/teacherModel');
const Assignment = require('../models/assignmentModel');

const transformRowToTeacher = (row) => {
    if (!row['Name'] || row['Name'].trim() === '') {
        return null;
    }
    
    const loadLimit = parseFloat(row['Load']) || 0;
    const name = row['Name'].trim();
    const position = row['Post'] ? row['Post'].trim() : 'Faculty';
    const status = loadLimit > 0 ? 'Active' : 'Inactive';
    
    return {
        name,
        position,
        loadLimit,
        status,
        remainingLoad: loadLimit
    };
};

const parseCSVBuffer = async (buffer) => {
    const results = [];
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    
    return new Promise((resolve, reject) => {
        bufferStream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
};

const importTeachers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file',
                data: null
            });
        }

        const results = await parseCSVBuffer(req.file.buffer);
        
        if (!results || results.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid data found in the uploaded file',
                data: null
            });
        }

        await Teacher.deleteMany({});
        
        const teachersData = results
            .map(transformRowToTeacher)
            .filter(teacher => teacher !== null);
            
        if (teachersData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid teacher data found in the uploaded file',
                data: null
            });
        }

        const insertedTeachers = await Teacher.insertMany(teachersData);
        
        return res.status(200).json({
            success: true,
            message: 'Teachers imported successfully',
            data: {
                count: insertedTeachers.length,
                teachers: insertedTeachers.slice(0, 5) // Return first 5 teachers as preview
            }
        });
    } catch (error) {
        console.error('Error importing teachers:', error);
        return res.status(500).json({
            success: false,
            message: `Error importing teachers: ${error.message}`,
            data: null
        });
    }
};

const getTeachers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const skip = (page - 1) * limit;
        const status = req.query.status;
        
        const query = {};
        if (status && ['Active', 'Inactive'].includes(status)) {
            query.status = status;
        }
        
        const teachers = await Teacher.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean();
            
        const totalTeachers = await Teacher.countDocuments(query);
        const totalPages = Math.ceil(totalTeachers / limit);
        
        if (!teachers || teachers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No teachers found!",
                data: null
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Teachers fetched successfully!",
            page,
            totalPages,
            count: teachers.length,
            total: totalTeachers,
            data: teachers
        });
    } catch (e) {
        console.log(e.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch teachers",
            error: e.message,
            data: null
        });
    }
};

const getTeacher = async (req, res) => {
    try {
        const teacherId = req.params.teacherId;
        
        if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid teacher ID",
                data: null
            });
        }
        
        const teacher = await Teacher.findById(teacherId).lean();
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found!",
                data: null
            });
        }
        
        const assignments = await Assignment.find({ teacherId })
            .populate('courseId')
            .lean();
            
        return res.status(200).json({
            success: true,
            message: "Teacher fetched successfully!",
            data: {
                ...teacher,
                assignments
            }
        });
    } catch (e) {
        console.log(e.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch teacher",
            error: e.message,
            data: null
        });
    }
};

module.exports = {
	importTeachers,
	getTeacher,
	getTeachers
};