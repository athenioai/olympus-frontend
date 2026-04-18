import type { ReactNode } from "react";

interface AdminHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-on-surface-variant">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </header>
  );
}
