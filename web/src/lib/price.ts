export const TAKE_RATE = 0.16;

export interface PriceBreakdown {
  minutes: number;
  baseCents: number;
  feeCents: number;
  totalCents: number;
}

// The guest pays one all-in price: the base rate (which the host receives)
// plus a single embedded 16% marketplace fee. `totalCents` matches exactly
// what the payments service charges via Stripe.
export function computeBreakdown(minutes: number, hourlyCents: number): PriceBreakdown {
  const baseCents = Math.round((minutes / 60) * hourlyCents);
  const totalCents = Math.round(baseCents / (1 - TAKE_RATE));
  return { minutes, baseCents, feeCents: totalCents - baseCents, totalCents };
}

export function allInCents(baseCents: number): number {
  return Math.round(baseCents / (1 - TAKE_RATE));
}

export function allInHourlyCents(hourlyCents: number): number {
  return Math.round(hourlyCents / (1 - TAKE_RATE));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}