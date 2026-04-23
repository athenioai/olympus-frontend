"use client";

import { Command } from "cmdk";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

export interface SearchableSelectOption {
  readonly value: string;
  readonly label: string;
  readonly hint?: string;
}

interface SearchableSelectProps {
  readonly options: readonly SearchableSelectOption[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly emptyLabel?: string;
  readonly clearLabel?: string;
  readonly allowClear?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly id?: string;
}

const TRIGGER_CLASS =
  "flex h-10 w-full items-center gap-2 rounded-lg bg-surface-container-high px-3 text-left text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30 disabled:opacity-60";

const POPOVER_MAX_HEIGHT = 320;
const POPOVER_OFFSET = 4;

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  clearLabel,
  allowClear = false,
  disabled = false,
  className,
  id,
}: SearchableSelectProps) {
  const t = useTranslations("common.searchable");
  const reactId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const updateRect = useCallback(() => {
    if (triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open, updateRect]);

  useEffect(() => {
    if (!open) return;
    function onDocDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  function handleClear(e: ReactMouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  const hasValue = Boolean(selected);
  const showClearIcon = allowClear && hasValue && !disabled;
  const searchHint = searchPlaceholder ?? t("search");
  const emptyText = emptyLabel ?? t("empty");

  const popoverStyle = useMemo(() => {
    if (!rect) return null;
    const spaceBelow = window.innerHeight - rect.bottom;
    const flipUp = spaceBelow < POPOVER_MAX_HEIGHT && rect.top > spaceBelow;
    const top = flipUp
      ? rect.top - POPOVER_OFFSET
      : rect.bottom + POPOVER_OFFSET;
    const transform = flipUp ? "translateY(-100%)" : undefined;
    return {
      position: "fixed" as const,
      top,
      left: rect.left,
      width: rect.width,
      transform,
      zIndex: 60,
    };
  }, [rect]);

  return (
    <div className={["relative", className ?? ""].filter(Boolean).join(" ")}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={TRIGGER_CLASS}
        disabled={disabled}
        id={id ?? reactId}
        onClick={() => setOpen((v) => !v)}
        ref={triggerRef}
        type="button"
      >
        <span
          className={`flex-1 truncate ${hasValue ? "" : "text-on-surface-variant/70"}`}
        >
          {selected ? selected.label : (placeholder ?? "")}
        </span>
        {showClearIcon ? (
          <span
            aria-label={clearLabel ?? t("clear")}
            className="flex size-5 items-center justify-center rounded text-on-surface-variant hover:text-on-surface"
            onClick={handleClear}
            role="button"
            tabIndex={-1}
          >
            <X className="size-3.5" />
          </span>
        ) : null}
        <ChevronDown
          className={`size-4 shrink-0 text-on-surface-variant transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && popoverStyle && typeof document !== "undefined"
        ? createPortal(
            <div
              className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient ring-1 ring-black/5"
              ref={popoverRef}
              style={popoverStyle}
            >
              <Command label={placeholder ?? ""} shouldFilter>
                <div className="flex items-center gap-2 border-b border-surface-container-high px-3 py-2">
                  <Search className="size-4 text-on-surface-variant" />
                  <Command.Input
                    autoFocus
                    className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/70"
                    onValueChange={setQuery}
                    placeholder={searchHint}
                    value={query}
                  />
                </div>
                <Command.List
                  className="overflow-y-auto p-1"
                  style={{ maxHeight: POPOVER_MAX_HEIGHT - 48 }}
                >
                  <Command.Empty className="px-3 py-6 text-center text-sm text-on-surface-variant">
                    {emptyText}
                  </Command.Empty>
                  {allowClear && clearLabel ? (
                    <Command.Item
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-on-surface-variant aria-selected:bg-surface-container-high"
                      keywords={[clearLabel]}
                      onSelect={() => handleSelect("")}
                      value="__clear__"
                    >
                      <span>{clearLabel}</span>
                      {!hasValue && <Check className="size-4 text-primary" />}
                    </Command.Item>
                  ) : null}
                  {options.map((opt) => (
                    <Command.Item
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-on-surface aria-selected:bg-surface-container-high"
                      key={opt.value}
                      keywords={[
                        opt.label,
                        ...(opt.hint ? [opt.hint] : []),
                      ]}
                      onSelect={() => handleSelect(opt.value)}
                      value={opt.value}
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{opt.label}</span>
                        {opt.hint ? (
                          <span className="truncate text-xs text-on-surface-variant">
                            {opt.hint}
                          </span>
                        ) : null}
                      </div>
                      {opt.value === value ? (
                        <Check className="size-4 shrink-0 text-primary" />
                      ) : null}
                    </Command.Item>
                  ))}
                </Command.List>
              </Command>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
