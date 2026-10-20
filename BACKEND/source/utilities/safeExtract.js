const fs = require('fs')
const os = require('os')
const path = require('path')
const yauzl = require('yauzl')
const crypto = require('crypto')
const { Transform } = require('stream')
const AppError = require('./AppError.js')
const { pipeline } = require('stream/promises')

const EXTRACT_ROOT = path.join(os.tmpdir(), 'securitychecker-extracted')

const LIMITS = {
    maxFiles: 5000,
    maxTotalBytes: 200 * 1024 * 1024,
    maxDepth: 15,
    maxEntries: 20000,
}

const S_IFMT = 0o170000
const S_IFREG = 0o100000

const unsafe = (message) => new AppError(message, 400, 'ZIP_UNSAFE_PATH')
const tooLarge = () => new AppError('ZIP contents are too large', 413, 'ZIP_TOO_LARGE')

const openZip = (zipPath) =>
    new Promise((resolve, reject) => {
        yauzl.open(
            zipPath,
            { lazyEntries: true, autoClose: true, decodeStrings: true, validateEntrySizes: false },
            (error, zipfile) => (error ? reject(error) : resolve(zipfile))
        )
    })

const mapZipError = (error) => {
    if (error instanceof AppError) {
        return error
    }
    if (/invalid relative path|absolute path|invalid characters in fileName/i.test(error.message)) {
        return unsafe('ZIP contains an unsafe file path')
    }
    return new AppError('File is not a valid ZIP archive', 400, 'INVALID_ZIP')
}

const checkEntryName = (fileName, destination) => {
    if (fileName.includes('\0') || fileName.includes('\\')) {
        throw unsafe('ZIP contains an unsafe file path')
    }
    if (path.isAbsolute(fileName) || /^[a-zA-Z]:/.test(fileName)) {
        throw unsafe('ZIP contains an absolute path')
    }
    const segments = fileName.split('/').filter((segment) => segment !== '' && segment !== '.')
    if (segments.includes('..')) {
        throw unsafe('ZIP contains a path traversal entry')
    }
    const target = path.resolve(destination, ...segments)
    const relative = path.relative(destination, target)
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw unsafe('ZIP entry resolves outside the extraction folder')
    }
    return { segments, target }
}

const isJunk = (segments) =>
    segments[0] === '__MACOSX' || segments[segments.length - 1] === '.DS_Store'

const safeExtract = async (zipPath, limits = {}) => {
    const max = { ...LIMITS, ...limits }
    await fs.promises.mkdir(EXTRACT_ROOT, { recursive: true, mode: 0o700 })
    const destination = path.join(EXTRACT_ROOT, crypto.randomUUID())
    await fs.promises.mkdir(destination, { mode: 0o700 })
    let fileCount = 0
    let totalBytes = 0
    let declaredBytes = 0
    const extractEntry = async (zipfile, entry) => {
        const isDirectory = entry.fileName.endsWith('/')
        const { segments, target } = checkEntryName(entry.fileName, destination)
        if (isJunk(segments) || segments.length === 0) return
        const depth = isDirectory ? segments.length : segments.length - 1
        if (depth > max.maxDepth) {
            throw new AppError('ZIP folders are nested too deeply', 400, 'ZIP_TOO_DEEP')
        }
        if (isDirectory) return
        const mode = (entry.externalFileAttributes >>> 16) & 0xffff
        const type = mode & S_IFMT
        if (type !== 0 && type !== S_IFREG) return
        fileCount += 1
        if (fileCount > max.maxFiles) {
            throw new AppError('ZIP contains too many files', 400, 'ZIP_TOO_MANY_FILES')
        }
        declaredBytes += entry.uncompressedSize
        if (declaredBytes > max.maxTotalBytes) throw tooLarge()
        await fs.promises.mkdir(path.dirname(target), { recursive: true, mode: 0o700 })
        const readStream = await new Promise((resolve, reject) => {
            zipfile.openReadStream(entry, (error, stream) => (error ? reject(error) : resolve(stream)))
        })
        const counter = new Transform({
            transform(chunk, encoding, callback) {
                totalBytes += chunk.length
                if (totalBytes > max.maxTotalBytes) return callback(tooLarge())
                callback(null, chunk)
            },
        })
        try {
            await pipeline(
                readStream,
                counter,
                fs.createWriteStream(target, { flags: 'wx', mode: 0o600 })
            )
        } catch (error) {
            if (error.code === 'EEXIST') throw unsafe('ZIP contains duplicate file entries')
            throw error
        }
    }
    try {
        const zipfile = await openZip(zipPath)
        if (zipfile.entryCount > max.maxEntries) {
            zipfile.close()
            throw new AppError('ZIP contains too many files', 400, 'ZIP_TOO_MANY_FILES')
        }
        await new Promise((resolve, reject) => {
            const fail = (error) => {
                zipfile.close()
                reject(error)
            }
            zipfile.on('error', fail)
            zipfile.on('end', resolve)
            zipfile.on('entry', (entry) => {
                extractEntry(zipfile, entry)
                    .then(() => zipfile.readEntry())
                    .catch(fail)
            })
            zipfile.readEntry()
        })
        return { directory: destination, fileCount, totalBytes }
    } catch (error) {
        await fs.promises.rm(destination, { recursive: true, force: true })
        throw mapZipError(error)
    }
}

module.exports = safeExtract
module.exports.LIMITS = LIMITS
module.exports.EXTRACT_ROOT = EXTRACT_ROOT