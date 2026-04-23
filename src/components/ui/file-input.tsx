"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileInputProps {
  readonly id?: string;
  readonly name?: string;
  readonly accept?: string;
  readonly required?: boolean;
  readonly className?: string;
}

/**
 * Localized file picker. Wraps a visually hidden native input so the label
 * ("Escolher arquivo") and empty-state text ("Nenhum arquivo selecionado")
 * can be translated — the browser chrome of `input[type=file]` is always
 * rendered in the OS locale, which leaks English into pt-BR builds.
 */
export function FileInput({
  id,
  name,
  accept,
  required,
  className,
}: FileInputProps) {
  const tc = useTranslations("common");
  const ref = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-xl bg-surface-container-high px-2 pr-4 text-sm",
        className,
      )}
    >
      <input
        accept={accept}
        className="sr-only"
        id={id}
        name={name}
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        ref={ref}
        required={required}
        type="file"
      />
      <button
        className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
        onClick={() => ref.current?.click()}
        type="button"
      >
        <Paperclip className="h-3.5 w-3.5" />
        {tc("fileButton")}
      </button>
      <span className="min-w-0 flex-1 truncate text-on-surface-variant">
        {fileName ?? tc("fileEmpty")}
      </span>
    </div>
  );
}
