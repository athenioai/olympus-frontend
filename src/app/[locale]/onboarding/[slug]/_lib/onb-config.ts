import type { WizardStep } from "./types";

/**
 * Per-step config: time estimate (used by the ETA pill) and whether the
 * step can be skipped with the "agente pergunta depois" affordance.
 *
 * Essential steps run 1 → 2 → 3 (password, workType, business name) so the
 * agent has the bare minimum to introduce itself in the live preview.
 * Optional steps (4-7) can be skipped. Step 8 is the celebration screen.
 */
export interface StepConfig {
  readonly mins: number;
  readonly essential: boolean;
}

export const STEP_CONFIG: Readonly<Record<WizardStep, StepConfig>> = {
  1: { mins: 1, essential: true },
  2: { mins: 1, essential: true },
  3: { mins: 2, essential: true },
  4: { mins: 1, essential: false },
  5: { mins: 1, essential: false },
  6: { mins: 1, essential: false },
  7: { mins: 1, essential: false },
  8: { mins: 0, essential: true },
};

/** Total minutes remaining starting at `current` (inclusive). */
export function minsRemaining(current: WizardStep): number {
  let total = 0;
  for (let i = current; i <= 8; i++) {
    total += STEP_CONFIG[i as WizardStep].mins;
  }
  return total;
}
