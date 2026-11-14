export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;
export type AttemptState = { failedAttempts: number; lockedUntil: Date | null };
export const emptyAttempt = (): AttemptState => ({ failedAttempts: 0, lockedUntil: null });
export const isLocked = (state: AttemptState, now: Date) => !!state.lockedUntil && state.lockedUntil.getTime() > now.getTime();
export function afterFailure(state: AttemptState, now: Date): AttemptState {
  if (isLocked(state, now)) return state;
  const base = state.lockedUntil ? 0 : state.failedAttempts;
  const failedAttempts = Math.min(base + 1, MAX_FAILED_ATTEMPTS);
  return { failedAttempts, lockedUntil: failedAttempts >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCK_DURATION_MS) : null };
}
