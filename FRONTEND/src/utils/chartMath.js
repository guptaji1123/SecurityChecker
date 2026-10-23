// Pure helpers for the severity chart (no React, so they are easy to test).

export const LEVELS = ["critical", "high", "medium", "low"];

// Turns bad input (missing, negative, text) into a safe whole number >= 0.
function clean(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

// Works out the donut pieces. `circumference` is the length of the full circle.
// Levels with a count of 0 get no piece, and all zeros gives no pieces at all.
export function buildSegments(counts, circumference) {
  const values = LEVELS.map((level) => clean(counts?.[level]));
  const total = values.reduce((sum, n) => sum + n, 0);
  if (total === 0) return { total: 0, segments: [] };

  let offset = 0;
  const segments = [];
  LEVELS.forEach((level, i) => {
    const count = values[i];
    if (count === 0) return;
    const length = (count / total) * circumference;
    segments.push({
      level,
      count,
      percent: Math.round((count / total) * 100),
      length,
      offset,
    });
    offset += length;
  });
  return { total, segments };
}

// The sentence a screen reader reads for the whole chart.
export function describeCounts(counts) {
  const values = LEVELS.map((level) => clean(counts?.[level]));
  const total = values.reduce((sum, n) => sum + n, 0);
  if (total === 0) return "Findings by severity: no findings were detected.";
  const parts = LEVELS.map((level, i) => `${values[i]} ${level}`).join(", ");
  return `Findings by severity: ${parts}. ${total} in total.`;
}