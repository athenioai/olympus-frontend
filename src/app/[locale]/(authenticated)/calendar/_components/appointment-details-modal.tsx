"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/services";

interface AppointmentDetailsModalProps {
  readonly appointment: Appointment | null;
  readonly onClose: () => void;
}

/**
 * Minimal read-only details for a selected appointment. The backend
 * currently exposes id/serviceId/date/startTime/endTime/status — we
 * surface them as-is here. Actions (confirm / cancel / reassign) live
 * in follow-up work once the backend contract grows to include lead
 * metadata.
 */
export function AppointmentDetailsModal({
  appointment,
  onClose,
}: AppointmentDetailsModalProps) {
  const t = useTranslations("calendar");

  useEffect(() => {
    if (!appointment) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [appointment, onClose]);

  if (!appointment) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30 p-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={() => {}}
      role="dialog"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-ambient"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-on-surface">
            {t("appointmentDetails")}
          </h2>
          <button
            aria-label="close"
            className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="space-y-3 text-sm">
          <Row label={t("detail.date")} value={appointment.date} />
          <Row
            label={t("detail.time")}
            value={`${appointment.startTime.slice(0, 5)} – ${appointment.endTime.slice(0, 5)}`}
          />
          <Row
            label={t("detail.status")}
            value={
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                  appointment.status === "confirmed"
                    ? "bg-success-muted text-success"
                    : "bg-danger-muted text-danger",
                )}
              >
                {t(`status.${appointment.status}`)}
              </span>
            }
          />
          <Row
            label={t("detail.serviceId")}
            value={
              <span className="font-mono text-xs text-on-surface-variant">
                {appointment.serviceId}
              </span>
            }
          />
        </dl>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="text-right font-medium text-on-surface">{value}</dd>
    </div>
  );
}
