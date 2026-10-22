// A completed scan, in the same shape the real API returns.
// Findings are NOT inside the scan: they come from getFindings(id).
export const mockScan = {
  id: "64b64b64b64b64b64b64b64b",
  originalName: "my-project.zip",
  status: "completed",
  filesScanned: 42,
  counts: { critical: 2, high: 2, medium: 2, low: 1 },
  createdAt: "2026-10-20T10:00:00.000Z",
};

export const mockFindings = [
  {
    id: "f1", ruleId: "aws-access-key", filePath: "src/config/aws.js", line: 12,
    type: "AWS Access Key", severity: "critical",
    maskedSnippet: 'const key = "AKIA****************"',
    explanation: "An AWS access key is written directly in the code.",
    fix: "Remove the key, rotate it in the AWS console, and load it from an environment variable.",
  },
  {
    id: "f2", ruleId: "db-password", filePath: "server/db.js", line: 5,
    type: "Database Password", severity: "critical",
    maskedSnippet: 'password: "********"',
    explanation: "A database password is stored in plain text.",
    fix: "Move the password to a .env file and add .env to .gitignore.",
  },
  {
    id: "f3", ruleId: "stripe-secret-key", filePath: "src/payments.js", line: 30,
    type: "Stripe Secret Key", severity: "high",
    maskedSnippet: 'const stripe = "sk_live_********"',
    explanation: "A live Stripe secret key is exposed.",
    fix: "Revoke the key in the Stripe dashboard and create a new one stored safely.",
  },
  {
    id: "f4", ruleId: "github-token", filePath: "src/auth/github.js", line: 8,
    type: "GitHub Token", severity: "high",
    maskedSnippet: 'token: "ghp_********"',
    explanation: "A GitHub personal access token is hard-coded.",
    fix: "Revoke the token on GitHub and store a new one in an environment variable.",
  },
  {
    id: "f5", ruleId: "jwt-secret", filePath: "src/utils/session.js", line: 21,
    type: "Hard-coded JWT Secret", severity: "medium",
    maskedSnippet: 'const secret = "********"',
    explanation: "A JWT signing secret is stored in code.",
    fix: "Generate a new secret and load it from an environment variable.",
  },
  {
    id: "f6", ruleId: "generic-api-key", filePath: "config/app.json", line: 3,
    type: "Generic API Key", severity: "medium",
    maskedSnippet: '"apiKey": "********"',
    explanation: "A random-looking value is assigned to a key named apiKey.",
    fix: "Confirm what it is. If it is a real key, rotate it and move it to environment variables.",
  },
  {
    id: "f7", ruleId: "committed-env-file", filePath: ".env", line: 1,
    type: "Committed .env File", severity: "low",
    maskedSnippet: "(file contents hidden)",
    explanation: "An .env file is included in the upload.",
    fix: "Remove the file from the project and add .env to .gitignore.",
  },
];