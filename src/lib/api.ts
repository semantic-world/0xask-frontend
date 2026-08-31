/**
 * The API client.
 *
 * Everything goes through one place so three rules are applied consistently:
 * the forgery token accompanies every mutation, failures arrive as a typed
 * error rather than a rejected promise with a raw body, and credentials are
 * always included because the session lives in a cookie.
 *
 * Requests are same origin. Next rewrites `/api` to the backend on the server,
 * so the browser never talks cross origin and the session cookie stays first
 * party.
 */

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;
  readonly requestId: string | undefined;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details ?? {};
    this.requestId = body.request_id;
  }

  /** True when the caller is not signed in, or the session has ended. */
  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  /** The reasons a validation failure lists, when it lists any. */
  get reasons(): string[] {
    const fields = this.details.fields;
    if (Array.isArray(fields)) {
      return fields.map((entry) => {
        const field = entry as { field?: string; issue?: string };
        return field.field ? `${field.field}: ${field.issue}` : String(field.issue);
      });
    }
    const reasons = this.details.reasons;
    return Array.isArray(reasons) ? reasons.map(String) : [];
  }
}

const CSRF_COOKIE = "0xask_csrf";
const CSRF_HEADER = "x-csrf-token";

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();

  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = { accept: "application/json" };
  if (options.body !== undefined) headers["content-type"] = "application/json";

  if (UNSAFE.has(method)) {
    // The page reads the token from a cookie it is allowed to see and echoes
    // it back in a header. An attacker's origin can cause the request but
    // cannot read the cookie to sign it.
    const token = readCookie(CSRF_COOKIE);
    if (token) headers[CSRF_HEADER] = token;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    credentials: "same-origin",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const body: ApiErrorBody = payload?.error ?? {
      code: "unknown",
      message: `Request failed with status ${response.status}.`,
    };
    throw new ApiError(response.status, body);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"]) => request<T>(path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
