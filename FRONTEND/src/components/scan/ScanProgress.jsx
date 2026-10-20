import Card from "../ui/Card";

const steps = {
  uploading: { message: "Uploading your file...", percent: 20 },
  queued: { message: "Your scan is in the queue...", percent: 40 },
  scanning: { message: "Scanning for exposed secrets...", percent: 75 },
};

export default function ScanProgress({ status = "uploading", fileName }) {
  const step = steps[status] ?? steps.uploading;

  return (
    <Card>
      <p className="font-semibold">{step.message}</p>
      {fileName && (
        <p className="mt-1 text-sm text-muted break-all">{fileName}</p>
      )}
      <div
        role="progressbar"
        aria-valuenow={step.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-5 h-3 w-full overflow-hidden rounded-full bg-canvas"
      >
        <div
          className="h-full animate-pulse rounded-full bg-brand transition-all duration-700 ease-out"
          style={{ width: `${step.percent}%` }}
        />
      </div>
      <p className="mt-2 text-right text-xs text-muted">{step.percent}%</p>
    </Card>
  );
}