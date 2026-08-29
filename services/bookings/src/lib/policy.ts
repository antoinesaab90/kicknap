export const CANCELLATION_DEADLINE_HOURS = 24;
const HOUR_MS = 60 * 60 * 1000;
export const CANCELLATION_DEADLINE_MS = CANCELLATION_DEADLINE_HOURS * HOUR_MS;

// A guest may cancel free of charge up to the 24h deadline (exclusive) before the
// booking starts. Within the last 24h cancellations are no longer possible, and a
// full refund is returned whenever a cancellation happens (we never keep the fee).
export function guestCanCancel(startMs: number, nowMs: number): boolean {
  return startMs - nowMs > CANCELLATION_DEADLINE_MS;
}

export function bookingReference(id: number): string {
  return `KN-${String(id).padStart(6, "0")}`;
}

export function cancellationReference(id: number, atMs: number): string {
  return `CN-${String(id).padStart(6, "0")}-${atMs.toString(36).toUpperCase()}`;
}