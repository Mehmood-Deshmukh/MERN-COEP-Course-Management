const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/csv'
  ) {
    cb(null, true);
  } else {
    cb(new Error('File format not supported. Please upload Excel (.xlsx, .xls) or CSV files.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});

module.exports = upload;