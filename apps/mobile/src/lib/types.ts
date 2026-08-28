export interface Space {
  id: number;
  name: string;
  description: string | null;
  neighborhood: string;
  city: string | null;
  address: string | null;
  hourlyPriceCents: number;
  minHours: number;
  maxHours: number;
  rating: number;
  timesRated: number;
  photoUrl: string | null;
  isDemo: boolean;
  published: boolean;
}

export interface CheckResult {
  spaceId: number;
  available: boolean;
  reason: string;
}

export interface Booking {
  id: number;
  spaceId: number;
  guestEmail: string | null;
  guestName: string | null;
  fromTs: string;
  toTs: string;
  durationMinutes: number;
  priceCents: number;
  status: string;
}

export interface PaymentStatus {
  status: string | null;
  hostPayoutCents?: number;
}

export interface User {
  email: string;
  name: string;
}

export interface CheckoutSession {
  checkoutSessionId: string;
  url: string;
}