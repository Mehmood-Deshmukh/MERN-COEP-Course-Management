const express = require("express");
const router = express.Router();
const { importCourses, getCourses, addCourse, editCourse } = require("../controllers/courseController");
const upload = require("../middleware/upload");

router.get("/", getCourses);
router.post("/import", upload.single('file'), importCourses);
router.post("/add", addCourse);
router.post("/edit/:id", editCourse);

module.exports = router;