"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { WsManager } from "@/lib/ws-manager";
import { setSuspended } from "@/lib/subscription-banner-store";

interface SubscriptionEventsProviderProps {
  readonly wsUrl: string;
  readonly token: string;
}

const SUBSCRIPTION_EVENTS = [
  "subscription.payment_confirmed",
  "subscription.past_due",
  "subscription.suspended",
  "subscription.refunded",
  "subscription.activated",
] as const;

/**
 * Mounted once in the authenticated layout. Opens a WsManager for the
 * subscription.* event channel; toasts + flips global suspended state +
 * triggers `router.refresh()` when the current page is /billing so the
 * server component re-fetches /me and /me/payments.
 */
export function SubscriptionEventsProvider({
  wsUrl,
  token,
}: SubscriptionEventsProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("billing.toasts");

  useEffect(() => {
    if (!token || !wsUrl) return;

    const isOnBilling = pathname.endsWith("/billing");

    const manager = new WsManager({ url: wsUrl, token });

    const refreshIfBilling = () => {
      if (isOnBilling) router.refresh();
    };

    manager.register("subscription.payment_confirmed", () => {
      toast.success(t("wsPaymentConfirmed"));
      refreshIfBilling();
    });
    manager.register("subscription.past_due", () => {
      toast.warning(t("wsPastDue"));
    });
    manager.register("subscription.suspended", () => {
      toast.error(t("wsSuspended"));
      setSuspended(true);
      refreshIfBilling();
    });
    manager.register("subscription.refunded", () => {
      toast.success(t("wsRefunded"));
      refreshIfBilling();
    });
    manager.register("subscription.activated", () => {
      toast.success(t("wsActivated"));
      setSuspended(false);
      refreshIfBilling();
    });

    manager.connect();
    return () => {
      for (const ev of SUBSCRIPTION_EVENTS) manager.unregister(ev);
      manager.disconnect();
    };
  }, [wsUrl, token, router, pathname, t]);

  return null;
}
