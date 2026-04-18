import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Mail } from "lucide-react";
import { PENDING_EMAIL_COOKIE } from "../constants";
import { ResendButton } from "./_components/resend-button";

export default async function SignupSuccessPage() {
  const cookieStore = await cookies();
  const email = cookieStore.get(PENDING_EMAIL_COOKIE)?.value ?? null;
  const t = await getTranslations("signup.success");

  if (!email) {
    return (
      <SuccessLayout>
        <p className="text-center text-sm text-on-surface-variant">
          {t("noEmail")}
        </p>
        <div className="pt-2 text-center">
          <a
            className="font-bold text-primary hover:underline"
            href="/signup"
          >
            {t("backToSignup")}
          </a>
        </div>
      </SuccessLayout>
    );
  }

  return (
    <SuccessLayout>
      <h1 className="text-center font-display text-2xl font-extrabold tracking-tight text-on-surface">
        {t("title", { email })}
      </h1>
      <p className="text-center text-sm text-on-surface-variant">
        {t("description")}
      </p>
      <div className="pt-2 text-center text-sm text-on-surface-variant">
        <ResendButton />
      </div>
    </SuccessLayout>
  );
}

function SuccessLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#faf9f7_0%,#f4f4f1_100%)]">
      <main className="relative z-10 w-full max-w-[480px] px-6">
        <div className="glass space-y-4 rounded-xl border border-white/40 p-10 shadow-ambient">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
