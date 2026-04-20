import type { BusinessProfile } from "@/lib/services";
import type { WizardStep } from "./types";

/**
 * Decide which wizard step the user should resume at, based on the server-
 * persisted state. Step 1 is handled separately (unauthenticated path).
 *
 * Step ordering (essentials first):
 *   2 = work type
 *   3 = business name + description
 *   4 = vertical (optional)
 *   5 = service modality (optional)
 *   6 = policies (optional)
 *   7 = extras (optional)
 */
export function resolveCurrentStep(
  profile: BusinessProfile | null,
): WizardStep {
  if (!profile) return 2;
  if (!profile.businessName || !profile.businessDescription) return 3;
  if (!profile.businessVertical) return 4;
  if (!profile.serviceModality) return 5;
  if (!profile.paymentPolicy || !profile.cancellationPolicy) return 6;
  return 7;
}
