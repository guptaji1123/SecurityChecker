import Badge from "../ui/Badge";
import { sortFindings, splitPath, redact } from "../../utils/findings";

// Same grid on every row. On phones the grid is dropped and each row becomes a card.
const COLUMNS = "md:grid-cols-[6rem_11rem_minmax(0,1.2fr)_minmax(0,1fr)]";

export default function FindingsTable({ findings, onSelect }) {
  const rows = sortFindings(findings);

  return (
    <div>
      {/* column titles: only on wide screens */}
      <div
        aria-hidden="true"
        className={`hidden gap-4 px-4 pb-2 text-xs uppercase tracking-wide text-muted md:grid ${COLUMNS}`}
      >
        <span>Severity</span>
        <span>Type</span>
        <span>File</span>
        <span>Snippet</span>
      </div>

      <ul className="space-y-3">
        {rows.map((f) => {
          const { dir, name } = splitPath(f.filePath);
          const place = `${f.filePath}:${f.line}`;
          const snippet = redact(f.maskedSnippet);

          return (
            <li key={f.id}>
              <button
                type="button"
                                onClick={(e) => onSelect?.(f, e.currentTarget)}
                aria-label={`${f.severity} ${f.type} in ${f.filePath} at line ${f.line}. Open details.`}
                className={`flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:grid md:items-center md:gap-4 ${COLUMNS}`}
              >
                <span>
                  <Badge severity={f.severity} />
                </span>

                <span className="min-w-0 font-semibold">{f.type}</span>

                {/* folders shrink with "...", the file name and line stay visible */}
                <span className="flex min-w-0 text-sm text-muted" title={place}>
                  <span className="min-w-0 truncate">{dir}</span>
                  <span className="shrink-0 text-ink">{name}</span>
                  <span className="shrink-0">:{f.line}</span>
                </span>

                <code
                  className="min-w-0 truncate rounded bg-canvas px-2 py-1 text-sm"
                  title={snippet}
                >
                  {snippet}
                </code>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}