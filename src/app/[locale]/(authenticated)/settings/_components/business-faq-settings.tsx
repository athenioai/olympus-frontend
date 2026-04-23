"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  Loader2,
  MessageSquare,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { fetchFaqs, createFaq, updateFaq, deleteFaq } from "../business-faq-actions";
import type { BusinessFaq } from "@/lib/services";

export function BusinessFaqSettings() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<BusinessFaq[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<BusinessFaq | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const loadFaqs = useCallback(async () => {
    const result = await fetchFaqs();
    if (result.success && result.data) {
      setFaqs(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadFaqs(); }, [loadFaqs]);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setQuestion("");
    setAnswer("");
  }

  function startEdit(faq: BusinessFaq) {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setShowForm(true);
  }

  function handleSave() {
    // Button is disabled when either field is empty, but keyboard submission
    // can still reach this path — surface a toast instead of failing silently.
    if (!question.trim() || !answer.trim()) {
      toast.error(t("faqs.validationRequired"));
      return;
    }

    startTransition(async () => {
      if (editingId) {
        const result = await updateFaq(editingId, { question: question.trim(), answer: answer.trim() });
        if (result.success && result.data) {
          setFaqs((prev) => prev.map((f) => f.id === editingId ? result.data! : f));
          toast.success(t("saved"));
          resetForm();
        } else {
          toast.error(result.error ?? "Erro ao salvar");
        }
      } else {
        const result = await createFaq({ question: question.trim(), answer: answer.trim() });
        if (result.success && result.data) {
          setFaqs((prev) => [...prev, result.data!]);
          toast.success(t("saved"));
          resetForm();
        } else {
          toast.error(result.error ?? "Erro ao criar");
        }
      }
    });
  }

  function handleConfirmDelete() {
    if (!faqToDelete) return;
    const target = faqToDelete;
    startTransition(async () => {
      const result = await deleteFaq(target.id);
      if (result.success) {
        setFaqs((prev) => prev.filter((f) => f.id !== target.id));
        if (expandedId === target.id) setExpandedId(null);
        setFaqToDelete(null);
        toast.success(tc("delete"));
      } else {
        toast.error(result.error ?? "Erro ao excluir");
      }
    });
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
            {t("faqs.title")}
          </h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-on-surface-variant">
            {t("faqs.subtitle")}
          </p>
        </div>
        <button
          className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90"
          onClick={() => { resetForm(); setShowForm(true); }}
          type="button"
        >
          <Plus className="h-4 w-4" />
          {t("faqs.add")}
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
              <div>
                <label className="text-[12px] font-semibold text-on-surface-variant">{t("faqs.question")}</label>
                <input
                  className={inputCls}
                  maxLength={500}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t("faqs.questionPlaceholder")}
                  value={question}
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-on-surface-variant">{t("faqs.answer")}</label>
                <textarea
                  className={`${inputCls} min-h-[100px] resize-none`}
                  maxLength={2000}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={t("faqs.answerPlaceholder")}
                  value={answer}
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
                  disabled={isPending}
                  onClick={resetForm}
                  type="button"
                >
                  {t("faqs.cancel")}
                </button>
                <button
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
                  disabled={isPending}
                  onClick={handleSave}
                  type="button"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("faqs.save")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ list */}
      {faqs.length === 0 ? (
        <motion.div className="flex flex-col items-center justify-center py-16 text-center" variants={fadeInUp}>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high/50">
            <Inbox className="h-7 w-7 text-on-surface-variant/30" />
          </div>
          <p className="text-sm font-medium text-on-surface-variant">{t("faqs.empty")}</p>
          <p className="mt-1 max-w-xs text-[12px] text-on-surface-variant/60">{t("faqs.emptyHint")}</p>
        </motion.div>
      ) : (
        <motion.div className="space-y-2" variants={staggerContainer}>
          {faqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <motion.div
                className="rounded-xl bg-surface-container-low/40 transition-colors"
                key={faq.id}
                variants={fadeInUp}
              >
                {/* Header */}
                <button
                  className="flex w-full items-center gap-3 p-5 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                  type="button"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <span className="flex-1 text-[14px] font-semibold text-on-surface">{faq.question}</span>
                  <ChevronDown className={cn("h-4 w-4 text-on-surface-variant transition-transform duration-200", isExpanded && "rotate-180")} />
                </button>

                {/* Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      animate={{ height: "auto", opacity: 1 }}
                      className="overflow-hidden"
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="border-t border-surface-container-high/30 px-5 pb-5 pt-4">
                        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-on-surface-variant">{faq.answer}</p>
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
                            onClick={() => startEdit(faq)}
                            type="button"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            {t("faqs.edit")}
                          </button>
                          <button
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-danger transition-colors hover:bg-danger-muted"
                            disabled={isPending}
                            onClick={() => setFaqToDelete(faq)}
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t("faqs.delete")}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <ConfirmDialog
        cancelLabel={tc("cancel")}
        confirmLabel={tc("delete")}
        description={t("faqs.deleteConfirm")}
        isPending={isPending}
        onCancel={() => setFaqToDelete(null)}
        onConfirm={handleConfirmDelete}
        open={faqToDelete !== null}
        title={tc("confirm")}
        variant="danger"
      />
    </motion.div>
  );
}
