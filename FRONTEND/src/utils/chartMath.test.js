import test from "node:test";
import assert from "node:assert/strict";
import { buildSegments, describeCounts } from "./chartMath.js";

const C = 100;

test("all zero counts give no segments and total 0", () => {
  const { total, segments } = buildSegments(
    { critical: 0, high: 0, medium: 0, low: 0 },
    C
  );
  assert.equal(total, 0);
  assert.deepEqual(segments, []);
});

test("missing or invalid counts are treated as zero", () => {
  assert.equal(buildSegments(undefined, C).total, 0);
  assert.equal(buildSegments({ critical: -3, high: "x", low: NaN }, C).total, 0);
});

test("segment lengths add up to the full circle", () => {
  const { segments } = buildSegments(
    { critical: 2, high: 2, medium: 2, low: 1 },
    C
  );
  const sum = segments.reduce((s, seg) => s + seg.length, 0);
  assert.ok(Math.abs(sum - C) < 1e-9);
});

test("segments follow severity order and start where the last one ended", () => {
  const { segments } = buildSegments(
    { critical: 2, high: 2, medium: 2, low: 1 },
    C
  );
  assert.deepEqual(
    segments.map((s) => s.level),
    ["critical", "high", "medium", "low"]
  );
  assert.equal(segments[0].offset, 0);
  assert.ok(Math.abs(segments[1].offset - segments[0].length) < 1e-9);
});

test("levels with zero are left out", () => {
  const { segments } = buildSegments(
    { critical: 0, high: 3, medium: 0, low: 1 },
    C
  );
  assert.deepEqual(
    segments.map((s) => s.level),
    ["high", "low"]
  );
  assert.equal(segments[0].percent, 75);
});

test("one level only fills the whole circle", () => {
  const { segments } = buildSegments({ low: 5 }, C);
  assert.equal(segments.length, 1);
  assert.equal(segments[0].length, C);
});

test("describeCounts reads the numbers out", () => {
  assert.equal(
    describeCounts({ critical: 2, high: 2, medium: 2, low: 1 }),
    "Findings by severity: 2 critical, 2 high, 2 medium, 1 low. 7 in total."
  );
  assert.equal(
    describeCounts({ critical: 0, high: 0, medium: 0, low: 0 }),
    "Findings by severity: no findings were detected."
  );
});