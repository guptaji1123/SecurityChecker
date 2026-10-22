import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { getScan, getFindings } from "../api/client";
import ScanSummary from "../components/scan/ScanSummary";

const LEVELS = ["critical", "high", "medium", "low"];

// The key makes React start fresh (back to "loading") when the id changes.
export default function ScanResults() {
  const { id } = useParams();
  return <Report key={id} id={id} />;
}

function Report({ id }) {
  const [state, setState] = useState("loading"); // loading | error | ready
  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // bump this to load again

  useEffect(() => {
    let active = true;

    Promise.all([getScan(id), getFindings(id)])
      .then(([scanData, findingsData]) => {
        if (!active) return;
        setScan(scanData);
        setFindings(
          Array.isArray(findingsData) ? findingsData : findingsData?.findings ?? []
        );
        setState("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setState("error");
      });

    // cleanup: ignore the answer if the user leaves or the id changes
    return () => {
      active = false;
    };
  }, [id, attempt]);

  if (state === "loading") {
    return (
      <section className="mx-auto max-w-3xl py-12">
        <Card>
          <p className="font-semibold">Loading your report...</p>
          <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-canvas" />
        </Card>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="mx-auto max-w-3xl py-12">
        <Card className="border-critical/60">
          <p className="text-lg font-semibold text-critical">
            Could not load this report
          </p>
          <p role="alert" className="mt-2 text-sm text-muted">
            {error}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setState("loading");
                setAttempt((n) => n + 1);
              }}
            >
              Try again
            </Button>
            <Button to="/scan" variant="secondary">
              Back to scan
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  // ready
 const sorted = [...findings].sort(
    (a, b) => LEVELS.indexOf(a.severity) - LEVELS.indexOf(b.severity)
  );

  return (
    <section className="mx-auto max-w-3xl py-12">
      <Link to="/scan" className="text-sm text-muted hover:text-ink">
        ← New scan
      </Link>
            <div className="mt-4">
        <ScanSummary scan={scan} />
      </div>

      {scan?.status && scan.status !== "completed" && (
        <p className="mt-4 text-sm text-muted">
          This scan is {scan.status}, so the list below may be incomplete.
        </p>
      )}
      
      {sorted.length === 0 ? (
        <Card className="mt-8">
          <p className="font-semibold">No exposed secrets found</p>
          <p className="mt-1 text-sm text-muted">
            Nothing suspicious was detected in this project.
          </p>
        </Card>
      ) : (
        <div className="mt-8 space-y-4">
          {sorted.map((f) => (
            <Card key={f.id}>
              <div className="flex flex-wrap items-center gap-3">
                <Badge severity={f.severity} />
                <h2 className="font-semibold">{f.type}</h2>
              </div>
              <p className="mt-2 text-sm text-muted break-all">
                {f.filePath}:{f.line}
                {f.ruleId && <span className="ml-2 text-subtle">({f.ruleId})</span>}
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-canvas p-3 text-sm">
                <code>{f.maskedSnippet}</code>
              </pre>
              <p className="mt-3 text-sm">{f.explanation}</p>
              <p className="mt-2 text-sm text-muted">
                <span className="font-semibold text-ink">How to fix: </span>
                {f.fix}
              </p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}