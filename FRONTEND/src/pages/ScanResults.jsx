import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getScan, getFindings } from "../api/client";
import ScanSummary from "../components/scan/ScanSummary";
import FindingsExplorer from "../components/results/FindingsExplorer";

const MAX_FINDINGS = 500; // the API never sends more than this

// The key makes React start fresh (back to "loading") when the id changes.
export default function ScanResults() {
  const { id } = useParams();
  return <Report key={id} id={id} />;
}

function Report({ id }) {
  const [state, setState] = useState("loading"); // loading | error | ready
  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [error, setError] = useState({ kind: "server", message: "" });
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
        setError({ kind: err.kind ?? "server", message: err.message });
        setState("error");
      });

    // cleanup: ignore the answer if the user leaves or the id changes
    return () => {
      active = false;
    };
  }, [id, attempt]);

  function retry() {
    setState("loading");
    setAttempt((n) => n + 1);
  }

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
    // the scan id is wrong or the scan is gone: retrying cannot help
    if (error.kind === "not_found" || error.kind === "bad_request") {
      return (
        <section className="mx-auto max-w-3xl py-12">
          <Card className="text-center">
            <p className="text-4xl" aria-hidden="true">
              🔍
            </p>
            <h1 className="mt-3 text-xl font-bold">We could not find that scan</h1>
            <p className="mt-2 text-sm text-muted">
              The link may be wrong, or the scan may no longer exist.
            </p>
            <div className="mt-6">
              <Button to="/scan">Scan a project</Button>
            </div>
          </Card>
        </section>
      );
    }

    const offline = error.kind === "network";
    return (
      <section className="mx-auto max-w-3xl py-12">
        <Card className="border-critical/60">
          <p className="text-lg font-semibold text-critical">
            {offline ? "Can't reach the server" : "Could not load this report"}
          </p>
          <p role="alert" className="mt-2 text-sm text-muted">
            {error.message}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={retry}>Retry</Button>
            <Button to="/scan" variant="secondary">
              Back to scan
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  // ready
  const counts = scan?.counts ?? {};
  const total = ["critical", "high", "medium", "low"].reduce(
    (sum, level) => sum + (counts[level] ?? 0),
    0
  );
  const truncated = findings.length >= MAX_FINDINGS || total > findings.length;

  return (
    <section className="mx-auto max-w-5xl py-12">
      <Link to="/scan" className="text-sm text-muted hover:text-ink">
        ← Back to scan
      </Link>
      <div className="mt-4">
        <ScanSummary scan={scan} />
      </div>

      {scan?.status && scan.status !== "completed" && (
        <p className="mt-4 text-sm text-muted">
          This scan is {scan.status}, so the list below may be incomplete.
        </p>
      )}

      {findings.length === 0 ? (
        <Card className="mt-8 border-low/60 bg-low/10">
          <p className="text-lg font-semibold">
            <span aria-hidden="true">✓ </span>No exposed secrets found
          </p>
          <p className="mt-2 text-sm">
            {scan?.filesScanned != null
              ? `We checked ${scan.filesScanned} files and found no known secret patterns.`
              : "We found no known secret patterns in this project."}
          </p>
          <p className="mt-2 text-sm text-muted">
            This is not a guarantee. The scan only looks for known patterns, so
            keep your keys out of code and review sensitive files yourself.
          </p>
        </Card>
      ) : (
        <div className="mt-8">
          {truncated && (
            <p
              role="status"
              className="mb-4 rounded-lg border border-high/60 bg-high/10 px-4 py-3 text-sm"
            >
              <span className="font-semibold">
                Showing the first {findings.length} findings.
              </span>
              {total > findings.length &&
                ` The scan found ${total} in total, so fix these first and scan again.`}
            </p>
          )}
          <FindingsExplorer findings={findings} />
        </div>
      )}

      <div className="mt-10">
        <Button to="/scan" variant={findings.length === 0 ? "primary" : "secondary"}>
          Scan another project
        </Button>
      </div>
    </section>
  );
}