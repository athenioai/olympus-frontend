"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarOff,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CalendarX2,
  Clock,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { fetchExceptions, createException, updateException, deleteException } from "../business-exception-actions";
import type { BusinessException, ExceptionType, BusinessExceptionRange } from "@/lib/services";

export function BusinessExceptionSettings() {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState<BusinessException[]>([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [type, setType] = useState<ExceptionType>("closed");
  const [reason, setReason] = useState("");
  const [ranges, setRanges] = useState<BusinessExceptionRange[]>([]);

  const loadExceptions = useCallback(async () => {
    const result = await fetchExceptions();
    if (result.success && result.data) {
      setExceptions(result.data.sort((a, b) => a.date.localeCompare(b.date)));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadExceptions(); }, [loadExceptions]);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setDate("");
    setType("closed");
    setReason("");
    setRanges([]);
  }

  function startEdit(ex: BusinessException) {
    setEditingId(ex.id);
    setDate(ex.date);
    setType(ex.type);
    setReason(ex.reason ?? "");
    setRanges([...ex.ranges]);
    setShowForm(true);
  }

  function handleSave() {
    if (!date) return;
    if (type === "special_hours" && ranges.length === 0) {
      toast.error("Adicione pelo menos um horário");
      return;
    }

    startTransition(async () => {
      const payload = {
        date,
        type,
        reason: reason.trim() || undefined,
        ...(type === "special_hours" ? { ranges } : {}),
      };

      if (editingId) {
        const result = await updateException(editingId, payload);
        if (result.success && result.data) {
          setExceptions((prev) => prev.map((e) => e.id === editingId ? result.data! : e).sort((a, b) => a.date.localeCompare(b.date)));
          toast.success(t("saved"));
          resetForm();
        } else {
          toast.error(result.error ?? "Erro ao salvar");
        }
      } else {
        const result = await createException(payload);
        if (result.success && result.data) {
          setExceptions((prev) => [...prev, result.data!].sort((a, b) => a.date.localeCompare(b.date)));
          toast.success(t("saved"));
          resetForm();
        } else {
          toast.error(result.error ?? "Erro ao criar");
        }
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm(t("exceptions.deleteConfirm"))) return;
    startTransition(async () => {
      const result = await deleteException(id);
      if (result.success) {
        setExceptions((prev) => prev.filter((e) => e.id !== id));
      } else {
        toast.error(result.error ?? "Erro ao excluir");
      }
    });
  }

  function formatDateDisplay(d: string): string {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }

  const inputCls = "w-full rounded-xl bg-surface-container-high border-none px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20";

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-on-surface-variant/40" />
      </div>
    );
  }

  return (
    <motion.div animate="visible" className="space-y-10" initial="hidden" variants={staggerContainer}>
      {/* Hero */}
      <motion.div className="flex items-end justify-between" variants={fadeInUp}>
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-on-surface">
            {t("exceptions.title")}
          </h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-on-surface-variant">
            {t("exceptions.subtitle")}
          </p>
        </div>
        <button
          className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90"
          onClick={() => { resetForm(); setShowForm(true); }}
          type="button"
        >
          <Plus className="h-4 w-4" />
          {t("exceptions.add")}
        </button>
      </motion.div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden rounded-xl bg-surface-container-low/60 p-6"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-[12px] font-semibold text-on-surface-variant">{t("exceptions.date")}</label>
                  <input className={inputCls} onChange={(e) => setDate(e.target.value)} type="date" value={date} />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-on-surface-variant">{t("exceptions.type")}</label>
                  <select
                    className={inputCls}
                    onChange={(e) => {
                      const v = e.target.value as ExceptionType;
                      setType(v);
                      if (v === "closed") setRanges([]);
                    }}
                    value={type}
                  >
                    <option value="closed">{t("exceptions.types.closed")}</option>
                    <option value="special_hours">{t("exceptions.types.special_hours")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-on-surface-variant">{t("exceptions.reason")}</label>
                  <input className={inputCls} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder={t("exceptions.reasonPlaceholder")} value={reason} />
                </div>
              </div>

              {/* Ranges for special_hours */}
              {type === "special_hours" && (
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-on-surface-variant">{t("exceptions.ranges")}</label>
                  {ranges.map((range, idx) => (
                    <div className="flex items-center gap-2" key={idx}>
                      <div className="flex items-center gap-1.5 rounded-lg border border-surface-container-high bg-surface-container-lowest/50 px-3 py-1.5">
                        <input
                          className="h-7 w-[60px] rounded-md bg-transparent px-1 text-center font-mono text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                          maxLength={5}
                          onChange={(e) => setRanges((prev) => prev.map((r, i) => i === idx ? { ...r, startTime: e.target.value } : r))}
                          placeholder="09:00"
                          value={range.startTime}
                        />
                        <span className="text-xs text-on-surface-variant/40">–</span>
                        <input
                          className="h-7 w-[60px] rounded-md bg-transparent px-1 text-center font-mono text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                          maxLength={5}
                          onChange={(e) => setRanges((prev) => prev.map((r, i) => i === idx ? { ...r, endTime: e.target.value } : r))}
                          placeholder="12:00"
                          value={range.endTime}
                        />
                        <button
                          className="ml-1 flex h-5 w-5 items-center justify-center rounded text-on-surface-variant/30 transition-colors hover:bg-danger-muted hover:text-danger"
                          onClick={() => setRanges((prev) => prev.filter((_, i) => i !== idx))}
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className="flex items-center gap-1 text-[12px] font-semibold text-primary transition-colors hover:text-primary/80"
                    onClick={() => setRanges((prev) => [...prev, { startTime: "09:00", endTime: "12:00" }])}
                    type="button"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t("exceptions.addRange")}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
                  disabled={isPending}
                  onClick={resetForm}
                  type="button"
                >
                  {t("exceptions.cancel")}
                </button>
                <button
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
                  disabled={isPending || !date}
                  onClick={handleSave}
                  type="button"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("exceptions.save")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {exceptions.length === 0 ? (
        <motion.div className="flex flex-col items-center justify-center py-16 text-center" variants={fadeInUp}>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high/50">
            <Inbox className="h-7 w-7 text-on-surface-variant/30" />
          </div>
          <p className="text-sm font-medium text-on-surface-variant">{t("exceptions.empty")}</p>
          <p className="mt-1 max-w-xs text-[12px] text-on-surface-variant/60">{t("exceptions.emptyHint")}</p>
        </motion.div>
      ) : (
        <motion.div className="space-y-2" variants={staggerContainer}>
          {exceptions.map((ex) => (
            <motion.div
              className="flex items-center gap-4 rounded-xl bg-surface-container-low/40 p-4"
              key={ex.id}
              variants={fadeInUp}
            >
              {/* Date badge */}
              <div className={cn(
                "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl",
                ex.type === "closed" ? "bg-danger/8" : "bg-primary/8",
              )}>
                <span className={cn("text-[10px] font-bold uppercase", ex.type === "closed" ? "text-danger" : "text-primary")}>
                  {ex.date.split("-")[1]}/{ex.date.split("-")[0].slice(2)}
                </span>
                <span className={cn("text-lg font-extrabold leading-none", ex.type === "closed" ? "text-danger" : "text-on-surface")}>
                  {ex.date.split("-")[2]}
                </span>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-on-surface">
                    {ex.reason ?? formatDateDisplay(ex.date)}
                  </span>
                  <span className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                    ex.type === "closed" ? "bg-danger/8 text-danger" : "bg-primary/8 text-primary",
                  )}>
                    {ex.type === "closed" ? t("exceptions.closed") : t("exceptions.specialHours")}
                  </span>
                </div>
                {ex.type === "special_hours" && ex.ranges.length > 0 && (
                  <div className="mt-1 flex items-center gap-2">
                    <Clock className="h-3 w-3 text-on-surface-variant/50" />
                    <span className="text-[12px] text-on-surface-variant">
                      {ex.ranges.map((r) => `${r.startTime}–${r.endTime}`).join(" | ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant/40 transition-colors hover:bg-surface-container-high hover:text-on-surface"
                  onClick={() => startEdit(ex)}
                  type="button"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant/40 transition-colors hover:bg-danger-muted hover:text-danger"
                  disabled={isPending}
                  onClick={() => handleDelete(ex.id)}
                  type="button"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
