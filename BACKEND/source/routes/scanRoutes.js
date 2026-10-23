const express = require('express')
const upload = require('../middleware/upload.js')
const scanController = require('../controller/scanController.js')

const router = express.Router()

router.post('/', upload.single('file'), scanController.createScan)
router.get('/:id', scanController.getScan)
router.get('/:id/findings', scanController.getFindings)

module.exports = router