"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateBusinessInfoAction } from "../../actions";
import type { StepProps } from "../wizard";
import { OnbNav } from "../onb-nav";

export function Step3Business({ state, onAdvance, onBack }: StepProps) {
  const t = useTranslations("onboarding.step3");
  const tNav = useTranslations("onboarding");

  const initialName = state.profileView?.profile?.businessName ?? "";
  const initialDescription =
    state.profileView?.profile?.businessDescription ?? "";

  const [businessName, setBusinessName] = useState(initialName);
  const [businessDescription, setBusinessDescription] =
    useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canContinue =
    businessName.trim().length >= 2 &&
    businessName.trim().length <= 120 &&
    businessDescription.trim().length >= 10 &&
    businessDescription.trim().length <= 2000;

  function handleSubmit(formData: FormData) {
    if (!canContinue) {
      const name = businessName.trim();
      if (name.length < 2 || name.length > 120) {
        setError(t("errorNameShort"));
      } else {
        setError(t("errorDescriptionShort"));
      }
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await updateBusinessInfoAction(formData);
      if (!result.success || !result.profileView) {
        toast.error(tNav("genericError"));
        return;
      }
      onAdvance({ profileView: result.profileView }, 4);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg bg-danger-muted px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="onb-field-label" htmlFor="businessName">
          {t("nameLabel")}
        </label>
        <input
          autoFocus
          className="onb-input"
          id="businessName"
          name="businessName"
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder={t("namePlaceholder")}
          required
          type="text"
          value={businessName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="onb-field-label" htmlFor="businessDescription">
          {t("descriptionLabel")}
        </label>
        <textarea
          className="onb-textarea"
          id="businessDescription"
          name="businessDescription"
          onChange={(e) => setBusinessDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          required
          value={businessDescription}
        />
      </div>

      <OnbNav
        canContinue={canContinue}
        isPending={isPending}
        onBack={onBack}
      />
    </form>
  );
}
