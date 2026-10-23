import * as mockApi from "./mockApi";
import { ApiError, networkError } from "./errors";

const useMock = import.meta.env.VITE_USE_MOCK === "true";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function kindFor(status) {
  if (status === 404) return "not_found";
  if (status === 400) return "bad_request";
  return "server";
}

// Sends a request and opens the contract envelope.
// Returns `data` on success, throws an ApiError on failure.
async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch {
    // fetch itself failed: server is down, wrong URL, or blocked by CORS
    throw networkError();
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new ApiError(`Unexpected response from the server (${res.status}).`, {
      kind: kindFor(res.status),
      status: res.status,
    });
  }

  if (!body.success) {
    throw new ApiError(body.error?.message || `Request failed (${res.status}).`, {
      kind: kindFor(res.status),
      status: res.status,
    });
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

async function realGetFindings(id) {
  return request(`/api/scans/${encodeURIComponent(id)}/findings`);
}

export const createScan = useMock ? mockApi.createScan : realCreateScan;
export const getScan = useMock ? mockApi.getScan : realGetScan;
export const getFindings = useMock ? mockApi.getFindings : realGetFindings;