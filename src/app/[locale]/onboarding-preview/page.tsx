import { redirect } from "next/navigation";
import { userService } from "@/lib/services";
import { Wizard } from "../onboarding/[slug]/_components/wizard";
import type {
  BusinessProfileView,
  WorkType,
} from "@/lib/services";
import type { WizardStep } from "../onboarding/[slug]/_lib/types";
import { PreviewControls } from "./_components/preview-controls";

interface PreviewPageProps {
  readonly searchParams: Promise<{
    readonly step?: string;
    readonly worktype?: string;
    readonly vertical?: string;
    readonly biz?: string;
  }>;
}

/**
 * Admin-only QA preview of the onboarding wizard with synthetic state.
 * Lives at /onboarding-preview — exposed via the admin sidebar.
 *
 * Anyone non-admin is redirected to /dashboard. The route is gated server-side
 * (not in PUBLIC_ALLOW_BOTH) so the proxy bounces unauthenticated visitors
 * to /login first.
 */
export default async function OnboardingPreviewPage({
  searchParams,
}: PreviewPageProps) {
  let user;
  try {
    user = await userService.getMe();
  } catch {
    redirect("/login");
  }
  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const step = clampStep(Number.parseInt(params.step ?? "1", 10));
  const workType = parseWorkType(params.worktype);
  const verticalId = params.vertical ?? null;
  const bizName = params.biz ?? "";

  const profileView = buildMockProfileView({
    workType,
    verticalId,
    bizName,
    step,
  });

  return (
    <>
      <PreviewControls
        bizName={bizName}
        step={step}
        verticalId={verticalId}
        workType={workType}
      />
      <Wizard
        initial={{
          slug: "preview",
          email: "preview@athenio.ai",
          currentStep: step,
          profileView,
          workType,
        }}
      />
    </>
  );
}

function clampStep(n: number): WizardStep {
  if (Number.isNaN(n) || n < 1) return 1;
  if (n > 8) return 8;
  return n as WizardStep;
}

function parseWorkType(value: string | undefined): WorkType | null {
  if (value === "services" || value === "sales" || value === "hybrid") {
    return value;
  }
  return null;
}

interface BuildArgs {
  readonly workType: WorkType | null;
  readonly verticalId: string | null;
  readonly bizName: string;
  readonly step: WizardStep;
}

function buildMockProfileView({
  workType,
  verticalId,
  bizName,
  step,
}: BuildArgs): BusinessProfileView | null {
  if (step <= 2 && !workType && !bizName) return null;

  const now = new Date().toISOString();
  return {
    profile: {
      userId: "preview-user",
      businessName: bizName || (step >= 3 ? "Studio Ápice" : ""),
      businessDescription:
        step >= 3 ? "Salão de beleza com atendimento premium." : "",
      serviceModality: step >= 5 ? "presencial" : ("presencial" as const),
      paymentPolicy: step >= 6 ? "Pix, cartão até 3x" : "",
      cancellationPolicy: step >= 6 ? "24h antes, sem taxa" : "",
      differentials: null,
      escalationRules: null,
      cnpj: null,
      legalName: null,
      foundedYear: null,
      businessVertical: verticalId ?? (step >= 4 ? "beauty" : null),
      createdAt: now,
      updatedAt: now,
    },
    address: null,
    socialLinks: [],
    serviceAreas: [],
    score: {
      score: Math.min(100, Math.max(10, step * 12)),
      maxScore: 100,
      percentage: Math.min(100, Math.max(10, step * 12)),
      tier:
        step >= 8
          ? "gold"
          : step >= 6
            ? "silver"
            : step >= 4
              ? "bronze"
              : "none",
      missingRequired: [],
      canConnectChannel: step >= 6,
    },
  };
}
