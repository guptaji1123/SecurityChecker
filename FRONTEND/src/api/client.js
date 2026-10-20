import * as mockApi from "./mockApi";

const useMock = import.meta.env.VITE_USE_MOCK === "true";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Sends a request and opens the contract envelope.
// Returns `data` on success, throws Error(error.message) on failure.
async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch {
    // fetch itself failed: server is down, wrong URL, or blocked by CORS
    throw new Error(
      "Could not reach the server. Please check your connection and try again."
    );
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error(`Unexpected response from the server (${res.status}).`);
  }

  if (!body.success) {
    throw new Error(
      body.error?.message || `Request failed (${res.status}).`
    );
  }

  return body.data;
}

async function realCreateScan(file) {
  const formData = new FormData();
  formData.append("file", file);
  return request("/api/scans", { method: "POST", body: formData });
}

async function realGetScan(id) {
  return request(`/api/scans/${encodeURIComponent(id)}`);
}

export const createScan = useMock ? mockApi.createScan : realCreateScan;
export const getScan = useMock ? mockApi.getScan : realGetScan;