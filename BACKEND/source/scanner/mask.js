const defaultRules = require('./rules/index.js')

const SEVERITIES = ['critical', 'high', 'medium', 'low']

const MAX_PREFIX = 4
const MAX_STARS = 16
const MIN_LENGTH_TO_SHOW_PREFIX = 8
const SNIPPET_LENGTH = 120

const maskSecret = (value) => {
    const text = String(value ?? '')
    if (text.length < MIN_LENGTH_TO_SHOW_PREFIX) return '*'.repeat(text.length)
    const prefixLength = Math.min(MAX_PREFIX, Math.floor(text.length / 4))
    const stars = Math.min(text.length - prefixLength, MAX_STARS)
    return text.slice(0, prefixLength) + '*'.repeat(stars)
}

const secretsOnLine = (line, rules) => {
    const found = []
    for (const rule of rules) {
        try {
            for (const match of line.matchAll(rule.pattern)) {
                const value = match.groups && match.groups.secret !== undefined ? match.groups.secret : match[0]
                if (value) found.push(value)
            }
        } catch {
        }
    }
    return found
}

const buildSnippet = (line, matchedValue, rules = defaultRules) => {
    const text = String(line ?? '').trim()
    const secrets = new Set(secretsOnLine(text, rules))
    if (matchedValue) secrets.add(matchedValue)
    const ranges = []
    for (const secret of secrets) {
        let from = 0
        while (from <= text.length) {
            const start = text.indexOf(secret, from)
            if (start === -1) break
            ranges.push({ start, end: start + secret.length, primary: secret === matchedValue })
            from = start + 1
        }
    }
    ranges.sort((a, b) => a.start - b.start || b.end - a.end)
    const merged = []
    for (const range of ranges) {
        const last = merged[merged.length - 1]
        if (last && range.start < last.end) {
            last.end = Math.max(last.end, range.end)
            last.primary = last.primary || range.primary
        } else {
            merged.push({ ...range })
        }
    }
    let masked = ''
    let cursor = 0
    let focusStart = 0
    let focusEnd = 0
    let focusSet = false
    for (const range of merged) {
        masked += text.slice(cursor, range.start)
        const replacement = maskSecret(text.slice(range.start, range.end))
        if (range.primary && !focusSet) {
            focusStart = masked.length
            focusEnd = masked.length + replacement.length
            focusSet = true
        }
        masked += replacement
        cursor = range.end
    }
    masked += text.slice(cursor)
    if (masked.length <= SNIPPET_LENGTH) return masked
    const room = Math.max(SNIPPET_LENGTH - (focusEnd - focusStart), 0)
    let start = Math.max(0, focusStart - Math.floor(room / 2))
    let end = Math.min(masked.length, start + SNIPPET_LENGTH)
    start = Math.max(0, end - SNIPPET_LENGTH)
    return (start > 0 ? '…' : '') + masked.slice(start, end) + (end < masked.length ? '…' : '')
}

const calculateCounts = (findings) => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 }
    for (const finding of findings || []) {
        if (SEVERITIES.includes(finding.severity)) counts[finding.severity] += 1
    }
    return counts
}

module.exports = { maskSecret, buildSnippet, calculateCounts }