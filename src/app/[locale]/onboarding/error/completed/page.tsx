import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";

export default async function OnboardingCompletedPage() {
  const t = await getTranslations("onboarding.error");

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#faf9f7_0%,#f4f4f1_100%)]">
      <main className="relative z-10 w-full max-w-[480px] px-6">
        <div className="glass space-y-4 rounded-xl border border-white/40 p-10 shadow-ambient">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2
                className="h-8 w-8 text-primary"
                strokeWidth={1.5}
              />
            </div>
          </div>
          <h1 className="text-center font-display text-2xl font-extrabold tracking-tight text-on-surface">
            {t("completedTitle")}
          </h1>
          <p className="text-center text-sm text-on-surface-variant">
            {t("completedDescription")}
          </p>
          <div className="pt-2 text-center">
            <a
              className="font-bold text-primary hover:underline"
              href="/login"
            >
              {t("completedAction")}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
