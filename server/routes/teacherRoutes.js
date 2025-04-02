const express = require("express");
const router = express.Router();
const {importTeachers, getTeacher, getTeachers} = require("../controllers/teacherController");
const upload = require("../middleware/upload");

router.post("/import", upload.single('file'), importTeachers);
router.get("/single/:teacherId", getTeacher);
router.get("/all", getTeachers);

module.exports = router;