export const GUEST_FEE_PERCENT = 0.10;
export const HOST_FEE_PERCENT = 0.03;

export interface FeeBreakdown {
  subtotalCents: number;
  guestFeeCents: number;
  hostFeeCents: number;
  guestTotalCents: number;
  hostPayoutCents: number;
}

export function computeFees(subtotalCents: number): FeeBreakdown {
  const guestFeeCents = Math.round(subtotalCents * GUEST_FEE_PERCENT);
  const hostFeeCents = Math.round(subtotalCents * HOST_FEE_PERCENT);
  return {
    subtotalCents,
    guestFeeCents,
    hostFeeCents,
    guestTotalCents: subtotalCents + guestFeeCents,
    hostPayoutCents: subtotalCents - hostFeeCents,
  };
}