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
    if (!row.Subject || row.Subject.trim() === '') {
        return null;
    }

    // console.log(Object.keys(row));

    const sem = row.Sem;
    const year = determineYear(sem);

    if (!sem)
        console.log(row.Subject);

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
        const insertedCourses = await Course.insertMany(coursesData);

        return res.status(200).json({
            success: true,
            message: 'Courses imported successfully',
            data: insertedCourses
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

module.exports = {
    importCourses,
};