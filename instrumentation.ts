import * as Sentry from "@sentry/nextjs";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    // E2E mock backend. Only loads when explicitly enabled so production
    // builds never pull `msw` at runtime. `onUnhandledRequest: "bypass"`
    // lets Next's own internals (HMR, _next/*) flow through untouched.
    if (process.env.MSW_ENABLED === "1") {
      const { server } = await import("@/test/msw/server");
      server.listen({ onUnhandledRequest: "bypass" });
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
