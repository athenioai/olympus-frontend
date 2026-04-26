export type PlanChangeAction = "current" | "upgrade" | "downgrade";

/**
 * Compare a target plan cost to the current plan cost and pick the right
 * UI action. Equal cost = "current" (button disabled). Higher = "upgrade"
 * (immediate). Lower = "downgrade" (effective at currentPeriodEnd).
 */
export function getPlanChangeAction(
  currentCost: number,
  targetCost: number,
): PlanChangeAction {
  if (currentCost === targetCost) return "current";
  return targetCost > currentCost ? "upgrade" : "downgrade";
}
