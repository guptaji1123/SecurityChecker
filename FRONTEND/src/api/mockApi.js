import {
  mockScan,
  mockFindings,
  cleanMockScan,
  manyMockScan,
  manyMockFindings,
  CLEAN_ID,
  MANY_ID,
} from "./mockData";
import { networkError, notFoundError } from "./errors";

const wait = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

// Every scan this fake server knows about.
const scans = {
  [mockScan.id]: { scan: mockScan, findings: mockFindings },
  [CLEAN_ID]: { scan: cleanMockScan, findings: [] },
  [MANY_ID]: { scan: manyMockScan, findings: manyMockFindings },
};

// remembers how many times each scan was checked
const calls = {};
const failing = {};
let flakyFailedAt = null; // when /scan/flaky first failed

export async function createScan(file) {
  await wait();
  const name = file?.name ?? mockScan.originalName;
  const lower = name.toLowerCase();

  // test trick: a file name containing "reject" simulates the server refusing the upload
  if (lower.includes("reject")) {
    throw new Error(
      "The server rejected this file. It may be unsafe or contain too many files."
    );
  }

  // test tricks: "clean" gives zero findings, "many" gives more than 500
  const id = lower.includes("clean")
    ? CLEAN_ID
    : lower.includes("many")
      ? MANY_ID
      : mockScan.id;

  calls[id] = 0;
  // test trick: a file name containing "fail" simulates a scan that fails midway
  failing[id] = lower.includes("fail");
  return {
    id,
    originalName: name,
    status: "queued",
    filesScanned: 0,
    counts: { critical: 0, high: 0, medium: 0, low: 0 },
    createdAt: new Date().toISOString(),
  };
}

export async function getScan(id) {
  await wait();

  // test trick: /scan/offline always fails like a lost connection
  if (id === "offline") throw networkError();
  // test trick: /scan/flaky fails the first time, then works (so Retry can be tried).
  // Calls made within 300ms of the first failure also fail, because React's dev mode
  // sends the same request twice on page load.
  if (id === "flaky") {
    const now = Date.now();
    if (flakyFailedAt === null || now - flakyFailedAt < 300) {
      flakyFailedAt ??= now;
      throw networkError();
    }
    return { ...mockScan, id };
  }

  const known = scans[id];
  if (!known) throw notFoundError();

  // A scan we never created in this session (for example the results page was
  // opened directly or refreshed) is treated as already completed.
  if (!(id in calls)) return { ...known.scan };

  calls[id] = calls[id] + 1;

  if (calls[id] === 1) return { id, status: "queued" };
  if (calls[id] === 2) return { id, status: "scanning" };
  if (failing[id]) {
    return { id, status: "failed", error: "The scan failed. Please try again." };
  }
  return { ...known.scan, status: "completed" };
}

export async function getFindings(id) {
  await wait();
  if (id === "offline") throw networkError();
  if (id === "flaky") return mockFindings;

  const known = scans[id];
  if (!known) throw notFoundError();
  return known.findings;
}