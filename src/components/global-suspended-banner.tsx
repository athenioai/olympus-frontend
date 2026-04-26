"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import {
  getSuspended,
  subscribe,
} from "@/lib/subscription-banner-store";
import { getOverdueInvoiceUrl } from "@/app/[locale]/(authenticated)/billing/actions";

/**
 * Sticky banner shown when the tenant subscription is suspended.
 * Reads from the global subscription-banner-store and offers
 * "Pay now" (opens overdue invoice) and "Go to Billing" actions.
 */
export function GlobalSuspendedBanner() {
  const t = useTranslations("billing.globalSuspended");
  const [suspended, setLocal] = useState<boolean>(getSuspended());

  useEffect(() => subscribe(setLocal), []);

  if (!suspended) return null;

  async function payNow() {
    try {
      const url = await getOverdueInvoiceUrl();
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch {
      // fall through — user can navigate to /billing manually
    }
  }

  return (
    <div className="sticky top-0 z-40 border-b border-danger/30 bg-danger/10 px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
        <div className="flex-1">
          <p className="text-sm font-bold text-danger">{t("title")}</p>
          <p className="text-[13px] text-on-surface">{t("body")}</p>
        </div>
        <button
          className="h-9 rounded-xl bg-danger px-4 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
          onClick={payNow}
          type="button"
        >
          {t("payNow")}
        </button>
        <Link
          className="inline-flex h-9 items-center rounded-xl border border-danger/40 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
          href="/billing"
        >
          {t("goToBilling")}
        </Link>
      </div>
    </div>
  );
}
