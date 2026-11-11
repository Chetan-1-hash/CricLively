export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

// live score connection: http://host -> ws://host, https://host -> wss://host
export const WS_URL = API_URL.replace(/^http/, "ws") + "/ws/live";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const fallback = (s: number) =>
  s === 401 ? "Invalid credentials or session expired"
  : s === 403 ? "You don't have permission to do that"
  : s >= 500 ? "Server error, try again later"
  : "Request failed";

interface Opts extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** false for login endpoints: a 401 there means bad credentials, not an expired session */
  redirectOn401?: boolean;
}

export async function api<T = any>(
  path: string,
  { body, redirectOn401 = true, headers, ...init }: Opts = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: { ...(body !== undefined && { "Content-Type": "application/json" }), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null); // empty or non-JSON body is fine

  if (!res.ok) {
    if (res.status === 401 && redirectOn401) {
      sessionStorage.clear();
      localStorage.removeItem("token");
      window.location.assign("/login"); // adjust to your login route
    }
    throw new ApiError(res.status, data?.message ?? fallback(res.status));
  }
  return data as T;
}