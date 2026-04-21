import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Let the MSW-backed dev server live in a separate `.next-msw` build cache
// so it doesn't fight the regular `next dev` lock when both run side by side.
const isMswRun = process.env.MSW_ENABLED === "1";

const nextConfig: NextConfig = {
  ...(isMswRun ? { distDir: ".next-msw" } : {}),
  experimental: {
    optimizePackageImports: ["motion"],
    staleTimes: {
      dynamic: 30,
    },
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https: wss:",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
  ],
};

// Source maps are uploaded to Sentry then deleted from the build output by
// default (sourcemaps.deleteSourcemapsAfterUpload = true in @sentry/nextjs
// v10+), so no manual hideSourceMaps flag is needed.
const withSentry = withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});

export default withSentry;
