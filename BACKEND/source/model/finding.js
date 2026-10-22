const mongoose = require('mongoose')

const SEVERITIES = ['critical', 'high', 'medium', 'low']

const findingSchema = new mongoose.Schema({
    scanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scan',
        required: true,
        index: true
    },
    ruleId: {
        type: String,
        required: true,
        index: true
    },
    filePath: {
        type: String,
        required: true
    },
    line: {
        type: Number,
        required: true,
        min: 1
    },
    type: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: SEVERITIES,
        required: true
    },
    maskedSnippet: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        required: true
    },
    fix: {
        type: String,
        required: true
    },
}, {
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (doc, ret) => {
            ret.id = ret._id.toString()
            delete ret._id
            return ret
        },
    },
})

const Finding = mongoose.model('Finding', findingSchema)

module.exports = Finding
module.exports.SEVERITIES = SEVERITIES