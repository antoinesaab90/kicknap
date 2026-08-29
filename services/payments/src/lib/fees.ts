export const TAKE_RATE = 0.16;

export interface FeeBreakdown {
  subtotalCents: number;
  guestFeeCents: number;
  hostFeeCents: number;
  guestTotalCents: number;
  hostPayoutCents: number;
}

// guestTotalCents is exactly what Stripe charges the guest.
export function computeFees(subtotalCents: number): FeeBreakdown {
  const guestTotalCents = Math.round(subtotalCents / (1 - TAKE_RATE));
  return {
    subtotalCents,
    guestFeeCents: guestTotalCents - subtotalCents,
    hostFeeCents: 0,
    guestTotalCents,
    hostPayoutCents: subtotalCents,
  };
}