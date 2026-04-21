"use server";

import { cookies } from "next/headers";
import { authService } from "@/lib/services/auth-service";
import { captureUnexpected } from "@/lib/observability/capture";
import { counter } from "@/lib/observability/sentry-metrics";

interface LoginActionResult {
  readonly success: boolean;
  readonly error?: string;
}

type LoginResult = "success" | "invalid_credentials" | "error";

const SAFE_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: "Email ou senha inválidos.",
  NOT_AUTHENTICATED: "Sessão expirada. Faça login novamente.",
};

function emitLoginAttempt(result: LoginResult): void {
  counter("auth.login_attempt", 1, { attributes: { result } });
}

/**
 * Server action for user login.
 * Sets auth cookies and returns success for client-side redirect.
 * @param formData - Form data with email and password fields
 * @returns Action result with success flag and optional error message
 */
export async function loginAction(
  formData: FormData,
): Promise<LoginActionResult> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { success: false, error: "Preencha todos os campos." };
  }

  if (!email.trim() || !password.trim()) {
    return { success: false, error: "Preencha todos os campos." };
  }

  try {
    const data = await authService.login(email.trim(), password);

    const cookieStore = await cookies();
    cookieStore.set("access_token", data.accessToken, {
      maxAge: 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    cookieStore.set("refresh_token", data.refreshToken, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    emitLoginAttempt("success");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    captureUnexpected(err, { expectedMessages: ["INVALID_CREDENTIALS"] });
    emitLoginAttempt(message === "INVALID_CREDENTIALS" ? "invalid_credentials" : "error");
    return {
      success: false,
      error: SAFE_ERRORS[message] ?? "Ocorreu um erro. Tente novamente.",
    };
  }
}
