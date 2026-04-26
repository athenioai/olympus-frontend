"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cancelSubscription } from "../actions";

interface CancelModalProps {
  readonly currentPeriodEnd: string;
  readonly onClose: () => void;
  readonly onConfirmed: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function CancelModal({
  currentPeriodEnd,
  onClose,
  onConfirmed,
}: CancelModalProps) {
  const t = useTranslations("billing.cancelModal");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await cancelSubscription(formData);
      if (result.success) {
        onConfirmed();
      } else {
        toast.error(result.error ?? tc("error"));
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={() => {}}
        role="presentation"
      />
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md rounded-xl bg-surface-container-lowest shadow-ambient-strong"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="px-8 pb-4 pt-8">
          <h2 className="font-display text-xl font-bold tracking-tight text-on-surface">
            {t("title")}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-8 pb-6">
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {t("body", { date: formatDate(currentPeriodEnd) })}
            </p>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-on-surface"
                htmlFor="cancel-reason"
              >
                {t("reasonLabel")}
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-xl bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
                id="cancel-reason"
                maxLength={500}
                name="reason"
                placeholder={t("reasonPlaceholder")}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-surface-container-high px-8 py-5">
            <button
              className="h-10 rounded-xl px-5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
              disabled={isPending}
              onClick={onClose}
              type="button"
            >
              {tc("cancel")}
            </button>
            <button
              className="flex h-10 items-center gap-2 rounded-xl bg-danger px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("confirm")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
