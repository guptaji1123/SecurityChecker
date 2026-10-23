const MIN_VALUE_LENGTH = 16
const MIN_ENTROPY = 3.5

const shannonEntropy = (text) => {
    if (!text) return 0
    const counts = new Map()
    for (const character of text) counts.set(character, (counts.get(character) || 0) + 1)
    const length = [...text].length
    let entropy = 0
    for (const count of counts.values()) {
        const probability = count / length
        entropy -= probability * Math.log2(probability)
    }
    return entropy
}

const PLACEHOLDER_WORDS = ['your', 'example', 'changeme', 'placeholder', 'xxxx', 'test']
const PLACEHOLDER_SHAPES = [/<[^>]*>/, /\$\{[^}]*\}/, /\{\{[^}]*\}\}/]
const ENVIRONMENT_READS = ['process.env', 'os.environ', 'import.meta.env']

const isPlaceholder = (value) => {
    const lower = value.toLowerCase()
    if (PLACEHOLDER_WORDS.some((word) => lower.includes(word))) return true
    return PLACEHOLDER_SHAPES.some((shape) => shape.test(value))
}

const readsFromEnvironment = (text) => {
    const lower = String(text || '').toLowerCase()
    return ENVIRONMENT_READS.some((marker) => lower.includes(marker))
}

const isSuspiciousValue = (value, line = '') => {
    if (value.length < MIN_VALUE_LENGTH) return false
    if (isPlaceholder(value)) return false
    if (readsFromEnvironment(value) || readsFromEnvironment(line)) return false
    if (value.includes('://')) return false
    if (!/[0-9]/.test(value) || !/[A-Za-z]/.test(value)) return false
    return shannonEntropy(value) >= MIN_ENTROPY
}

module.exports = {
    shannonEntropy,
    isPlaceholder,
    readsFromEnvironment,
    isSuspiciousValue,
    MIN_VALUE_LENGTH,
    MIN_ENTROPY,
}