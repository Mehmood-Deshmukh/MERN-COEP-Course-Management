const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseSchema = new Schema({
    subject: {
        type: String,
        required: true,
        trim: true
    },
    curriculum: {
        type: String,
        required: true,
        trim: true
    },
    sem: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true,
        enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'MTech 1st Year', 'MTech 2nd Year']
    },
    lectHrs: {
        type: Number,
        required: true,
        default: 0
    },
    labHrs: {
        type: Number,
        required: true,
        default: 0
    },
    tutHrs: {
        type: Number,
        default: 0
    },
    credits: {
        type: Number,
        required: true,
        default: 0
    },
    divisions: {
        type: Number,
        required: true,
        default: 1
    },
    batches: {
        type: Number,
        required: true,
        default: 1
    },
    reqLectLoad: {
        type: Number,
        default: function() {
            return this.divisions * this.lectHrs;
        }
    },
    reqLabLoad: {
        type: Number,
        default: function() {
            return this.batches * this.labHrs;
        }
    },
    reqTotalLoad: {
        type: Number,
        default: function() {
            return this.reqLectLoad + this.reqLabLoad;
        }
    },
    assignments: [{
        type: Schema.Types.ObjectId,
        ref: 'Assignment',
        default: []
    }],
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);