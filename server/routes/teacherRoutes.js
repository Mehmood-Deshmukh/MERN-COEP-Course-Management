const express = require("express");
const router = express.Router();
const {importTeachers} = require("../controllers/teacherController");
const upload = require("../middleware/upload");
router.post("/import", upload.single('file'), importTeachers);

module.exports = router;