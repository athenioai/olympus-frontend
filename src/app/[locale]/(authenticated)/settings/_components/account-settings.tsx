"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import {
  fetchCurrentUser,
  updateAccountAction,
} from "../account-actions";

export function AccountSettings() {
  const t = useTranslations("settings.account");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initialName, setInitialName] = useState("");
  const [initialEmail, setInitialEmail] = useState("");

  const loadUser = useCallback(async () => {
    const result = await fetchCurrentUser();
    if (result.success && result.data) {
      setName(result.data.name);
      setEmail(result.data.email);
      setInitialName(result.data.name);
      setInitialEmail(result.data.email);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  function handleSave() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      toast.error(t("errors.nameTooShort"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error(t("errors.emailInvalid"));
      return;
    }

    const payload: { name?: string; email?: string } = {};
    if (trimmedName !== initialName) payload.name = trimmedName;
    if (trimmedEmail !== initialEmail) payload.email = trimmedEmail;
    if (!payload.name && !payload.email) {
      toast.info(t("nothingChanged"));
      return;
    }

    startTransition(async () => {
      const result = await updateAccountAction(payload);
      if (!result.success) {
        if (result.error === "EMAIL_TAKEN") {
          toast.error(t("errors.emailTaken"));
          return;
        }
        toast.error(result.error ?? t("errors.generic"));
        return;
      }
      if (result.data) {
        setInitialName(result.data.name);
        setInitialEmail(result.data.email);
      }
      toast.success(t("saved"));
    });
  }

  const dirty = name.trim() !== initialName || email.trim() !== initialEmail;

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-on-surface-variant/40" />
      </div>
    );
  }

  return (
    <motion.div
      animate="visible"
      className="space-y-6"
      initial="hidden"
      variants={staggerContainer}
    >
      <motion.div className="flex items-center gap-3" variants={fadeInUp}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-on-surface">
            {t("title")}
          </h2>
          <p className="text-[13px] text-on-surface-variant">{t("subtitle")}</p>
        </div>
      </motion.div>

      <motion.section className="space-y-5 rounded-xl bg-surface-container-low p-6" variants={fadeInUp}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-on-surface" htmlFor="account-name">
            {t("name")}
          </label>
          <input
            autoComplete="name"
            className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
            id="account-name"
            maxLength={120}
            minLength={2}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            type="text"
            value={name}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-on-surface" htmlFor="account-email">
            {t("email")}
          </label>
          <input
            autoComplete="email"
            className="h-10 w-full rounded-xl bg-surface-container-high px-4 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
            id="account-email"
            maxLength={255}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            type="email"
            value={email}
          />
          <p className="text-xs text-on-surface-variant">{t("emailHint")}</p>
        </div>
        <div className="flex justify-end">
          <button
            className="h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-5 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 transition-opacity hover:opacity-90 disabled:opacity-60"
            disabled={isPending || !dirty}
            onClick={handleSave}
            type="button"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}
