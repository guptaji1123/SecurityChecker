const mongoose = require('mongoose')

const SCAN_STATUSES = ['queued', 'scanning', 'completed', 'failed']

const scanSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: SCAN_STATUSES,
        default: 'queued'
    },
    filesScanned: {
        type: Number,
        default: 0,
        min: 0
    },
    counts: {
        critical: {
            type: Number,
            default: 0,
            min: 0
        },
        high: {
            type: Number,
            default: 0,
            min: 0
        },
        medium: {
            type: Number,
            default: 0,
            min: 0
        },
        low: {
            type: Number,
            default: 0,
            min: 0
        },
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (doc, ret) => {
            ret.id = ret._id.toString()
            delete ret._id
            delete ret.updatedAt
            return ret
        },
    },
})

const Scan = mongoose.model('Scan', scanSchema)

module.exports = Scan
module.exports.SCAN_STATUSES = SCAN_STATUSES