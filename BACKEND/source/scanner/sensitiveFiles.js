const CONTENTS_HIDDEN = '(file contents hidden)'

const ENV_EXAMPLE_SUFFIXES = ['.example', '.sample', '.template']
const PRIVATE_KEY_NAMES = new Set(['id_rsa', 'id_dsa', 'id_ecdsa', 'id_ed25519'])
const PRIVATE_KEY_EXTENSIONS = ['.pem', '.key', '.p12', '.pfx']
const CREDENTIAL_CONFIG_NAMES = new Set(['.npmrc', '.pypirc', '.git-credentials', '.htpasswd'])
const CLOUD_CREDENTIAL_NAMES = new Set(['credentials.json', 'serviceaccountkey.json', 'terraform.tfstate'])

const checks = [
    {
        ruleId: 'sensitive-env-file',
        type: 'Committed .env file',
        severity: 'high',
        matches: (name) => {
            const isEnv = name === '.env' || name.startsWith('.env.')
            return isEnv && !ENV_EXAMPLE_SUFFIXES.some((suffix) => name.endsWith(suffix))
        },
        explanation: 'An .env file is included in the project. These files usually hold passwords and keys and should never be shared.',
        fix: 'Remove the file from the project and add .env to .gitignore. Rotate any secret that was inside it.',
    },
    {
        ruleId: 'sensitive-private-key-file',
        type: 'Private key or certificate file',
        severity: 'critical',
        matches: (name) =>
            PRIVATE_KEY_NAMES.has(name) || PRIVATE_KEY_EXTENSIONS.some((extension) => name.endsWith(extension)),
        explanation: 'A key or certificate file is included in the project. If it holds a private key, anyone with it can impersonate you or your server.',
        fix: 'Remove the file from the project and replace the key with a new one. Keep keys in a secrets manager, not in the code.',
    },
    {
        ruleId: 'sensitive-credentials-file',
        type: 'Credentials config file',
        severity: 'high',
        matches: (name) => CREDENTIAL_CONFIG_NAMES.has(name),
        explanation: 'A configuration file that usually stores login tokens or passwords is included in the project.',
        fix: 'Remove the file from the project, add it to .gitignore, and rotate any token or password it contained.',
    },
    {
        ruleId: 'sensitive-cloud-credentials-file',
        type: 'Cloud credentials or state file',
        severity: 'high',
        matches: (name) => CLOUD_CREDENTIAL_NAMES.has(name),
        explanation: 'A cloud credentials or infrastructure state file is included in the project. These often contain keys and passwords in plain text.',
        fix: 'Remove the file from the project, add it to .gitignore, and rotate the keys it contained.',
    },
]

const baseName = (filePath) => String(filePath).split(/[\\/]/).pop().toLowerCase()

const checkSensitiveFile = (relPath) => {
    const name = baseName(relPath)
    const check = checks.find((item) => item.matches(name))
    if (!check) return null
    return {
        ruleId: check.ruleId,
        type: check.type,
        severity: check.severity,
        filePath: String(relPath).replace(/\\/g, '/'),
        line: 1,
        maskedSnippet: CONTENTS_HIDDEN,
        explanation: check.explanation,
        fix: check.fix,
    }
}

const findSensitiveFiles = (files) => {
    const findings = []
    for (const file of files || []) {
        const finding = checkSensitiveFile(file.relPath)
        if (finding) findings.push(finding)
    }
    return findings
}

module.exports = { checkSensitiveFile, findSensitiveFiles, CONTENTS_HIDDEN }