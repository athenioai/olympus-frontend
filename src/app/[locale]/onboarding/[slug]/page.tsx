import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-envelope";
import {
  businessProfileService,
  onboardingService,
  userService,
} from "@/lib/services";
import { Wizard } from "./_components/wizard";
import { resolveCurrentStep } from "./_lib/resume-heuristic";

interface OnboardingPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return renderUnauthenticated(slug);
  }

  return renderAuthenticated(slug);
}

async function renderUnauthenticated(slug: string) {
  try {
    const info = await onboardingService.getInfo(slug);
    return (
      <Wizard
        initial={{
          slug,
          email: info.email,
          currentStep: 1,
          profileView: null,
          workType: null,
        }}
      />
    );
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) redirect("/onboarding/error/invalid");
      if (err.status === 410) redirect("/onboarding/error/completed");
    }
    throw err;
  }
}

async function renderAuthenticated(slug: string) {
  try {
    const [user, profileView] = await Promise.all([
      userService.getMe(),
      businessProfileService.getProfile(),
    ]);

    const step = resolveCurrentStep(profileView.profile);

    return (
      <Wizard
        initial={{
          slug,
          email: user.email,
          currentStep: step,
          profileView,
          workType: user.workType,
        }}
      />
    );
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_AUTHENTICATED") {
      redirect("/login");
    }
    throw err;
  }
}
