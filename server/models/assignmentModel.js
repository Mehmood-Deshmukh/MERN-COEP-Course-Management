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
		default: 0
	},
	batches: {
		type: Number,
		default: 0
	},
	lectureLoad: {
		type: Number,
		default: 0
	},
	labLoad: {
		type: Number,
		default: 0
	}
}, { timestamps: true });

assignmentSchema.virtual('totalLoad').get(function () {
	return this.lectureLoad + this.labLoad;
});

/*

// if it is fixed that lectHrs are always going to be 1hr
// we can do this

assignmentSchema.virtual('lectureLoad').get(function () {
	return this.divisions;
})

// similarly, if it is fixed that labHrs are always going to be 2hrs
// we can do this

assignmentSchema.virtual('labLoad').get(function() {
	return this.batches * 2;
})
*/

assignmentSchema.statics.assignTeacher = async function (teacherId, courseId, divisions, batches) {
	const teacher = await Teacher.findById(teacherId);
	if(!teacher) throw new Error("Teacher Not Found!");
	
	const course = await Course.findById(courseId);
	if (!course) throw new Error("Course Not Found!");

	const lectureLoad = divisions * course.lectHrs;
	const labLoad = batches * course.labHrs;

	const assignment = new this({
		courseId,
		teacherId,
		divisions,
		batches,
		lectureLoad,
		labLoad
	});

	await assignment.save();

	// this may be redundant but keepin it for now
	course.assignments.push(assignment._id);
	course.reqLectLoad -= lectureLoad;
	course.reqLabLoad -= labLoad;
	course.reqTotalLoad -= lectureLoad + labLoad;
	await course.save();

	teacher.assignments.push(assignment._id);
	teacher.assignedLoad = lectureLoad + labLoad;
	teacher.remainingLoad = teacher.loadLimit - teacher.assignedLoad;
	await teacher.save();

	return assignment;
}

assignmentSchema.statics.updateAssignment = async function(id, divisions, batches) {
	const assignment = await this.findById(id);
	if(!assignment) throw new Error("Assignment Not Found!");

	console.log(assignment);


	const teacher = await Teacher.findById(assignment.teacherId);
	if(!teacher) throw new Error("Teacher Not Found!");

	const course = await Course.findById(assignment.courseId);
	if(!course) throw new Error("Course Not Found!");

	assignment.divisions = divisions;
	assignment.batches = batches;

	course.reqLectLoad += assignment.lectureLoad;
	course.reqLabLoad += assignment.labLoad;
	course.reqTotalLoad += assignment.totalLoad;	

	assignment.lectureLoad = divisions * course.lectHrs;
	assignment.labLoad = batches * course.labHrs;
	await assignment.save();

	// this is so bad
	course.reqLectLoad -= assignment.lectureLoad;
	course.reqLabLoad -= assignment.labLoad;
	course.reqTotalLoad -= assignment.totalLoad;
	await course.save();

	// this looks very redundant
	teacher.assignedLoad = assignment.lectureLoad + assignment.labLoad;
	teacher.remainingLoad = teacher.loadLimit - teacher.assignedLoad;
	await teacher.save();

	return {
		assignment,
		teacher,
		course
	};
}

assignmentSchema.statics.deleteAssignment = async function (id) {
	const assignment = await this.findById(id);
	if (!assignment) throw new Error("Assignment Not Found!");

	const teacher = await Teacher.findById(assignment.teacherId);
	if (!teacher) throw new Error("Teacher Not Found!");

	const course = await Course.findById(assignment.courseId);
	if (!course) throw new Error("Course Not Found!");

	teacher.assignedLoad -= assignment.lectureLoad + assignment.labLoad;
	teacher.remainingLoad = teacher.loadLimit - teacher.assignedLoad;
	// teacher.assignments = teacher.assignments.filter(a => a.toString() !== id);
	teacher.assignments.pull(assignment._id);
	await teacher.save();

	// course.assignments = course.assignments.filter(a => a.toString() !== id);
	course.assignments.pull(assignment._id);
	course.reqLectLoad += assignment.lectureLoad;
	course.reqLabLoad += assignment.labLoad;
	course.reqTotalLoad += assignment.totalLoad;
	await course.save();

	await this.deleteOne({ _id: id });

	return {
		assignment,
		teacher,
		course
	};
}

assignmentSchema.statics.getAssignments = async function (teacherId) {
	const assignments = await this.find({ teacherId }).populate('courseId').populate('teacherId');
	return assignments;
}



module.exports = mongoose.model('Assignment', assignmentSchema);