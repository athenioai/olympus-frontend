"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface GlobalErrorProps {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            Algo deu errado
          </h1>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>
            Nossa equipe foi notificada. Você pode tentar recarregar.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 10,
                opacity: 0.4,
                marginBottom: 16,
              }}
            >
              {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              border: "none",
              backgroundColor: "#fafafa",
              color: "#0a0a0a",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
