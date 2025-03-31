const { Readable } = require('stream');
const csv = require('csv-parser');
const Teacher = require('../models/teacherModel');


const transformRowToTeacher = (row) => {
  const loadLimit = parseFloat(row['Load']);
  const name = row['Name'];
  const position = row['Post'];
  
  return {
    name,
    position,
    loadLimit
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

module.exports = {
    importTeachers
};