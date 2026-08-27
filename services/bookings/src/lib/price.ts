export function computePriceCents(
  fromMs: number,
  toMs: number,
  hourlyPriceCents: number
): number {
  const durationMinutes = (toMs - fromMs) / 60000;
  return Math.round((durationMinutes / 60) * hourlyPriceCents);
}