"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface SectionProps {
  readonly title: string;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}

/** Collapsible section card (editorial style) used inside step 7. */
export function Section({ title, isOpen, onToggle, children }: SectionProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-low transition-colors duration-200 hover:bg-surface-container-high">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="font-display text-[13.5px] font-semibold text-on-surface">
          {title}
        </span>
        <ChevronDown
          className={`size-4 text-on-surface-variant transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-surface-container-high/60 p-4">
          {children}
        </div>
      )}
    </div>
  );
}

interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly maxLength?: number;
  readonly placeholder?: string;
  readonly type?: "text" | "url" | "number";
}

export function TextField({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  type = "text",
}: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="onb-field-label">{label}</label>
      <input
        className="onb-input"
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </div>
  );
}
