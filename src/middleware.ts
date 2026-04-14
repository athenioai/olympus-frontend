import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const EXPIRY_BUFFER_MS = 30_000;

const PUBLIC_PATHS = ["/login", "/forgot-password"];

const intlMiddleware = createIntlMiddleware(routing);

function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    );
    return decoded.exp * 1000 - Date.now() < EXPIRY_BUFFER_MS;
  } catch {
    return true;
  }
}

function getLogicalPath(pathname: string): string {
  // Strip locale prefix to get the logical path
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const isLocale =
    firstSegment === "pt-BR" ||
    firstSegment === "en-US" ||
    firstSegment === "es";

  return isLocale
    ? `/${segments.slice(1).join("/")}`
    : `/${segments.join("/")}`;
}

function isPublicPath(logicalPath: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => logicalPath === p || logicalPath.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const logicalPath = getLogicalPath(pathname);

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Public paths — redirect to dashboard if already authenticated
  if (isPublicPath(logicalPath)) {
    if (accessToken && !isTokenExpired(accessToken)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return intlMiddleware(request);
  }

  // No tokens — redirect to login
  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Token still valid — proceed
  if (!isTokenExpired(accessToken)) {
    return intlMiddleware(request);
  }

  // Token expired — attempt refresh
  if (!refreshToken) {
    return redirectToLogin(request);
  }

  try {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      return redirectToLogin(request);
    }

    const tokens: { accessToken: string; refreshToken: string } =
      await refreshResponse.json();

    const response = intlMiddleware(request);

    response.cookies.set("access_token", tokens.accessToken, {
      maxAge: 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: IS_PRODUCTION,
    });

    response.cookies.set("refresh_token", tokens.refreshToken, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: IS_PRODUCTION,
    });

    return response;
  } catch {
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logo/).*)",
  ],
};
