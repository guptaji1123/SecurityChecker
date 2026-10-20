const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const routes = require('./routes')
const express = require('express')
const notFound = require('./middleware/notFound.js')
const errorHandler = require('./middleware/errorHandler.js')

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

app.use(routes)

app.use(notFound)
app.use(errorHandler)

module.exports = app