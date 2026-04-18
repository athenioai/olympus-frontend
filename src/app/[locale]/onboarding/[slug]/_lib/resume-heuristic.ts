import type { BusinessProfile } from "@/lib/services";
import type { WizardStep } from "./types";

/**
 * Decide which wizard step the user should resume at, based on the server-
 * persisted state. Step 1 is handled separately (unauthenticated path).
 *
 * The ordering mirrors the acceptance criteria: advance only once the
 * required fields for each step are present.
 */
export function resolveCurrentStep(
  profile: BusinessProfile | null,
): WizardStep {
  if (!profile) return 2;
  if (!profile.businessVertical) return 3;
  if (!profile.businessName || !profile.businessDescription) return 4;
  if (!profile.serviceModality) return 5;
  if (!profile.paymentPolicy || !profile.cancellationPolicy) return 6;
  return 7;
}
