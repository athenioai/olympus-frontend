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
      <div className="flex flex-col gap-3">
        {areas.map((area) => (
          <div className="flex items-end gap-2" key={area.id}>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="onb-field-label">{t("areaNameLabel")}</label>
              <input
                className="onb-input"
                onChange={(e) => updateArea(area.id, e.target.value)}
                type="text"
                value={area.name}
              />
            </div>
            <button
              aria-label="remove"
              className="flex size-12 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-danger"
              onClick={() => removeArea(area.id)}
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <button className="onb-suggest" onClick={addArea} type="button">
          <Plus className="size-3" />
          {t("addArea")}
        </button>
      </div>
    </Section>
  );
}
