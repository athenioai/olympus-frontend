"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AuthenticatedError({
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-muted">
        <AlertTriangle className="h-8 w-8 text-danger" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-xl font-bold text-on-surface">
          {t("error")}
        </h2>
      </div>
      <button
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
        onClick={reset}
        type="button"
      >
        <RotateCcw className="h-4 w-4" />
        {t("back")}
      </button>
    </div>
  );
}
