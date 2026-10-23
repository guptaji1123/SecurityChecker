import test from "node:test";
import assert from "node:assert/strict";
import {
  sortFindings,
  splitPath,
  hasRawSecret,
  redact,
  searchFindings,
  countByLevel,
  filterFindings,
  SEVERITIES,
} from "./findings.js";
import {
  mockFindings,
  cleanMockScan,
  manyMockScan,
  manyMockFindings,
} from "../api/mockData.js";

// Fake keys are built from pieces so this file never holds a full key-shaped string.
const FAKE_AWS = "AKIA" + "IOSFODNN7EXAMPLE";
const FAKE_STRIPE = "sk_live_" + "abcdefgh12345678";

test("sorts by severity, then file path, then line", () => {
  const sorted = sortFindings([
    { id: 1, severity: "low", filePath: "a.js", line: 1 },
    { id: 2, severity: "critical", filePath: "z.js", line: 9 },
    { id: 3, severity: "critical", filePath: "b.js", line: 5 },
    { id: 4, severity: "critical", filePath: "b.js", line: 2 },
    { id: 5, severity: "high", filePath: "a.js", line: 1 },
  ]);
  assert.deepEqual(sorted.map((f) => f.id), [4, 3, 2, 5, 1]);
});

test("sorting does not change the original array", () => {
  const input = [
    { id: 1, severity: "low", filePath: "a.js", line: 1 },
    { id: 2, severity: "critical", filePath: "a.js", line: 1 },
  ];
  sortFindings(input);
  assert.equal(input[0].id, 1);
});

test("unknown severities go last and missing input is safe", () => {
  const sorted = sortFindings([
    { id: 1, severity: "weird", filePath: "a.js" },
    { id: 2, severity: "low", filePath: "a.js" },
  ]);
  assert.equal(sorted[0].id, 2);
  assert.deepEqual(sortFindings(undefined), []);
});

test("splitPath keeps the file name apart from the folders", () => {
  assert.deepEqual(splitPath("src/config/aws.js"), {
    dir: "src/config/",
    name: "aws.js",
  });
  assert.deepEqual(splitPath("aws.js"), { dir: "", name: "aws.js" });
  assert.deepEqual(splitPath("src\\a\\b.js"), { dir: "src/a/", name: "b.js" });
});

test("hasRawSecret spots raw keys and ignores masked ones", () => {
  assert.equal(hasRawSecret(`const k = "${FAKE_AWS}"`), true);
  assert.equal(hasRawSecret(`key: ${FAKE_STRIPE}`), true);
  assert.equal(hasRawSecret('const k = "AKIA****************"'), false);
  assert.equal(hasRawSecret("sk_live_********"), false);
});

test("redact hides a raw secret and leaves masked text alone", () => {
  const out = redact(`const k = "${FAKE_AWS}"`);
  assert.equal(out.includes(FAKE_AWS), false);
  assert.ok(out.includes("AKIA****"));
  assert.equal(redact("sk_live_********"), "sk_live_********");
});

test("no mock finding contains a raw secret", () => {
  for (const f of mockFindings) {
    const shown = [f.maskedSnippet, f.explanation, f.fix].join(" ");
    assert.equal(hasRawSecret(shown), false, `raw secret in finding ${f.id}`);
  }
});

// ---- filters ----

test("search matches the file path or the type, ignoring case and spaces", () => {
  assert.deepEqual(searchFindings(mockFindings, "  AWS ").map((f) => f.id), ["f1"]);
  assert.deepEqual(
    searchFindings(mockFindings, "config").map((f) => f.id),
    ["f1", "f6"]
  );
  assert.deepEqual(
    searchFindings(mockFindings, "stripe").map((f) => f.id),
    ["f3"]
  );
});

test("an empty search keeps everything", () => {
  assert.equal(searchFindings(mockFindings, "").length, mockFindings.length);
  assert.equal(searchFindings(mockFindings, undefined).length, mockFindings.length);
});

test("countByLevel counts each severity", () => {
  assert.deepEqual(countByLevel(mockFindings), {
    critical: 2,
    high: 2,
    medium: 2,
    low: 1,
  });
  assert.deepEqual(countByLevel(undefined), {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
});

test("with every chip on, nothing is hidden by severity", () => {
  const out = filterFindings(mockFindings, { levels: SEVERITIES, query: "" });
  assert.equal(out.length, mockFindings.length);
});

test("severity chips hide the levels that are switched off", () => {
  const out = filterFindings(mockFindings, { levels: ["critical", "low"] });
  assert.deepEqual(out.map((f) => f.id).sort(), ["f1", "f2", "f7"]);
});

test("search and chips combine (both must match)", () => {
  const out = filterFindings(mockFindings, {
    levels: ["critical", "high"],
    query: "config",
  });
  assert.deepEqual(out.map((f) => f.id), ["f1"]);
});

test("all chips off, or no match, gives an empty list", () => {
  assert.equal(filterFindings(mockFindings, { levels: [] }).length, 0);
  assert.equal(filterFindings(mockFindings, { query: "zzz-not-here" }).length, 0);
});

// ---- mock cases used to test the results page ----

test("the clean mock scan has zero findings counted", () => {
  const total = Object.values(cleanMockScan.counts).reduce((a, b) => a + b, 0);
  assert.equal(total, 0);
});

test("the many mock scan is cut at 500 even though more were found", () => {
  const total = Object.values(manyMockScan.counts).reduce((a, b) => a + b, 0);
  assert.equal(manyMockFindings.length, 500);
  assert.ok(total > 500);
});

test("no finding in the many mock contains a raw secret", () => {
  for (const f of manyMockFindings) {
    assert.equal(hasRawSecret(f.maskedSnippet), false);
  }
});