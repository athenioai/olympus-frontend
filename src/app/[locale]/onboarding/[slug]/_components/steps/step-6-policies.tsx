"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updatePoliciesAction } from "../../actions";
import type { StepProps } from "../wizard";

export function Step6Policies({ state, onAdvance, onBack }: StepProps) {
  const t = useTranslations("onboarding.step6");
  const tc = useTranslations("common");
  const tNav = useTranslations("onboarding");

  const [paymentPolicy, setPaymentPolicy] = useState(
    state.profileView?.profile?.paymentPolicy ?? "",
  );
  const [cancellationPolicy, setCancellationPolicy] = useState(
    state.profileView?.profile?.cancellationPolicy ?? "",
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updatePoliciesAction(formData);
      if (!result.success || !result.profileView) {
        toast.error(tNav("genericError"));
        return;
      }
      onAdvance({ profileView: result.profileView }, 7);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        {t("title")}
      </h2>

      <div className="space-y-2">
        <label
          className="block font-display text-sm font-semibold text-on-surface"
          htmlFor="paymentPolicy"
        >
          {t("paymentLabel")}
        </label>
        <textarea
          className="min-h-[100px] w-full resize-y rounded-xl border-none bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
          id="paymentPolicy"
          name="paymentPolicy"
          onChange={(e) => setPaymentPolicy(e.target.value)}
          placeholder={t("paymentPlaceholder")}
          required
          value={paymentPolicy}
        />
      </div>

      <div className="space-y-2">
        <label
          className="block font-display text-sm font-semibold text-on-surface"
          htmlFor="cancellationPolicy"
        >
          {t("cancellationLabel")}
        </label>
        <textarea
          className="min-h-[100px] w-full resize-y rounded-xl border-none bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
          id="cancellationPolicy"
          name="cancellationPolicy"
          onChange={(e) => setCancellationPolicy(e.target.value)}
          placeholder={t("cancellationPlaceholder")}
          required
          value={cancellationPolicy}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          className="text-sm font-medium text-on-surface-variant hover:text-on-surface"
          onClick={onBack}
          type="button"
        >
          {tNav("back")}
        </button>
        <button
          className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-6 font-display font-bold text-on-primary shadow-lg shadow-primary/10 transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? tc("loading") : tNav("next")}
        </button>
      </div>
    </form>
  );
}
