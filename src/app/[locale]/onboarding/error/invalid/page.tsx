import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";

export default async function OnboardingInvalidPage() {
  const t = await getTranslations("onboarding.error");

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#faf9f7_0%,#f4f4f1_100%)]">
      <main className="relative z-10 w-full max-w-[480px] px-6">
        <div className="glass space-y-4 rounded-xl border border-white/40 p-10 shadow-ambient">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-muted">
              <AlertTriangle
                className="h-8 w-8 text-danger"
                strokeWidth={1.5}
              />
            </div>
          </div>
          <h1 className="text-center font-display text-2xl font-extrabold tracking-tight text-on-surface">
            {t("invalidTitle")}
          </h1>
          <p className="text-center text-sm text-on-surface-variant">
            {t("invalidDescription")}
          </p>
          <div className="pt-2 text-center">
            <a
              className="font-bold text-primary hover:underline"
              href="/signup"
            >
              {t("invalidAction")}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
