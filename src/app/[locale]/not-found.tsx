import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_50%,#faf9f7_0%,#f4f4f1_100%)] p-4">
      <div className="glass w-full max-w-md space-y-4 rounded-2xl border border-white/40 p-8 text-center shadow-ambient">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Compass className="h-7 w-7 text-primary" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-extrabold text-on-surface">
            {t("title")}
          </h1>
          <p className="text-sm text-on-surface-variant">{t("description")}</p>
        </div>
        <div className="pt-2">
          <Link
            className="inline-flex h-10 items-center rounded-xl bg-gradient-to-br from-primary to-primary-dim px-5 text-sm font-bold text-on-primary shadow-lg shadow-primary/10"
            href="/dashboard"
          >
            {t("backToDashboard")}
          </Link>
        </div>
      </div>
    </div>
  );
}
