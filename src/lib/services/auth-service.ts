import { cookies } from "next/headers";
import type {
  AuthUser,
  IAuthService,
  LoginResponse,
} from "./interfaces/auth-service";

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

class AuthService implements IAuthService {
  /**
   * Authenticate user with email and password.
   * Sets JWT tokens in httpOnly cookies on success.
   * @param email - User email
   * @param password - User password
   * @returns Login response with tokens and user data
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
      throw new Error(errorData?.message ?? "INVALID_CREDENTIALS");
    }

    const data: LoginResponse = await response.json();

    const cookieStore = await cookies();
    cookieStore.set("access_token", data.accessToken, {
      maxAge: TOKEN_CONFIG.accessMaxAge,
      httpOnly: TOKEN_CONFIG.httpOnly,
      sameSite: TOKEN_CONFIG.sameSite,
      path: TOKEN_CONFIG.path,
      secure: TOKEN_CONFIG.secure,
    });
    cookieStore.set("refresh_token", data.refreshToken, {
      maxAge: TOKEN_CONFIG.refreshMaxAge,
      httpOnly: TOKEN_CONFIG.httpOnly,
      sameSite: TOKEN_CONFIG.sameSite,
      path: TOKEN_CONFIG.path,
      secure: TOKEN_CONFIG.secure,
    });

    return data;
  }

  /**
   * Clear auth cookies and end the session.
   */
  async logout(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
  }

  /**
   * Get current user session from the access token cookie.
   * @returns AuthUser if authenticated, null otherwise
   */
  async getSession(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    if (!accessToken) return null;

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
