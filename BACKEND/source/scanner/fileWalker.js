const fs = require('fs')
const path = require('path')

const MAX_FILE_SIZE = 1024 * 1024
const BINARY_SNIFF_BYTES = 8 * 1024

const SKIP_DIRECTORIES = new Set([
    'node_modules', '.git', 'dist', 'build', '.next',
    'vendor', 'coverage', '__pycache__', '.venv',
])

const SKIP_EXTENSIONS = new Set([
    // images
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg', '.tiff', '.psd',
    // fonts
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    // video / audio
    '.mp4', '.mov', '.avi', '.mkv', '.webm', '.mp3', '.wav', '.ogg', '.flac', '.aac',
    // archives
    '.zip', '.tar', '.gz', '.tgz', '.bz2', '.xz', '.7z', '.rar',
    // compiled / binary
    '.exe', '.dll', '.so', '.dylib', '.class', '.pyc', '.o', '.a', '.jar', '.bin',
    // documents, source maps, lock files by extension
    '.pdf', '.map', '.lock',
])

const SKIP_SUFFIXES = ['.min.js', '.min.css']

const SKIP_FILENAMES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'])

const SENSITIVE_FILENAMES = new Set([
    'id_rsa', 'id_dsa', 'id_ecdsa', 'id_ed25519',
    '.npmrc', '.pypirc', '.netrc', '.htpasswd', 'credentials',
    '.git-credentials', 'credentials.json', 'serviceaccountkey.json', 'terraform.tfstate',
])

const SENSITIVE_EXTENSIONS = new Set(['.pem', '.key', '.p12', '.pfx', '.jks', '.keystore'])

const isSensitiveName = (fileName) => {
    const name = fileName.toLowerCase()
    if (name === '.env' || name.startsWith('.env.')) return true
    if (SENSITIVE_FILENAMES.has(name)) return true
    return SENSITIVE_EXTENSIONS.has(path.extname(name))
}

const hasSkippedName = (fileName) => {
    const name = fileName.toLowerCase()
    if (SKIP_FILENAMES.has(name)) return true
    if (SKIP_SUFFIXES.some((suffix) => name.endsWith(suffix))) return true
    return SKIP_EXTENSIONS.has(path.extname(name))
}

const looksBinary = async (filePath) => {
    const handle = await fs.promises.open(filePath, 'r')
    try {
        const buffer = Buffer.alloc(BINARY_SNIFF_BYTES)
        const { bytesRead } = await handle.read(buffer, 0, BINARY_SNIFF_BYTES, 0)
        return buffer.subarray(0, bytesRead).includes(0)
    } finally {
        await handle.close()
    }
}

const toRelPath = (rootDirectory, absPath) =>
    path.relative(rootDirectory, absPath).split(path.sep).join('/')

const walkFiles = async (rootDirectory) => {
    const root = path.resolve(rootDirectory)
    const files = []
    const pending = [root]
    while (pending.length > 0) {
        const directory = pending.pop()
        let entries
        try {
            entries = await fs.promises.readdir(directory, { withFileTypes: true })
        } catch {
            continue
        }
        for (const entry of entries) {
            const absPath = path.join(directory, entry.name)
            if (entry.isSymbolicLink()) continue
            if (entry.isDirectory()) {
                if (!SKIP_DIRECTORIES.has(entry.name)) pending.push(absPath)
                continue
            }
            if (!entry.isFile()) continue
            let stats
            try {
                stats = await fs.promises.lstat(absPath)
            } catch {
                continue
            }
            if (!stats.isFile()) continue
            const result = { absPath, relPath: toRelPath(root, absPath), size: stats.size }
            if (isSensitiveName(entry.name)) {
                result.sensitiveCandidate = true
                files.push(result)
                continue
            }
            if (hasSkippedName(entry.name)) continue
            if (stats.size > MAX_FILE_SIZE) continue
            try {
                if (await looksBinary(absPath)) continue
            } catch {
                continue
            }
            files.push(result)
        }
    }
    return files.sort((a, b) => (a.relPath < b.relPath ? -1 : a.relPath > b.relPath ? 1 : 0))
}

module.exports = walkFiles
module.exports.MAX_FILE_SIZE = MAX_FILE_SIZE
module.exports.SKIP_DIRECTORIES = SKIP_DIRECTORIES