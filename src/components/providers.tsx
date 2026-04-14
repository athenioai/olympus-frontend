"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

interface ProvidersProps {
  readonly children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--color-surface-container-lowest)",
            color: "var(--color-on-surface)",
            border: "none",
            boxShadow: "var(--shadow-ambient)",
          },
        }}
      />
    </>
  );
}
