const fs = require('fs')
const AppError = require('../utilities/AppError.js')
const walkFiles = require('./fileWalker.js')
const scanFile = require('./scanFile.js')
const rules = require('./rules/index.js')
const { buildSnippet, calculateCounts } = require('./mask.js')
const { findSensitiveFiles } = require('./sensitiveFiles.js')

const MAX_FINDINGS = 500
const TIME_LIMIT_MS = 60 * 1000
const LINE_BREAK = /\r\n|\r|\n/
const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 }
const GENERIC_RULE_ID = 'generic-secret'

const rulesById = new Map(rules.map((rule, index) => [rule.id, { rule, index }]))

const compareFindings = (a, b) => {
    const bySeverity = (SEVERITY_RANK[a.severity] ?? 99) - (SEVERITY_RANK[b.severity] ?? 99)
    if (bySeverity !== 0) return bySeverity
    if (a.filePath !== b.filePath) return a.filePath < b.filePath ? -1 : 1
    if (a.line !== b.line) return a.line - b.line
    return a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : 0
}

const overlaps = (a, b) => a.includes(b) || b.includes(a)

const score = (candidate) => {
    const { rule, index } = rulesById.get(candidate.finding.ruleId)
    return [
        rule.id === GENERIC_RULE_ID ? 0 : 1,
        4 - (SEVERITY_RANK[rule.severity] ?? 4),
        candidate.matchedValue.length,
        -index,
    ]
}

const compareScores = (a, b) => {
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return b[i] - a[i]
    return 0
}

const dedupeLine = (candidates) => {
    const ranked = [...candidates].sort((a, b) => compareScores(score(a), score(b)))
    const kept = []
    for (const candidate of ranked) {
        if (!kept.some((other) => overlaps(other.matchedValue, candidate.matchedValue))) kept.push(candidate)
    }
    return kept
}

const buildContentFindings = async (file) => {
    const matches = await scanFile(file.absPath)
    if (matches.length === 0) return []
    const lines = (await fs.promises.readFile(file.absPath, 'utf8')).split(LINE_BREAK)
    const byLine = new Map()
    for (const match of matches) {
        const { rule } = rulesById.get(match.ruleId)
        const candidate = {
            matchedValue: match.matchedValue,
            finding: {
                ruleId: rule.id,
                type: rule.name,
                severity: rule.severity,
                filePath: file.relPath,
                line: match.line,
                maskedSnippet: buildSnippet(lines[match.line - 1], match.matchedValue),
                explanation: rule.explanation,
                fix: rule.fix,
            },
        }
        if (!byLine.has(match.line)) byLine.set(match.line, [])
        byLine.get(match.line).push(candidate)
    }
    const findings = []
    for (const candidates of byLine.values()) {
        for (const kept of dedupeLine(candidates)) findings.push(kept.finding)
    }
    return findings
}

const scanDirectory = async (directory, { timeLimitMs = TIME_LIMIT_MS } = {}) => {
    const deadline = Date.now() + timeLimitMs
    const checkTime = () => {
        if (Date.now() > deadline) throw new AppError('Scan took too long', 408, 'SCAN_TIMEOUT')
    }
    const files = await walkFiles(directory)
    checkTime()
    const findings = findSensitiveFiles(files)
    for (const file of files) {
        checkTime()
        findings.push(...(await buildContentFindings(file)))
    }
    checkTime()
    findings.sort(compareFindings)
    return {
        findings: findings.slice(0, MAX_FINDINGS),
        total: findings.length,
        truncated: findings.length > MAX_FINDINGS,
        counts: calculateCounts(findings),
        filesScanned: files.length,
    }
}

module.exports = scanDirectory
module.exports.compareFindings = compareFindings
module.exports.MAX_FINDINGS = MAX_FINDINGS
module.exports.TIME_LIMIT_MS = TIME_LIMIT_MS