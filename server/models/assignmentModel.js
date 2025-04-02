const mongoose = require('mongoose');
const Teacher = require("./teacherModel");
const Course = require("./courseModel");
const Schema = mongoose.Schema;

const assignmentSchema = new Schema({
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    teacherId: {
        type: Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    divisions: {
        type: Number,
        default: 0,
        min: 0
    },
    batches: {
        type: Number,
        default: 0,
        min: 0
    },
    lectureLoad: {
        type: Number,
        default: 0,
        min: 0
    },
    labLoad: {
        type: Number,
        default: 0,
        min: 0
    }
}, { timestamps: true });

assignmentSchema.virtual('totalLoad').get(function() {
    return this.lectureLoad + this.labLoad;
});

assignmentSchema.statics.assignTeacher = async function(teacherId, courseId, divisions, batches) {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) throw new Error("Teacher Not Found!");
    
    const course = await Course.findById(courseId);
    if (!course) throw new Error("Course Not Found!");
    
    if (teacher.status !== 'Active') {
        throw new Error("Cannot assign load to inactive teacher!");
    }

    const lectureLoad = divisions * course.lectHrs;
    const labLoad = batches * course.labHrs;
    const totalLoad = lectureLoad + labLoad;
    
    if (teacher.remainingLoad < totalLoad) {
        throw new Error(`Insufficient remaining load for teacher. Required: ${totalLoad}, Available: ${teacher.remainingLoad}`);
    }

    const assignment = new this({
        courseId,
        teacherId,
        divisions,
        batches,
        lectureLoad,
        labLoad
    });

    await assignment.save();

    course.assignments.push(assignment._id);
    course.reqLectLoad -= lectureLoad;
    course.reqLabLoad -= labLoad;
    course.reqTotalLoad = course.reqLectLoad + course.reqLabLoad;
    await course.save();

    teacher.assignments.push(assignment._id);
    teacher.assignedLoad += totalLoad;
    teacher.remainingLoad = teacher.loadLimit - teacher.assignedLoad;


	teacher.status = teacher.remainingLoad === 0 ? 'Inactive' : 'Active';
    await teacher.save();

    return {
        assignment,
        teacher,
        course
    };
};

assignmentSchema.statics.updateAssignment = async function(id, divisions, batches) {
    const assignment = await this.findById(id);
    if (!assignment) throw new Error("Assignment Not Found!");

    const teacher = await Teacher.findById(assignment.teacherId);
    if (!teacher) throw new Error("Teacher Not Found!");

    const course = await Course.findById(assignment.courseId);
    if (!course) throw new Error("Course Not Found!");

    const currentTotalLoad = assignment.lectureLoad + assignment.labLoad;
    const newLectureLoad = divisions * course.lectHrs;
    const newLabLoad = batches * course.labHrs;
    const newTotalLoad = newLectureLoad + newLabLoad;
    const loadDifference = newTotalLoad - currentTotalLoad;

    if (teacher.remainingLoad < loadDifference) {
        throw new Error(`Insufficient remaining load for teacher. Required additional: ${loadDifference}, Available: ${teacher.remainingLoad}`);
    }

    course.reqLectLoad += assignment.lectureLoad;
    course.reqLabLoad += assignment.labLoad;
    
    assignment.divisions = divisions;
    assignment.batches = batches;
    assignment.lectureLoad = newLectureLoad;
    assignment.labLoad = newLabLoad;
    await assignment.save();

    course.reqLectLoad -= newLectureLoad;
    course.reqLabLoad -= newLabLoad;
    course.reqTotalLoad = course.reqLectLoad + course.reqLabLoad;
    await course.save();

    teacher.assignedLoad += loadDifference;
    teacher.remainingLoad = teacher.loadLimit - teacher.assignedLoad;

	teacher.status = teacher.remainingLoad === 0 ? 'Inactive' : 'Active';
    await teacher.save();

    return {
        assignment,
        teacher,
        course
    };
};

assignmentSchema.statics.deleteAssignment = async function(id) {
    const assignment = await this.findById(id);
    if (!assignment) throw new Error("Assignment Not Found!");

    const teacher = await Teacher.findById(assignment.teacherId);
    if (!teacher) throw new Error("Teacher Not Found!");

    const course = await Course.findById(assignment.courseId);
    if (!course) throw new Error("Course Not Found!");

    const totalLoad = assignment.lectureLoad + assignment.labLoad;
    
    teacher.assignedLoad -= totalLoad;
    teacher.remainingLoad = teacher.loadLimit - teacher.assignedLoad;
    teacher.assignments.pull(assignment._id);

	teacher.status = teacher.remainingLoad === 0 ? 'Inactive' : 'Active';
    await teacher.save();

    course.assignments.pull(assignment._id);
    course.reqLectLoad += assignment.lectureLoad;
    course.reqLabLoad += assignment.labLoad;
    course.reqTotalLoad = course.reqLectLoad + course.reqLabLoad;
    await course.save();

    await this.deleteOne({ _id: id });

    return {
        assignment,
        teacher,
        course
    };
};

assignmentSchema.statics.getAssignments = async function(teacherId) {
    const assignments = await this.find({ teacherId })
        .populate('courseId')
        .populate('teacherId')
        .lean();
    return assignments;
};

module.exports = mongoose.model('Assignment', assignmentSchema);