import { cookies } from "next/headers";
import { cache } from "react";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { API_URL, IS_PRODUCTION } from "@/lib/env";
import { authFetch } from "./auth-fetch";
import type {
  AuthUser,
  IAuthService,
  LoginResponse,
  WhatsAppOAuthInit,
} from "./interfaces/auth-service";

const TOKEN_CONFIG = {
  accessMaxAge: 60 * 60,
  refreshMaxAge: 60 * 60 * 24 * 7,
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: IS_PRODUCTION,
} as const;

/**
 * Request-scoped cache: React.cache() dedupes calls within a single
 * server render pass. Layouts that both call getCachedSession() share
 * one /auth/me round-trip per request.
 */
const getCachedSession = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    return unwrapEnvelope<AuthUser>(response);
  } catch {
    return null;
  }
});

class AuthService implements IAuthService {
  /**
   * Authenticate user with email and password.
   * Returns tokens and user data without setting cookies.
   * @throws Error if credentials are invalid
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error?.message;
      const errorText = Array.isArray(message) ? message[0] : message;
      throw new Error(errorText ?? "INVALID_CREDENTIALS");
    }

    return unwrapEnvelope<LoginResponse>(response);
  }

  async setTokenCookies(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set("access_token", accessToken, {
      maxAge: TOKEN_CONFIG.accessMaxAge,
      httpOnly: TOKEN_CONFIG.httpOnly,
      sameSite: TOKEN_CONFIG.sameSite,
      path: TOKEN_CONFIG.path,
      secure: TOKEN_CONFIG.secure,
    });
    cookieStore.set("refresh_token", refreshToken, {
      maxAge: TOKEN_CONFIG.refreshMaxAge,
      httpOnly: TOKEN_CONFIG.httpOnly,
      sameSite: TOKEN_CONFIG.sameSite,
      path: TOKEN_CONFIG.path,
      secure: TOKEN_CONFIG.secure,
    });
  }

  async logout(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
  }

  /**
   * Get current user session. Shared across nested layouts in the same
   * request thanks to React.cache(). Returns null when unauthenticated.
   */
  async getSession(): Promise<AuthUser | null> {
    return getCachedSession();
  }

  /**
   * Request a short-lived state token for the Meta (WhatsApp) OAuth popup.
   * Must be called immediately before redirecting to the Facebook dialog;
   * the backend later validates the returned `state` on /auth/whatsapp/callback.
   * @returns The opaque state string to include in the Meta OAuth URL
   */
  async initWhatsAppOAuth(): Promise<WhatsAppOAuthInit> {
    const response = await authFetch("/auth/whatsapp/init", {
      method: "POST",
    });
    return unwrapEnvelope<WhatsAppOAuthInit>(response);
  }
}

export const authService = new AuthService();
