import Card from "../ui/Card";

const LEVELS = ["critical", "high", "medium", "low"];

// Full class names are written out so Tailwind can find them.
const TEXT_COLOR = {
  critical: "text-critical",
  high: "text-high",
  medium: "text-medium",
  low: "text-low",
};

function getRisk(counts) {
  if (counts.critical > 0) {
    return {
      level: "critical",
      title: "Action needed now",
      text: "Critical secrets are exposed. Rotate them before you do anything else.",
    };
  }
  if (counts.high > 0) {
    return {
      level: "high",
      title: "Fix these soon",
      text: "High-risk secrets were found. Plan to rotate them today.",
    };
  }
  if (counts.medium > 0) {
    return {
      level: "medium",
      title: "Worth a closer look",
      text: "Some findings need review to confirm whether they are real.",
    };
  }
  if (counts.low > 0) {
    return {
      level: "low",
      title: "Low risk",
      text: "Only minor issues were found. Tidy them up when you can.",
    };
  }
  return {
    level: null,
    title: "All clear",
    text: "No exposed secrets were found in this project.",
  };
}

export default function ScanSummary({ scan }) {
  const counts = {
    critical: scan?.counts?.critical ?? 0,
    high: scan?.counts?.high ?? 0,
    medium: scan?.counts?.medium ?? 0,
    low: scan?.counts?.low ?? 0,
  };
  const total = LEVELS.reduce((sum, level) => sum + counts[level], 0);
  const risk = getRisk(counts);

  const date = scan?.createdAt
    ? new Date(scan.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div>
      {/* Header: scan name, date, files scanned */}
      <h1 className="text-3xl font-bold break-all">
        {scan?.originalName ?? "Scan report"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {date}
        {date && scan?.filesScanned != null && " · "}
        {scan?.filesScanned != null && `${scan.filesScanned} files scanned`}
      </p>

      {/* Overall risk line */}
      <p className="mt-6 text-lg">
        <span
          className={`font-semibold ${risk.level ? TEXT_COLOR[risk.level] : "text-ink"}`}
        >
          {risk.title}
        </span>
        <span className="text-muted"> · {risk.text}</span>
      </p>

      {/* Five cards: Total, Critical, High, Medium, Low */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card className="col-span-2 sm:col-span-1">
          <p className="text-sm text-muted">Total</p>
          <p className="mt-1 text-3xl font-bold">{total}</p>
        </Card>
        {LEVELS.map((level) => (
          <Card key={level}>
            <p className="text-sm capitalize text-muted">{level}</p>
            <p className={`mt-1 text-3xl font-bold ${TEXT_COLOR[level]}`}>
              {counts[level]}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}