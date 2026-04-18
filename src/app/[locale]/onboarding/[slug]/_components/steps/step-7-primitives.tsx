"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface SectionProps {
  readonly title: string;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}

export function Section({ title, isOpen, onToggle, children }: SectionProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-high">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="font-display text-sm font-semibold text-on-surface">
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-on-surface-variant transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="border-t border-white/40 p-4">{children}</div>}
    </div>
  );
}

interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly maxLength?: number;
}

export function TextField({
  label,
  value,
  onChange,
  maxLength,
}: TextFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-on-surface">
        {label}
      </label>
      <input
        className="h-10 w-full rounded-lg bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary/30"
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        type="text"
        value={value}
      />
    </div>
  );
}
