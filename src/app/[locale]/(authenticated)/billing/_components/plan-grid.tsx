"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { subscribePlan } from "../actions";
import type { PlanOption } from "@/lib/services/plan-options-source";

interface PlanGridProps {
  readonly plans: readonly PlanOption[];
}

export function PlanGrid({ plans }: PlanGridProps) {
  const t = useTranslations("billing");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(
    null,
  );

  function handleSubscribe(planId: string) {
    setSubscribingPlanId(planId);
    startTransition(async () => {
      const result = await subscribePlan(planId);
      if (result.success && result.data) {
        setInvoiceUrl(result.data.asaasInvoiceUrl);
        window.open(result.data.asaasInvoiceUrl, "_blank");
        router.refresh();
      } else {
        toast.error(result.error ?? tc("error"));
        setSubscribingPlanId(null);
      }
    });
  }

  if (invoiceUrl) {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[400px] flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-8 text-center"
        initial={{ opacity: 0, y: 12 }}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
        </div>
        <p className="font-display text-lg font-bold text-on-surface">
          {t("subscribeProcessing")}
        </p>
        <a
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          href={invoiceUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink className="h-4 w-4" />
          {t("subscribeOpenInvoice")}
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div animate="visible" initial="hidden" variants={staggerContainer}>
      <motion.div className="mb-8" variants={fadeInUp}>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-on-surface">
          {t("choosePlan.title")}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {t("choosePlan.subtitle")}
        </p>
      </motion.div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
      >
        {plans.map((plan) => {
          const disabled = plan.id === null;
          const isLoading = isPending && subscribingPlanId === plan.id;

          return (
            <motion.div
              className="flex flex-col rounded-xl bg-surface-container-lowest p-6 transition-colors hover:bg-surface-container-low/50"
              key={plan.slug}
              variants={fadeInUp}
            >
              <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">
                {plan.name}
              </h3>
              <p className="mt-1 text-[13px] text-on-surface-variant">
                {t(`plans.${plan.slug}.features`)}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-2xl font-extrabold text-on-surface">
                  R$ {plan.cost.toFixed(0)}
                </span>
                <span className="text-sm text-on-surface-variant">
                  {t("monthly")}
                </span>
              </div>
              <div className="mt-auto pt-6">
                <button
                  className={cn(
                    "flex h-10 w-full items-center justify-center rounded-xl text-sm font-bold transition-opacity",
                    disabled
                      ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant/50"
                      : "bg-primary text-on-primary hover:opacity-90",
                    isLoading && "opacity-60",
                  )}
                  disabled={disabled || isPending}
                  onClick={() => plan.id && handleSubscribe(plan.id)}
                  title={
                    disabled
                      ? "Aguardando catálogo do servidor"
                      : undefined
                  }
                  type="button"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("subscribe")
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
