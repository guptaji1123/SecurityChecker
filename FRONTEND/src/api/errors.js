// One error type for every API problem, so the pages can tell the cases apart.
// kind: "network"   -> the server could not be reached
//       "not_found" -> the scan does not exist (404)
//       "bad_request" -> the id is not valid (400)
//       "server"    -> anything else
export class ApiError extends Error {
  constructor(message, { kind = "server", status = 0 } = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

export function networkError() {
  return new ApiError(
    "Could not reach the server. Please check your connection and try again.",
    { kind: "network" }
  );
}

export function notFoundError() {
  return new ApiError("We could not find that scan.", {
    kind: "not_found",
    status: 404,
  });
}