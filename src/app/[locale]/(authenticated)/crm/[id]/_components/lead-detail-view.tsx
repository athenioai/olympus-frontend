"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DURATION, EASING } from "@/lib/motion";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimelineView } from "../../_components/timeline-view";
import { deleteLead } from "../../actions";
import type {
  LeadPublic,
  LeadStatus,
  TimelineEntry,
} from "@/lib/services/interfaces/lead-service";

const STATUS_CONFIG: Record<
  LeadStatus,
  { color: string; bg: string }
> = {
  new: { color: "text-teal", bg: "bg-teal/10" },
  contacted: { color: "text-primary", bg: "bg-primary/10" },
  qualified: { color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/10" },
  converted: { color: "text-success", bg: "bg-success/10" },
  lost: { color: "text-danger", bg: "bg-danger/10" },
};

interface LeadDetailViewProps {
  readonly lead: LeadPublic;
  readonly timeline: readonly TimelineEntry[];
}

/**
 * Full detail view for a single lead with edit, delete, and timeline.
 */
export function LeadDetailView({
  lead,
  timeline,
}: LeadDetailViewProps) {
  const router = useRouter();
  const t = useTranslations("crm");
  const tc = useTranslations("common");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const statusCfg = STATUS_CONFIG[lead.status];

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteLead(lead.id);
      if (result.success) {
        toast.success(tc("delete"));
        router.push("/crm");
      } else {
        toast.error(result.error ?? tc("error"));
        setConfirmDelete(false);
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.normal, ease: EASING.out }}
      className="flex flex-col gap-6"
    >
      {/* Back link */}
      <Link
        href="/crm"
        className="inline-flex items-center gap-1.5 text-[13px] text-on-surface-variant transition-colors hover:text-on-surface"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {tc("back")}
      </Link>

      {/* Lead header card */}
      <div className="rounded-xl bg-surface-container-low p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-extrabold text-on-surface">
              {lead.name}
            </h1>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-on-surface-variant" />
                <span className="text-[14px] text-on-surface-variant">
                  {lead.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-on-surface-variant" />
                <span className="text-[14px] text-on-surface-variant">
                  {lead.phone ?? t("phonePlaceholder")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status & dates row */}
        <div className="mt-4 flex flex-wrap items-center gap-3 pt-4">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-medium",
              statusCfg.bg,
              statusCfg.color,
            )}
          >
            {t(`stages.${lead.status}`)}
          </span>
          <span className="text-[12px] text-on-surface-variant">
            {formatDate(lead.created_at, "pt-BR")}
          </span>
          <span className="text-[12px] text-on-surface-variant">
            {formatDate(lead.updated_at, "pt-BR")}
          </span>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-xl bg-danger-muted p-4"
        >
          <p className="text-[13px] text-danger">{t("deleteConfirm")}</p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
            >
              {tc("cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? tc("loading") : tc("confirm")}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div>
        <h2 className="mb-4 font-display text-lg font-extrabold text-on-surface">
          {t("timeline")}
        </h2>
        <TimelineView entries={timeline} />
      </div>
    </motion.div>
  );
}
