const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teacherSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: String,
        required: true
    },
    loadLimit: {
        type: Number,
        required: true,
    },
    assignedLoad: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    assignments: {
        type: [Schema.Types.ObjectId],
        ref: 'Assignment',
        default: []
    },
    remainingLoad: {
        type: Number,
        default: function() {
            return this.loadLimit - this.assignedLoad;
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);