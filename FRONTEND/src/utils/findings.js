// Pure helpers for the findings table (no React, so they are easy to test).

export const SEVERITIES = ["critical", "high", "medium", "low"];
const ORDER = SEVERITIES;

// Default order: severity first (critical on top), then file path, then line.
export function sortFindings(findings) {
  const rank = (level) => {
    const i = ORDER.indexOf(level);
    return i === -1 ? ORDER.length : i;
  };
  return [...(findings ?? [])].sort(
    (a, b) =>
      rank(a.severity) - rank(b.severity) ||
      String(a.filePath ?? "").localeCompare(String(b.filePath ?? "")) ||
      (a.line ?? 0) - (b.line ?? 0)
  );
}

// "src/config/aws.js" -> { dir: "src/config/", name: "aws.js" }
// The table truncates the folder part and always keeps the file name visible.
export function splitPath(path) {
  const text = String(path ?? "").replace(/\\/g, "/");
  const i = text.lastIndexOf("/");
  return { dir: text.slice(0, i + 1), name: text.slice(i + 1) };
}

// Shapes of real, unmasked secrets. Used as a safety net before anything is shown.
const RAW_SECRET_PATTERNS = [
  /AKIA[0-9A-Z]{16}/g, // AWS access key id
  /sk_(?:live|test)_[0-9a-zA-Z]{8,}/g, // Stripe secret key
  /gh[pousr]_[0-9a-zA-Z]{20,}/g, // GitHub token
];

export function hasRawSecret(text) {
  return RAW_SECRET_PATTERNS.some((re) => {
    re.lastIndex = 0;
    return re.test(String(text ?? ""));
  });
}

// Keeps the first 4 characters and hides the rest, if a raw secret slips through.
export function redact(text) {
  return RAW_SECRET_PATTERNS.reduce(
    (out, re) =>
      out.replace(re, (m) => m.slice(0, 4) + "*".repeat(Math.max(m.length - 4, 4))),
    String(text ?? "")
  );
}

// Keeps findings whose file path or type contains the search text (ignores case).
export function searchFindings(findings, query) {
  const q = String(query ?? "").trim().toLowerCase();
  const list = findings ?? [];
  if (!q) return list;
  return list.filter(
    (f) =>
      String(f.filePath ?? "").toLowerCase().includes(q) ||
      String(f.type ?? "").toLowerCase().includes(q)
  );
}

// How many findings each severity has, e.g. { critical: 2, high: 0, ... }
export function countByLevel(findings) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings ?? []) {
    if (f.severity in counts) counts[f.severity] += 1;
  }
  return counts;
}

// Search AND severity chips together. `levels` is the list of chips that are on.
// When every chip is on, the severity filter is off (nothing is hidden by it).
export function filterFindings(findings, { levels = SEVERITIES, query = "" } = {}) {
  const allOn = SEVERITIES.every((level) => levels.includes(level));
  return searchFindings(findings, query).filter(
    (f) => allOn || levels.includes(f.severity)
  );
}