import { SEVERITIES } from "../../utils/findings";

// Full class names are written out so Tailwind can find them.
const CHIP_ON = {
  critical: "border-critical bg-critical/15 text-critical",
  high: "border-high bg-high/15 text-high",
  medium: "border-medium bg-medium/15 text-medium",
  low: "border-low bg-low/15 text-low",
};
const CHIP_OFF = "border-line text-muted hover:text-ink";

export default function FindingsFilters({
  levels,
  counts,
  query,
  onToggleLevel,
  onQueryChange,
  onClear,
  canClear,
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {SEVERITIES.map((level) => {
          const on = levels.includes(level);
          return (
            <button
              key={level}
              type="button"
              aria-pressed={on}
              onClick={() => onToggleLevel(level)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-sm capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                on ? CHIP_ON[level] : CHIP_OFF
              }`}
            >
              {level} <span className="font-semibold">{counts[level]}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onClear}
          disabled={!canClear}
          className="ml-auto cursor-pointer text-sm text-muted underline-offset-4 hover:text-ink hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-40 disabled:hover:text-muted"
        >
          Clear filters
        </button>
      </div>

      <div>
        <label htmlFor="findings-search" className="sr-only">
          Search findings by file path or type
        </label>
        <input
          id="findings-search"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by file path or type..."
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </div>
    </div>
  );
}