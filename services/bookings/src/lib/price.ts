export const TAKE_RATE = 0.16;

export function computePriceCents(
  fromMs: number,
  toMs: number,
  hourlyPriceCents: number
): number {
  const durationMinutes = (toMs - fromMs) / 60000;
  return Math.round((durationMinutes / 60) * hourlyPriceCents);
}

export function guestTotalCents(subtotalCents: number): number {
  return Math.round(subtotalCents / (1 - TAKE_RATE));
}