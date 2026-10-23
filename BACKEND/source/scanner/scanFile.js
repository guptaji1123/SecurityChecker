const fs = require('fs')
const defaultRules = require('./rules/index.js')
const { MAX_FILE_SIZE } = require('./fileWalker.js')

const MAX_LINE_LENGTH = 2000
const LINE_BREAK = /\r\n|\r|\n/

const toKeywordList = (keywords) => {
    if (!keywords) return []
    return (Array.isArray(keywords) ? keywords : [keywords]).map((word) => word.toLowerCase())
}

const scanFile = async (absPath, rules = defaultRules) => {
    try {
        const stats = await fs.promises.stat(absPath)
        if (!stats.isFile() || stats.size > MAX_FILE_SIZE) return []
        const text = await fs.promises.readFile(absPath, 'utf8')
        const lines = text.split(LINE_BREAK)
        const matches = []
        const prepared = rules.map((rule) => ({ rule, keywords: toKeywordList(rule.keywords) }))
        for (let index = 0; index < lines.length; index += 1) {
            const line = lines[index]
            if (line.length === 0 || line.length > MAX_LINE_LENGTH) continue
            const lowerLine = line.toLowerCase()
            for (const { rule, keywords } of prepared) {
                if (keywords.length > 0 && !keywords.some((word) => lowerLine.includes(word))) {
                    continue
                }
                for (const match of line.matchAll(rule.pattern)) {
                    const matchedValue = match.groups && match.groups.secret !== undefined ? match.groups.secret : match[0]
                    if (rule.validate && !rule.validate(matchedValue, match, line)) continue
                    matches.push({ ruleId: rule.id, line: index + 1, matchedValue })
                }
            }
        }
        return matches
    } catch {
        return []
    }
}

module.exports = scanFile
module.exports.MAX_LINE_LENGTH = MAX_LINE_LENGTH