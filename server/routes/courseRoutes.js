const express = require("express");
const router = express.Router();
const {importCourses} = require("../controllers/courseController");
const upload = require("../middleware/upload");
router.post("/import", upload.single('file'), importCourses);

module.exports = router;