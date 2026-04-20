"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WorkType } from "@/lib/services";
import type { WizardStep } from "../../onboarding/[slug]/_lib/types";

interface PreviewControlsProps {
  readonly step: WizardStep;
  readonly workType: WorkType | null;
  readonly verticalId: string | null;
  readonly bizName: string;
}

const VERTICAL_OPTIONS = [
  { id: "", label: "—" },
  { id: "beauty", label: "Beleza" },
  { id: "health", label: "Saúde" },
  { id: "fitness", label: "Fitness" },
  { id: "pet", label: "Pet" },
  { id: "education", label: "Educação" },
  { id: "services", label: "Serviços" },
];

const WORKTYPE_OPTIONS: readonly { value: WorkType | ""; label: string }[] = [
  { value: "", label: "—" },
  { value: "services", label: "Serviços" },
  { value: "sales", label: "Vendas" },
  { value: "hybrid", label: "Ambos" },
];

/**
 * Floating control bar for the admin onboarding preview.
 * Updates URL searchParams so the server-component re-renders the wizard
 * with the new mock state on every change.
 */
export function PreviewControls({
  step,
  workType,
  verticalId,
  bizName,
}: PreviewControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function pushParams(patch: Record<string, string>) {
    const next = new URLSearchParams();
    next.set("step", String(patch.step ?? step));
    const wt = patch.worktype ?? workType ?? "";
    if (wt) next.set("worktype", wt);
    const vt = patch.vertical ?? verticalId ?? "";
    if (vt) next.set("vertical", vt);
    const bz = patch.biz ?? bizName;
    if (bz) next.set("biz", bz);
    startTransition(() => {
      router.replace(`?${next.toString()}`);
    });
  }

  return (
    <div className="preview-controls" data-pending={isPending}>
      <span className="preview-controls-eyebrow">Admin · Preview</span>

      <div className="preview-controls-stepper">
        <button
          aria-label="Previous step"
          className="preview-controls-iconbtn"
          disabled={step <= 1}
          onClick={() => pushParams({ step: String(step - 1) })}
          type="button"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <span className="preview-controls-stepnum">
          Step <strong>{step}</strong>/8
        </span>
        <button
          aria-label="Next step"
          className="preview-controls-iconbtn"
          disabled={step >= 8}
          onClick={() => pushParams({ step: String(step + 1) })}
          type="button"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <label className="preview-controls-field">
        <span>Tipo</span>
        <select
          onChange={(e) => pushParams({ worktype: e.target.value })}
          value={workType ?? ""}
        >
          {WORKTYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="preview-controls-field">
        <span>Vertical</span>
        <select
          onChange={(e) => pushParams({ vertical: e.target.value })}
          value={verticalId ?? ""}
        >
          {VERTICAL_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="preview-controls-field">
        <span>Negócio</span>
        <input
          defaultValue={bizName}
          onBlur={(e) => pushParams({ biz: e.target.value })}
          placeholder="Studio Ápice"
          type="text"
        />
      </label>
    </div>
  );
}
