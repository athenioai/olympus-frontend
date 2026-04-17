"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateBusinessInfoAction } from "../../actions";
import type { StepProps } from "../wizard";

export function Step4Business({ state, onAdvance, onBack }: StepProps) {
  const t = useTranslations("onboarding.step4");
  const tc = useTranslations("common");
  const tNav = useTranslations("onboarding");

  const initialName = state.profileView?.profile?.businessName ?? "";
  const initialDescription =
    state.profileView?.profile?.businessDescription ?? "";

  const [businessName, setBusinessName] = useState(initialName);
  const [businessDescription, setBusinessDescription] =
    useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function validate(): string | null {
    const name = businessName.trim();
    const desc = businessDescription.trim();
    if (name.length < 2 || name.length > 120) return t("errorNameShort");
    if (desc.length < 10 || desc.length > 2000) {
      return t("errorDescriptionShort");
    }
    return null;
  }

  function handleSubmit(formData: FormData) {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await updateBusinessInfoAction(formData);
      if (!result.success || !result.profileView) {
        toast.error(tNav("genericError"));
        return;
      }
      onAdvance({ profileView: result.profileView }, 5);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        {t("title")}
      </h2>

      {error && (
        <div className="rounded-lg bg-danger-muted px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label
          className="block font-display text-sm font-semibold text-on-surface"
          htmlFor="businessName"
        >
          {t("nameLabel")}
        </label>
        <input
          className="h-12 w-full rounded-xl border-none bg-surface-container-high px-4 text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
          id="businessName"
          name="businessName"
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder={t("namePlaceholder")}
          required
          type="text"
          value={businessName}
        />
      </div>

      <div className="space-y-2">
        <label
          className="block font-display text-sm font-semibold text-on-surface"
          htmlFor="businessDescription"
        >
          {t("descriptionLabel")}
        </label>
        <textarea
          className="min-h-[120px] w-full resize-y rounded-xl border-none bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
          id="businessDescription"
          name="businessDescription"
          onChange={(e) => setBusinessDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          required
          value={businessDescription}
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
