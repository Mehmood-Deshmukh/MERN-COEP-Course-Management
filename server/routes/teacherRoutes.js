const express = require("express");
const router = express.Router();
const {importTeachers, getTeacher, getTeachers, updateTeacher} = require("../controllers/teacherController");
const upload = require("../middleware/upload");

router.post("/import", upload.single('file'), importTeachers);
router.get("/single/:teacherId", getTeacher);
router.get("/all", getTeachers);

router.put("/update/:teacherId", updateTeacher);
module.exports = router;