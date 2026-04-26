import { cookies } from "next/headers";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { API_URL, IS_PRODUCTION } from "@/lib/env";
import { setSuspended } from "@/lib/subscription-banner-store";

const TOKEN_CONFIG = {
  accessMaxAge: 60 * 60,
  refreshMaxAge: 60 * 60 * 24 * 7,
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: IS_PRODUCTION,
} as const;

interface AuthFetchOptions extends RequestInit {
  /** Cache revalidation time in seconds. Only applies to GET requests. */
  revalidate?: number;
  /** Cache tags for targeted invalidation via revalidateTag(). */
  tags?: string[];
}

interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}

/**
 * In-flight refresh promise shared across concurrent authFetch calls.
 * Prevents the race where N parallel requests each hit 401, each call
 * /auth/refresh, and the backend rotates the refresh token for the first
 * one — rejecting the rest.
 *
 * Module-level state is per-process (Node.js worker). Requests landing
 * on the same worker share it.
 */
let refreshInFlight: Promise<TokenPair> | null = null;

async function refreshTokens(currentRefreshToken: string): Promise<TokenPair> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });
      if (!response.ok) {
        throw new Error("NOT_AUTHENTICATED");
      }
      return unwrapEnvelope<TokenPair>(response);
    } finally {
      // Release the slot so the next expiry cycle can start a fresh refresh.
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Authenticated fetch wrapper. Injects JWT Bearer token from cookies.
 * On 401, attempts a single token refresh (deduplicated across concurrent
 * callers) and retries the original request. Supports Next.js cache via
 * revalidate and tags options (GET only).
 * @throws Error with "NOT_AUTHENTICATED" if no token available or refresh fails
 */
export async function authFetch(
  path: string,
  options: AuthFetchOptions = {},
): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const { revalidate, tags, ...fetchOptions } = options;

  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(fetchOptions.headers ?? {}).map(([k, v]) => [k, String(v)]),
    ),
    Authorization: `Bearer ${accessToken}`,
  };

  // Only advertise a JSON body when one is actually present. DELETE/GET
  // requests have no body; sending `Content-Type: application/json` with
  // empty payload makes strict backends reject the call with
  // "Body cannot be empty when content-type is set to 'application/json'".
  if (
    fetchOptions.body !== undefined &&
    fetchOptions.body !== null &&
    !(fetchOptions.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const isGet = !fetchOptions.method || fetchOptions.method === "GET";
  const nextConfig = isGet && (revalidate !== undefined || tags)
    ? { next: { revalidate, tags } }
    : {};

  const response = await fetch(url, { ...fetchOptions, ...nextConfig, headers });

  if (response.status !== 401) {
    if (response.status === 402) {
      try {
        const cloned = response.clone();
        const envelope = (await cloned.json()) as {
          error?: { code?: string };
        } | null;
        if (envelope?.error?.code === "SUBSCRIPTION_INACTIVE_001") {
          setSuspended(true);
        }
      } catch {
        // body wasn't JSON; leave the banner alone
      }
    }
    return response;
  }

  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (!refreshToken) {
    throw new Error("NOT_AUTHENTICATED");
  }

  let tokens: TokenPair;
  try {
    tokens = await refreshTokens(refreshToken);
  } catch {
    throw new Error("NOT_AUTHENTICATED");
  }

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
    // Cookie setting fails in Server Component context — proxy handles on next request
  }

  headers.Authorization = `Bearer ${tokens.accessToken}`;
  const retried = await fetch(url, { ...fetchOptions, ...nextConfig, headers });

  if (retried.status === 402) {
    try {
      const cloned = retried.clone();
      const envelope = (await cloned.json()) as {
        error?: { code?: string };
      } | null;
      if (envelope?.error?.code === "SUBSCRIPTION_INACTIVE_001") {
        setSuspended(true);
      }
    } catch {
      // body wasn't JSON; leave the banner alone
    }
  }

  return retried;
}
