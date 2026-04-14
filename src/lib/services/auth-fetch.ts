import { cookies } from "next/headers";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const TOKEN_CONFIG = {
  accessMaxAge: 60 * 60,
  refreshMaxAge: 60 * 60 * 24 * 7,
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: IS_PRODUCTION,
} as const;

/**
 * Authenticated fetch wrapper. Injects JWT Bearer token from cookies.
 * On 401, attempts a single token refresh and retries the original request.
 * @param path - API path (e.g., "/leads")
 * @param options - Standard RequestInit options
 * @returns Fetch Response
 * @throws Error with "NOT_AUTHENTICATED" if no token available or refresh fails
 */
export async function authFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(options.headers ?? {}).map(([k, v]) => [k, String(v)]),
    ),
    Authorization: `Bearer ${accessToken}`,
  };

  // If not FormData, default to JSON content type
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status !== 401) {
    return response;
  }

  // Attempt token refresh
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (!refreshToken) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshResponse.ok) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const tokens: { accessToken: string; refreshToken: string } =
    await refreshResponse.json();

  // Update cookies (may silently fail in Server Component context)
  try {
    cookieStore.set("access_token", tokens.accessToken, {
      maxAge: TOKEN_CONFIG.accessMaxAge,
      httpOnly: TOKEN_CONFIG.httpOnly,
      sameSite: TOKEN_CONFIG.sameSite,
      path: TOKEN_CONFIG.path,
      secure: TOKEN_CONFIG.secure,
    });
    cookieStore.set("refresh_token", tokens.refreshToken, {
      maxAge: TOKEN_CONFIG.refreshMaxAge,
      httpOnly: TOKEN_CONFIG.httpOnly,
      sameSite: TOKEN_CONFIG.sameSite,
      path: TOKEN_CONFIG.path,
      secure: TOKEN_CONFIG.secure,
    });
  } catch {
    // Cookie setting fails in Server Component context — middleware handles on next request
  }

  // Retry original request with new token
  headers.Authorization = `Bearer ${tokens.accessToken}`;
  return fetch(url, { ...options, headers });
}
