const express = require('express');
const router = express.Router();

const {
    assignTeacher,
    updateAssignment,
    deleteAssignment
} = require('../controllers/assignmentController');

router.post('/assign', assignTeacher);
router.put('/update', updateAssignment);
router.delete('/delete/:id', deleteAssignment);

module.exports = router;