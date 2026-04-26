type Listener = (suspended: boolean) => void;

let suspended = false;
const listeners = new Set<Listener>();

/**
 * Whether the current tenant's subscription is suspended.
 * @returns Current suspended state
 */
export function getSuspended(): boolean {
  return suspended;
}

/**
 * Update the global suspended flag. Idempotent — listeners are only
 * notified when the value actually changes.
 * @param next - New suspended state
 */
export function setSuspended(next: boolean): void {
  if (suspended === next) return;
  suspended = next;
  for (const listener of listeners) listener(next);
}

/**
 * Subscribe to suspended-state changes.
 * @param listener - Called with the new value on every change
 * @returns Unsubscribe function
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
