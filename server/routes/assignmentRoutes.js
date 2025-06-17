const express = require('express');
const router = express.Router();

const {
    assignMultipleTeachers,
    assignTeacher,
    updateAssignment,
    deleteAssignment,
    getAssignmentsByTeacher,
    deleteMultipleAssignments
} = require('../controllers/assignmentController');

router.post('/assign/multiple', assignMultipleTeachers);
router.post('/assign', assignTeacher);
router.put('/update', updateAssignment);
router.delete('/delete/:id', deleteAssignment);
router.delete('/delete-multiple', deleteMultipleAssignments);
router.get('/teacher/:id', getAssignmentsByTeacher);
module.exports = router;