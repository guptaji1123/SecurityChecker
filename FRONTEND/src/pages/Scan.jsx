import { useEffect, useState } from "react";
import DropZone from "../components/upload/DropZone";
import ScanProgress from "../components/scan/ScanProgress";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { createScan, getScan } from "../api/client";

export default function Scan() {
  const [state, setState] = useState("idle"); // idle | uploading | scanning | done | error
  const [scan, setScan] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const scanId = scan?.id;

  async function handleStart(file) {
    setFileName(file.name);
    setError("");
    setState("uploading");
    try {
      const created = await createScan(file);
      setScan(created);
      setState(created.status === "completed" ? "done" : "scanning");
    } catch (err) {
      setError(err.message);
      setState("error");
    }
  }

  function reset() {
    setState("idle");
    setScan(null);
    setFileName("");
    setError("");
  }

  // Polling: ask for the latest status every 1.5 seconds while scanning
  useEffect(() => {
    if (state !== "scanning" || !scanId) return;

    let active = true;

    const timer = setInterval(async () => {
      try {
        const latest = await getScan(scanId);
        if (!active) return;

        if (latest.status === "completed") {
          setScan(latest);
          setState("done");
        } else if (latest.status === "failed") {
          setError("The scan failed. Please try again.");
          setState("error");
        } else {
          setScan(latest);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message);
        setState("error");
      }
    }, 1500);

    // cleanup: stop the timer when the state changes or the page closes
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [state, scanId]);

  const counts = scan?.counts ?? {};
  const total = ["critical", "high", "medium", "low"].reduce(
    (sum, level) => sum + (counts[level] ?? 0),
    0
  );

  return (
    <section className="mx-auto max-w-2xl py-12">
      <h1 className="text-3xl font-bold">Scan your code</h1>
      <p className="mt-3 mb-8 text-muted">
        Upload a ZIP of your project and we will look for exposed secrets.
      </p>

      {state === "idle" && <DropZone onStart={handleStart} />}

      {state === "uploading" && (
        <ScanProgress status="uploading" fileName={fileName} />
      )}

      {state === "scanning" && (
        <ScanProgress
          status={scan?.status === "scanning" ? "scanning" : "queued"}
          fileName={fileName}
        />
      )}

      {state === "done" && (
        <Card>
          <p className="text-lg font-semibold">Scan complete</p>
          <p className="mt-1 text-sm text-muted">
            Found {total} issues in {scan?.originalName ?? fileName}
            {scan?.filesScanned != null && ` (${scan.filesScanned} files scanned)`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["critical", "high", "medium", "low"].map((level) => (
              <Badge key={level} severity={level}>
                {level}: {counts[level] ?? 0}
              </Badge>
            ))}
          </div>
                  <div className="mt-6 flex flex-wrap gap-3">
            <Button to={`/scan/${scan.id}`}>View full report</Button>
            <Button variant="secondary" onClick={reset}>
              Scan another file
            </Button>
          </div>
        </Card>
      )}

      {state === "error" && (
        <Card className="border-critical/60">
          <p className="text-lg font-semibold text-critical">
            Something went wrong
          </p>
          <p role="alert" className="mt-2 text-sm text-muted">
            {error}
          </p>
          <div className="mt-6">
            <Button onClick={reset}>Try again</Button>
          </div>
        </Card>
      )}
    </section>
  );
}