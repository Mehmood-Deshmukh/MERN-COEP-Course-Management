const express = require("express");
const connectDB = require("./config/db");
const teacherRoutes = require("./routes/teacherRoutes");
const courseRoutes = require("./routes/courseRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");

const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/teachers", teacherRoutes);
app.use("/api/courses", courseRoutes);
app.use('/api/assignments', assignmentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
