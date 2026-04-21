"use client";

import { useLayoutEffect, useRef } from "react";
import { formatBRL } from "@/lib/format";

interface BrlInputProps {
  /** Current value in cents (integer). */
  readonly cents: number;
  readonly onChange: (cents: number) => void;
  /** Optional cap in cents; digits beyond it are ignored. */
  readonly max?: number;
  readonly className?: string;
  readonly id?: string;
  readonly name?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly autoFocus?: boolean;
}

/**
 * Nubank-style currency input. Always displays `R$ X,XX`; each digit typed
 * shifts in from the right (0 → 0,01 → 0,12 → 1,23 ...). Backspace removes
 * the last digit. The caret stays anchored at the end so the mask never
 * ends up mid-edit. Value is held as integer cents to avoid float drift.
 */
export function BrlInput({
  cents,
  onChange,
  max,
  className,
  id,
  name,
  disabled,
  required,
  autoFocus,
}: BrlInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const displayValue = formatBRL(cents / 100);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el) return;
    const length = el.value.length;
    el.setSelectionRange(length, length);
  }, [displayValue]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const digits = event.target.value.replace(/\D/g, "");
    const next = digits === "" ? 0 : Number.parseInt(digits, 10);
    if (!Number.isFinite(next)) return;
    const capped = max !== undefined ? Math.min(next, max) : next;
    onChange(capped);
  }

  function anchorCaret(event: {
    currentTarget: HTMLInputElement;
  }): void {
    const el = event.currentTarget;
    const length = el.value.length;
    if (el.selectionStart !== length || el.selectionEnd !== length) {
      el.setSelectionRange(length, length);
    }
  }

  return (
    <input
      autoFocus={autoFocus}
      className={className}
      disabled={disabled}
      id={id}
      inputMode="numeric"
      name={name}
      onChange={handleChange}
      onClick={anchorCaret}
      onFocus={anchorCaret}
      onKeyUp={anchorCaret}
      ref={ref}
      required={required}
      type="text"
      value={displayValue}
    />
  );
}
