const express = require('express')
const scanRoutes = require('./scanRoutes.js')
const healthController = require('../controller/health.js')

const router = express.Router()

router.get('/api/health', healthController.health)
router.use('/api/scans', scanRoutes)

module.exports = router