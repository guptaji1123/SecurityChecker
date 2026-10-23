import { useState } from "react";
import Card from "../ui/Card";
import { LEVELS, buildSegments, describeCounts } from "../../utils/chartMath";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Full class names are written out so Tailwind can find them.
const STROKE = {
  critical: "stroke-critical",
  high: "stroke-high",
  medium: "stroke-medium",
  low: "stroke-low",
};
const DOT = {
  critical: "bg-critical",
  high: "bg-high",
  medium: "bg-medium",
  low: "bg-low",
};

export default function SeverityChart({ counts }) {
  const [hovered, setHovered] = useState(null);
  const { total, segments } = buildSegments(counts, CIRCUMFERENCE);
  const active = segments.find((s) => s.level === hovered);

  return (
    <Card className="flex flex-col items-center">
      <p className="self-start text-sm text-muted">Findings by severity</p>

      <div className="relative mt-3 h-40 w-40">
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={describeCounts(counts)}
          className="h-full w-full -rotate-90"
        >
          {/* grey ring: this is all you see when every count is zero */}
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="14"
            className="stroke-canvas"
          />
          {segments.map((s) => (
            <circle
              key={s.level}
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              strokeWidth="14"
              strokeDasharray={`${s.length} ${CIRCUMFERENCE - s.length}`}
              strokeDashoffset={-s.offset}
              className={`${STROKE[s.level]} transition-opacity`}
              style={{ opacity: hovered && hovered !== s.level ? 0.35 : 1 }}
              onMouseEnter={() => setHovered(s.level)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>{`${s.level}: ${s.count} (${s.percent}%)`}</title>
            </circle>
          ))}
        </svg>

        {/* number in the middle: total, or the hovered level */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className="text-3xl font-bold">
            {active ? active.count : total}
          </span>
          <span className="text-xs capitalize text-muted">
            {active ? `${active.level} · ${active.percent}%` : "total"}
          </span>
        </div>
      </div>

      {total === 0 && (
        <p className="mt-3 text-sm text-muted">No findings to show</p>
      )}

      <ul className="mt-4 w-full space-y-1 text-sm">
        {LEVELS.map((level) => {
          const count = segments.find((s) => s.level === level)?.count ?? 0;
          return (
            <li
              key={level}
              tabIndex={0}
              onMouseEnter={() => count > 0 && setHovered(level)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => count > 0 && setHovered(level)}
              onBlur={() => setHovered(null)}
              className="flex items-center justify-between rounded px-1 outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="flex items-center gap-2 capitalize">
                <span
                  aria-hidden="true"
                  className={`inline-block h-3 w-3 rounded-full ${DOT[level]}`}
                />
                {level}
              </span>
              <span className="font-semibold">{count}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}