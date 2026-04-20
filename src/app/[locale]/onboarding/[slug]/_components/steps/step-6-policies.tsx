"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updatePoliciesAction } from "../../actions";
import type { StepProps } from "../wizard";
import { OnbNav } from "../onb-nav";

export function Step6Policies({
  state,
  onAdvance,
  onBack,
  onSkip,
}: StepProps) {
  const t = useTranslations("onboarding.step6");
  const tNav = useTranslations("onboarding");

  const [paymentPolicy, setPaymentPolicy] = useState(
    state.profileView?.profile?.paymentPolicy ?? "",
  );
  const [cancellationPolicy, setCancellationPolicy] = useState(
    state.profileView?.profile?.cancellationPolicy ?? "",
  );
  const [isPending, startTransition] = useTransition();

  const canContinue =
    paymentPolicy.trim().length > 0 && cancellationPolicy.trim().length > 0;

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
    <form action={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="onb-field-label" htmlFor="paymentPolicy">
          {t("paymentLabel")}
        </label>
        <textarea
          className="onb-textarea"
          id="paymentPolicy"
          name="paymentPolicy"
          onChange={(e) => setPaymentPolicy(e.target.value)}
          placeholder={t("paymentPlaceholder")}
          required
          value={paymentPolicy}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="onb-field-label" htmlFor="cancellationPolicy">
          {t("cancellationLabel")}
        </label>
        <textarea
          className="onb-textarea"
          id="cancellationPolicy"
          name="cancellationPolicy"
          onChange={(e) => setCancellationPolicy(e.target.value)}
          placeholder={t("cancellationPlaceholder")}
          required
          value={cancellationPolicy}
        />
      </div>

      <OnbNav
        canContinue={canContinue}
        isPending={isPending}
        onBack={onBack}
        onSkip={onSkip}
      />
    </form>
  );
}
