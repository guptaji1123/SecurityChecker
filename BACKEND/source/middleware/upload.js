const fs = require('fs')
const os = require('os')
const path = require('path')
const multer = require('multer')
const crypto = require('crypto')
const AppError = require('../utilities/AppError.js')

const UPLOAD_DIR = path.join(os.tmpdir(), 'securitychecker')
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || 50

fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o700 })

const storage = multer.diskStorage({
    destination: (request, file, callback) => callback(null, UPLOAD_DIR),
    filename: (request, file, callback) => callback(null, `${crypto.randomUUID()}.zip`),
})

const fileFilter = (request, file, callback) => {
    if (path.extname(file.originalname).toLowerCase() !== '.zip') {
        return callback(new AppError('Only .zip files are allowed', 400, 'INVALID_ZIP'))
    }
    callback(null, true)
}

const upload = multer({
    storage, fileFilter,
    limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 }
})

module.exports = upload
module.exports.UPLOAD_DIR = UPLOAD_DIR