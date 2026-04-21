"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LeadPublic } from "@/lib/services/interfaces/lead-service";
import { createLead } from "../actions";

const createLeadSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(320),
  phone: z.string().max(50).optional(),
});

interface CreateLeadDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /**
   * Called with the freshly created lead when the server action succeeds.
   * The parent is responsible for inserting it into the board state —
   * `revalidatePath` on the action only busts the server cache, it does
   * not re-initialize the client component's local `board` state.
   */
  readonly onCreated?: (lead: LeadPublic) => void;
}

/**
 * Modal dialog for creating a new lead with client-side Zod validation.
 */
export function CreateLeadDialog({
  open,
  onClose,
  onCreated,
}: CreateLeadDialogProps) {
  const t = useTranslations("crm");
  const tc = useTranslations("common");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setError("");
  }

  function handleClose() {
    if (isPending) return;
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = createLeadSchema.safeParse({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tc("error"));
      return;
    }

    startTransition(async () => {
      const result = await createLead(
        parsed.data.name,
        parsed.data.email,
        parsed.data.phone,
      );
      if (result.success && result.data) {
        toast.success(t("newLead"));
        onCreated?.(result.data);
        reset();
        onClose();
      } else {
        setError(result.error ?? tc("error"));
      }
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-on-surface/20 backdrop-blur-sm"
            onClick={handleClose}
          />
          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-ambient-strong"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-extrabold text-on-surface">
                  {t("newLead")}
                </h2>
                <button
                  onClick={handleClose}
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lead-name">{t("nameLabel")} *</Label>
                  <Input
                    id="lead-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    maxLength={255}
                    required
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lead-email">{t("emailLabel")} *</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    required
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lead-phone">{t("phoneLabel")}</Label>
                  <Input
                    id="lead-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("phonePlaceholder")}
                    maxLength={50}
                    disabled={isPending}
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-danger-muted px-3 py-2 text-[13px] text-danger">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClose}
                    disabled={isPending}
                  >
                    {tc("cancel")}
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? tc("loading") : tc("create")}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
