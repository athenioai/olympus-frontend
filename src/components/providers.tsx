"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

interface ProvidersProps {
  readonly children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={300}>
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
    </TooltipProvider>
  );
}
