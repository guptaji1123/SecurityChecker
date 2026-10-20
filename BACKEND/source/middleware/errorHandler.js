const multer = require('multer')
const AppError = require('../utilities/AppError.js')

const isProduction = () => process.env.NODE_ENV === 'production'

const normalizeError = (err) => {
    if (err instanceof AppError) {
        return err
    }
    if (err && err.name === 'ValidationError' && err.errors) {
        const details = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message
        }))
        return new AppError('Validation failed', 400, 'VALIDATION_ERROR', details)
    }
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return new AppError('Uploaded file is too large', 413, 'FILE_TOO_LARGE')
        }
        return new AppError(err.message, 400, 'UPLOAD_ERROR')
    }
    const status = err && (err.statusCode || err.status)
    if (status >= 400 && status < 500) {
        const code = err.type === 'entity.too.large' ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST'
        return new AppError(
            err.type === 'entity.parse.failed' ? 'Invalid JSON body' : 'Bad request',
            status, code
        )
    }
    const unknown = new AppError('Something went wrong', 500, 'INTERNAL_ERROR')
    unknown.isOperational = false
    return unknown
}

const errorHandler = (err, request, response, next) => {
    const error = normalizeError(err)
    if (error.statusCode >= 500) {
        console.error(err)
    }
    const body = {
        success: false,
        error: {
            code: error.code,
            message: error.message,
        },
    }
    if (error.details) {
        body.error.details = error.details
    }
    if (!isProduction() && error.statusCode >= 500 && err && err.stack) {
        body.error.stack = err.stack
    }
    response.status(error.statusCode).json(body)
}

module.exports = errorHandler