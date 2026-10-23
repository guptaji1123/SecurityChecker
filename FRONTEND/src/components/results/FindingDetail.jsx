import { useEffect, useRef } from "react";
import Badge from "../ui/Badge";
import { redact } from "../../utils/findings";

const LEAK_STEPS = [
  {
    title: "Rotate the key",
    text: "Revoke it with the provider and create a new one. Do this first, before anything else.",
  },
  {
    title: "Remove it from code",
    text: "Load the new key from an environment variable or a secrets manager, and add .env to .gitignore.",
  },
  {
    title: "Clean Git history",
    text: "Deleting it in a new commit is not enough. Rewrite history with git filter-repo or BFG Repo-Cleaner, then force-push.",
  },
];

// A side panel built on the browser's own <dialog>. It already traps the Tab key,
// closes with Escape and puts everything behind it out of reach.
export default function FindingDetail({ finding, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();

    // stop the page behind the panel from scrolling
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const snippet = redact(finding.maskedSnippet);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="finding-title"
      onClose={onClose} // fires for Escape and for dialog.close()
      onClick={(e) => {
        // a click on the dark area outside the panel lands on the dialog itself
        if (e.target === e.currentTarget) dialogRef.current.close();
      }}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-xl overflow-y-auto border-0 border-l border-line bg-surface p-0 text-ink backdrop:bg-black/60"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge severity={finding.severity} />
            <h2 id="finding-title" className="mt-3 text-xl font-bold">
              {finding.type}
            </h2>
            <p className="mt-1 break-all text-sm text-muted">
              {finding.filePath}:{finding.line}
            </p>
          </div>
          <button
            type="button"
            autoFocus
            aria-label="Close details"
            onClick={() => dialogRef.current.close()}
            className="shrink-0 cursor-pointer rounded-lg border border-line px-3 py-1 text-lg leading-none text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            ✕
          </button>
        </div>

        <pre className="mt-6 overflow-x-auto rounded-lg bg-canvas p-3 text-sm">
          <code>{snippet}</code>
        </pre>

        <h3 className="mt-6 font-semibold">Why this is risky</h3>
        <p className="mt-2 text-sm text-muted">{finding.explanation}</p>

        <h3 className="mt-6 font-semibold">How to fix it</h3>
        <p className="mt-2 text-sm text-muted">{finding.fix}</p>

        <div className="mt-8 rounded-xl border border-high/60 bg-high/10 p-4">
          <h3 className="font-semibold">
            If this was ever pushed to GitHub, treat it as leaked
          </h3>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm">
            {LEAK_STEPS.map((step) => (
              <li key={step.title}>
                <span className="font-semibold">{step.title}.</span>{" "}
                <span className="text-muted">{step.text}</span>
              </li>
            ))}
          </ol>
        </div>

        {finding.ruleId && (
          <p className="mt-6 text-xs text-subtle">Rule: {finding.ruleId}</p>
        )}
      </div>
    </dialog>
  );
}