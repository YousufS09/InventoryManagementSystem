// Development talks to the local backend directly. Production builds call the
// same origin ("/api/..."), which Netlify forwards to Render (see netlify.toml),
// so the auth cookie is first-party. VITE_API_BASE_URL overrides both.
const DEFAULT_API_BASE_URL = import.meta.env.DEV ? "http://localhost:4000" : "";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const apiFetch = (path: string, init?: RequestInit) => {
  return fetch(apiUrl(path), {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.headers || {}),
    },
  });
};

export const AUTH_EXPIRED_EVENT = "auth:expired";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Sends a JSON request and returns the parsed response.
 * Throws ApiError with the server's `error` message when the response is not OK.
 */
export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const response = await apiFetch(path, {
    method: options.method || "GET",
    headers:
      options.body === undefined
        ? undefined
        : { "Content-Type": "application/json" },
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Empty or non-JSON body.
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Lets AuthProvider send the user back to sign-in when the session expires.
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    const message =
      (data as { error?: string } | null)?.error ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof TypeError) {
    return "Could not reach the server. Check that the backend is running.";
  }
  return fallback;
}
