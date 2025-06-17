const Course = require('../models/courseModel');
const xlsx = require('xlsx');

const determineYear = (sem) => {
    if (typeof sem === 'string' && sem.startsWith('MT')) {
        if (sem.includes('I') && !sem.includes('III') && !sem.includes('IV')) {
            return 'MTech 1st Year';
        } else if (sem.includes('III') || sem.includes('IV')) {
            return 'MTech 2nd Year';
        }
        return 'Unknown';
    }

    const semMapping = {
        'I': '1st Year',
        'II': '1st Year',
        'III': '2nd Year',
        'IV': '2nd Year',
        'V': '3rd Year',
        'VI': '3rd Year',
        'VII': '4th Year',
        'VIII': '4th Year'
    };

    const year = semMapping[sem];
    if (!year && sem?.startsWith('VIII')) {
        return '4th Year';
    }
    return year || 'Unknown';
};

const calculateDivisions = (year) => {
    if (year === '1st Year') return 5;
    if (['2nd Year', '3rd Year', '4th Year'].includes(year)) return 2;
    if (['MTech 1st Year', 'MTech 2nd Year'].includes(year)) return 1;
    return 0;
};

const transformRowToCourse = (row) => {
    console.log(row);
    if (!row.Subject || row.Subject.trim() === '') {
        return null;
    }

    const sem = row.Sem;
    const year = determineYear(sem);


    const divisions = calculateDivisions(year);
    const batches = divisions * 4;

    const lectHrs = parseFloat(row['Lect Hrs'] || row['Lect\nHrs'] || 0);
    const labHrs = parseFloat(row['Lab Hrs'] || row['Lab\nHrs'] || 0);
    const tutHrs = parseFloat(row['Tut Hrs'] || row['Tut\nHrs'] || 0);

    const reqLectLoad = divisions * lectHrs;
    const reqLabLoad = batches * labHrs;

    return {
        subject: row.Subject,
        curriculum: row.Curriculum || '',
        sem,
        year,
        lectHrs,
        labHrs,
        tutHrs,
        divisions,
        batches,
        reqLectLoad,
        reqLabLoad,
        reqTotalLoad: reqLectLoad + reqLabLoad
    };
};


const processExcelFile = (buffer) => {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    console.log(workbook.SheetNames);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    return jsonData
        .map(row => transformRowToCourse(row))
        .filter(course => course !== null);
};

const importCourses = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        const coursesData = processExcelFile(req.file.buffer);

        await Course.deleteMany({});

        // sending 200-300 courses directly to the frontend isn't a good thing i think
        // i am commenting this and i have written seperate route for getCourses with 
        // pagination hope this works
        // const insertedCourses = await Course.insertMany(coursesData);

        await Course.insertMany(coursesData);
        console.log(`Imported ${coursesData.length} courses successfully.`);

        return res.status(200).json({
            success: true,
            message: 'Courses imported successfully',
            data: null // we may send top 10 files here as well but i prefer getCourses at least for now
        });
    }
    catch (error) {
        console.error('Error importing courses:', error);
        return res.status(500).json({
            success: false,
            message: `Error importing courses: ${error.message}`
        });
    }
};

const getCourses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const courses = await Course.find()
            .sort({ subject: 1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'assignments',
                select: '_id teacherId divisions batches lectureLoad labLoad',
                populate: {
                    path: 'teacherId',
                    select: 'name position loadLimit assignedLoad status'
                }
            })
            .lean();
        for(const course of courses) {
            if (course.assignments && course.assignments.length > 0) {
                console.log(course.assignments);
            }
        }

        const totalCourses = await Course.countDocuments();
        const totalPages = Math.ceil(totalCourses / limit);

        if (!courses.length) {
            return res.status(404).json({
                success: false,
                message: "Courses not found!",
                data: null
            });
        }

        return res.status(200).json({
            success: true,
            message: "Courses fetched successfully",
            page: page,
            totalPages,
            data: courses
        });

    } catch (e) {
        console.log(e.message);
        return res.status(500).json({
            success: false,
            message: 'Error fetching courses! Please try again!',
            error: e.message,
            data: null
        });
    }
};


module.exports = {
    importCourses,
    getCourses
};