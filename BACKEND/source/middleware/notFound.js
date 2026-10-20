const AppError = require('../utilities/AppError.js')

const notFound = (request, response, next) => {
    next(new AppError('Route not found', 404, 'NOT_FOUND'))
}

module.exports = notFound