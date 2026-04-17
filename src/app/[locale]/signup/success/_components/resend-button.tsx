"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { resendSignupAction } from "../../actions";

const COOLDOWN_SECONDS = 30;

export function ResendButton() {
  const t = useTranslations("signup.success");
  const te = useTranslations("signup.errors");
  const [isPending, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function handleClick() {
    startTransition(async () => {
      const result = await resendSignupAction();
      if (!result.success) {
        toast.error(te("generic"));
        return;
      }
      toast.success(t("resent"));
      setCooldown(COOLDOWN_SECONDS);
    });
  }

  const disabled = isPending || cooldown > 0;
  const label =
    cooldown > 0 ? t("resendCooldown", { seconds: cooldown }) : t("resend");

  return (
    <button
      className="font-bold text-primary transition-opacity hover:opacity-70 disabled:opacity-40"
      disabled={disabled}
      onClick={handleClick}
      type="button"
    >
      {label}
    </button>
  );
}
