"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authService } from "@/lib/services/auth-service";
import { captureUnexpected } from "@/lib/observability/capture";
import { counter } from "@/lib/observability/sentry-metrics";

export interface LoginActionResult {
  readonly success: false;
  readonly error: string;
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
 * Server action for user login. Uses the React 19 `useActionState` signature
 * `(prevState, formData)` so the form works even before client hydration.
 * On success, performs a server-side redirect to `/dashboard`. On failure,
 * returns an error state for the client to surface.
 */
export async function loginAction(
  _prevState: LoginActionResult | null,
  formData: FormData,
): Promise<LoginActionResult> {
  const email = formData.get("email");
  const password = formData.get("password");
  const remember = formData.get("remember") === "1";

  if (typeof email !== "string" || typeof password !== "string") {
    return { success: false, error: "Preencha todos os campos." };
  }

  if (!email.trim() || !password.trim()) {
    return { success: false, error: "Preencha todos os campos." };
  }

  let tokens;
  try {
    tokens = await authService.login(email.trim(), password);
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    captureUnexpected(err, { expectedMessages: ["INVALID_CREDENTIALS"] });
    emitLoginAttempt(
      message === "INVALID_CREDENTIALS" ? "invalid_credentials" : "error",
    );
    return {
      success: false,
      error: SAFE_ERRORS[message] ?? "Ocorreu um erro. Tente novamente.",
    };
  }

  const cookieStore = await cookies();
  const baseCookie = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };

  cookieStore.set("access_token", tokens.accessToken, {
    ...baseCookie,
    ...(remember ? { maxAge: 60 * 60 } : {}),
  });
  cookieStore.set("refresh_token", tokens.refreshToken, {
    ...baseCookie,
    ...(remember ? { maxAge: 60 * 60 * 24 * 7 } : {}),
  });

  emitLoginAttempt("success");
  redirect("/dashboard");
}
