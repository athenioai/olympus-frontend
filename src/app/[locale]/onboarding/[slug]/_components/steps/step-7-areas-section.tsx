"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Section } from "./step-7-primitives";

export interface ServiceAreaDraft {
  readonly id: number;
  name: string;
}

interface ServiceAreasSectionProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly areas: readonly ServiceAreaDraft[];
  readonly onChange: (areas: readonly ServiceAreaDraft[]) => void;
}

export function ServiceAreasSection({
  isOpen,
  onToggle,
  areas,
  onChange,
}: ServiceAreasSectionProps) {
  const t = useTranslations("onboarding.step7");

  function updateArea(id: number, name: string) {
    onChange(areas.map((a) => (a.id === id ? { ...a, name } : a)));
  }

  function removeArea(id: number) {
    onChange(areas.filter((a) => a.id !== id));
  }

  function addArea() {
    onChange([...areas, { id: Date.now(), name: "" }]);
  }

  return (
    <Section isOpen={isOpen} onToggle={onToggle} title={t("areasSection")}>
      <div className="space-y-3">
        {areas.map((area) => (
          <div className="flex items-end gap-2" key={area.id}>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-on-surface">
                {t("areaNameLabel")}
              </label>
              <input
                className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/30"
                onChange={(e) => updateArea(area.id, e.target.value)}
                type="text"
                value={area.name}
              />
            </div>
            <button
              aria-label="remove"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:text-danger"
              onClick={() => removeArea(area.id)}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          onClick={addArea}
          type="button"
        >
          <Plus className="h-4 w-4" />
          {t("addArea")}
        </button>
      </div>
    </Section>
  );
}
