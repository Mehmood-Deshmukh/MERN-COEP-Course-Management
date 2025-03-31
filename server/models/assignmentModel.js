const mongoose = require('mongoose');
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

assignmentSchema.virtual('totalLoad').get(function() {
  return this.lectureLoad + this.labLoad;
});


module.exports = mongoose.model('Assignment', assignmentSchema);