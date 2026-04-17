import type {
  BusinessProfileView,
  ScoreResult,
  WorkType,
} from "@/lib/services";

export const TOTAL_STEPS = 8;
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface WizardInitialState {
  readonly slug: string;
  readonly email: string;
  readonly currentStep: WizardStep;
  readonly profileView: BusinessProfileView | null;
  readonly workType: WorkType | null;
}

export interface StepUpdate {
  readonly profileView?: BusinessProfileView;
  readonly workType?: WorkType;
  readonly score?: ScoreResult;
}
