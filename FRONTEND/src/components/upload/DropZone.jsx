import { useRef, useState } from "react";
import Button from "../ui/Button";

const MAX_MB = Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 50;
const MAX_SIZE = MAX_MB * 1024 * 1024; // 50 MB in bytes

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validate(file) {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    return "Please choose a .zip file. Other file types are not supported.";
  }
  if (file.size > MAX_SIZE) {
    return `That file is ${formatSize(file.size)}. The limit is ${MAX_MB} MB.`;
  }
  return "";
}

export default function DropZone({ onStart, loading = false }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function pick(picked) {
    if (!picked) return;
    const message = validate(picked);
    if (message) {
      setFile(null);
      setError(message);
      return;
    }
    setError("");
    setFile(picked);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  }

  function handleChange(e) {
    pick(e.target.files[0]);
    e.target.value = ""; // lets you pick the same file again later
  }

  function remove() {
    setFile(null);
    setError("");
  }

  if (file) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="font-semibold break-all">{file.name}</p>
        <p className="mt-1 text-sm text-muted">{formatSize(file.size)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => onStart?.(file)} disabled={loading}>
            {loading ? "Starting..." : "Start scan"}
          </Button>
          <Button variant="secondary" onClick={remove} disabled={loading}>
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${dragging ? "border-accent bg-accent/10" : "border-line bg-surface"
          }`}
      >
        <div className="text-4xl">📦</div>
        <p className="mt-4 font-semibold">Drag and drop your .zip here</p>
        <p className="mt-1 text-sm text-muted">or</p>
        <div className="mt-3">
          <Button variant="secondary" onClick={() => inputRef.current.click()}>
            Browse files
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted">ZIP files only, up to {MAX_MB} MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-critical">
          {error}
        </p>
      )}
    </div>
  );
}