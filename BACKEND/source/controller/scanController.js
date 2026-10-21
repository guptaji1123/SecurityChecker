const fs = require('fs')
const Scan = require('../model/scan.js')
const AppError = require('../utilities/AppError.js')
const safeExtract = require('../utilities/safeExtract.js')

const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04])
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/

const hasZipSignature = async (filePath) => {
    const handle = await fs.promises.open(filePath, 'r')
    try {
        const buffer = Buffer.alloc(4)
        const { bytesRead } = await handle.read(buffer, 0, 4, 0)
        return bytesRead === 4 && buffer.equals(ZIP_SIGNATURE)
    } finally {
        await handle.close()
    }
}

const removePath = (target) => fs.promises.rm(target, { recursive: true, force: true }).catch(() => { })

const createScan = async (request, response) => {
    if (!request.file) {
        throw new AppError('No file uploaded', 400, 'NO_FILE')
    }
    let scan = null
    let extractedDirectory = null
    try {
        if (!(await hasZipSignature(request.file.path))) {
            throw new AppError('File is not a valid ZIP archive', 400, 'INVALID_ZIP')
        }
        scan = await Scan.create({
            originalName: request.file.originalname,
            status: 'scanning',
        })
        const { directory, fileCount } = await safeExtract(request.file.path)
        extractedDirectory = directory
        scan.filesScanned = fileCount
        scan.status = 'completed'
        await scan.save()
    } catch (error) {
        if (scan) {
            scan.status = 'failed'
            await scan.save().catch(() => { })
        }
        throw error
    } finally {
        await removePath(request.file.path)
        if (extractedDirectory) await removePath(extractedDirectory)
    }
    response.status(201).json({ success: true, data: scan.toJSON() })
}

const getScan = async (request, response) => {
    const { id } = request.params
    if (!OBJECT_ID_PATTERN.test(id)) {
        throw new AppError('Scan not found', 404, 'SCAN_NOT_FOUND')
    }
    const scan = await Scan.findById(id)
    if (!scan) {
        throw new AppError('Scan not found', 404, 'SCAN_NOT_FOUND')
    }
    response.status(200).json({ success: true, data: scan.toJSON() })
}

module.exports = { createScan, getScan }