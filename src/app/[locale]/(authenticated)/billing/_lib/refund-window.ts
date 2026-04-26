/**
 * Whether `now` is at or before the refund window deadline. Defensive:
 * malformed dates evaluate to false (closed window).
 */
export function isWithinRefundWindow(
  refundEligibleUntil: string,
  now: Date = new Date(),
): boolean {
  const deadline = new Date(refundEligibleUntil);
  if (Number.isNaN(deadline.getTime())) return false;
  return now.getTime() <= deadline.getTime();
}
