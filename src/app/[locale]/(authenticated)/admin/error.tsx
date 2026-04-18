"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface AdminErrorProps {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  const t = useTranslations("admin.errorBoundary");
  const tc = useTranslations("common");

  useEffect(() => {
    console.error("[admin] unhandled error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-surface-container-lowest p-8 shadow-ambient">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-muted">
          <AlertTriangle className="h-6 w-6 text-danger" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-xl font-bold text-on-surface">
            {t("title")}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {error.message || tc("error")}
          </p>
        </div>
        {error.digest && (
          <p className="font-mono text-[10px] text-on-surface-variant/60">
            {error.digest}
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 transition-all duration-200 active:scale-[0.98]"
            onClick={reset}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            {t("retry")}
          </button>
          <Link
            className="flex h-10 items-center rounded-xl bg-surface-container-high px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
            href="/admin/dashboard"
          >
            {t("backToAdmin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
