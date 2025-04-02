const { Readable } = require('stream');
const csv = require('csv-parser');
const Teacher = require('../models/teacherModel');


const transformRowToTeacher = (row) => {
	const loadLimit = parseFloat(row['Load']);
	const name = row['Name'];
	const position = row['Post'];
	const status = loadLimit > 0 ? 'Active' : 'Inactive';
	return {
		name,
		position,
		loadLimit,
		status
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
	if (!req.file) {
		res.status(400);
		throw new Error('Please upload a file');
	}

	try {
		const results = await parseCSVBuffer(req.file.buffer);

		await Teacher.deleteMany({});

		const teachersData = results.map(transformRowToTeacher);

		const insertedTeachers = await Teacher.insertMany(teachersData);

		res.status(200).json({
			message: 'Teachers imported successfully',
			data: insertedTeachers,
			success: true
		});
	} catch (error) {
		console.error('Error importing teachers:', error);
		res.status(500).json({
			message: `Error importing teachers: ${error.message}`,
			success: false
		});
	}
};

const getTeachers = async (req, res) => {
	try{
		const teachers = await Teacher.find({}).sort({ name: 1 });
		if (!teachers || teachers.length === 0) {
			return res.status(404).json({
				success: false,
				message: "No teachers found!",
				data: null
			});
		};

		return res.status(200).json({
			success: true,
			message: "Teachers fetched successfully!",
			data: teachers
		});
	}catch(e) {
		console.log(e.message);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch teachers",
			error: e.message,
			data: null
		})
	}
}

const getTeacher = async (req, res) => {
	try {
		const teacherId = req.params.teacherId;
		const teacher = await Teacher.findById(teacherId);

		if (!teacher) {
			return res.status(404).json({
				success: false,
				message: "Teacher not found!",
				data: null
			});
		};

		return res.status(200).json({
			success: true,
			message: "Teacher fetched successfully!",
			data: teacher
		});

	} catch (e) {
		console.log(e.message);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch teacher",
			error: e.message,
			data: null
		})
	}
}

module.exports = {
	importTeachers,
	getTeacher,
	getTeachers
};