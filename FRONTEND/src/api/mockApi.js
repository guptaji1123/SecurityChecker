import { mockScan } from "./mockData";

const wait = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

// remembers how many times each scan was checked
const calls = {};
const failing = {};

export async function createScan(file) {
  await wait();
  const name = file?.name ?? mockScan.originalName;

  // test trick: a file name containing "reject" simulates the server refusing the upload
  if (name.toLowerCase().includes("reject")) {
    throw new Error(
      "The server rejected this file. It may be unsafe or contain too many files."
    );
  }

  const id = mockScan.id;
  calls[id] = 0;
  // test trick: a file name containing "fail" simulates a scan that fails midway
  failing[id] = name.toLowerCase().includes("fail");
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
  calls[id] = (calls[id] ?? 0) + 1;

  if (calls[id] === 1) return { id, status: "queued" };
  if (calls[id] === 2) return { id, status: "scanning" };
  if (failing[id]) {
    return { id, status: "failed", error: "The scan failed. Please try again." };
  }
  return { ...mockScan, id, status: "completed" };
}