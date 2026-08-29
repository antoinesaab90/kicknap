export const TAX_RATE = 0.21;
export const GUEST_FEE_RATE = 0.1;

export interface PriceBreakdown {
  minutes: number;
  baseCents: number;
  taxCents: number;
  feeCents: number;
  totalCents: number;
}

// Guest bill for a stay. `totalCents` is exactly what Stripe charges the guest
// (base + 10% booking fee, matching the payments service). VAT is itemized but
// included in the base rental price.
export function computeBreakdown(minutes: number, hourlyCents: number): PriceBreakdown {
  const baseCents = Math.round((minutes / 60) * hourlyCents);
  const taxCents = Math.round(baseCents * TAX_RATE);
  const feeCents = Math.round(baseCents * GUEST_FEE_RATE);
  return { minutes, baseCents, taxCents, feeCents, totalCents: baseCents + feeCents };
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}