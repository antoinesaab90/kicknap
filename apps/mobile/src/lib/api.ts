import type { Booking, CheckoutSession, PaymentStatus, Space, User } from './types';

export const LISTINGS_URL =
  process.env.EXPO_PUBLIC_LISTINGS_URL ?? 'http://localhost:3001';
export const AVAILABILITY_URL =
  process.env.EXPO_PUBLIC_AVAILABILITY_URL ?? 'http://localhost:3002';
export const BOOKINGS_URL =
  process.env.EXPO_PUBLIC_BOOKINGS_URL ?? 'http://localhost:3003';
export const IDENTITY_URL =
  process.env.EXPO_PUBLIC_IDENTITY_URL ?? 'http://localhost:3004';
export const PAYMENTS_URL =
  process.env.EXPO_PUBLIC_PAYMENTS_URL ?? 'http://localhost:3005';

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}

export function listSpaces(params: {
  area?: string;
  max?: number;
  sort?: string;
}): Promise<{ spaces: Space[] }> {
  return http(`${LISTINGS_URL}/api/v1/spaces${qs(params)}`);
}

export function checkMany(fromIso: string, toIso: string): Promise<{
  available: number;
  total: number;
  results: { spaceId: number; available: boolean }[];
}> {
  return http(
    `${AVAILABILITY_URL}/api/v1/check-many${qs({ from: fromIso, to: toIso })}`
  );
}

export async function fetchSpace(id: number): Promise<Space | null> {
  try {
    const data = await http<{ space: Space }>(
      `${LISTINGS_URL}/api/v1/spaces/${id}`
    );
    return data.space ?? null;
  } catch {
    return null;
  }
}

export function login(email: string, password: string): Promise<{ token: string; user: User }> {
  return http(`${IDENTITY_URL}/api/v1/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(
  name: string,
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  return http(`${IDENTITY_URL}/api/v1/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function me(token: string): Promise<User | null> {
  try {
    const data = await http<{ user: User }>(`${IDENTITY_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function createBooking(input: {
  token: string;
  spaceId: number;
  from: string;
  to: string;
  guestEmail?: string;
  guestName?: string;
}): Promise<{ booking: Booking }> {
  const data = await http<{ booking: Booking }>(`${BOOKINGS_URL}/api/v1/bookings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      spaceId: input.spaceId,
      from: input.from,
      to: input.to,
      guestEmail: input.guestEmail,
      guestName: input.guestName,
    }),
  });
  return data;
}

export async function createCheckout(input: {
  bookingId: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutSession> {
  const data = await http<CheckoutSession>(`${PAYMENTS_URL}/api/v1/payments/checkout`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data;
}

export async function paymentStatus(bookingId: number): Promise<PaymentStatus> {
  const data = await http<{ payment: PaymentStatus | null }>(
    `${PAYMENTS_URL}/api/v1/payments/bookings/${bookingId}`
  );
  return data.payment ?? { status: null };
}

export async function myBookings(token: string, guestEmail: string): Promise<Booking[]> {
  const data = await http<{ bookings: Booking[] }>(
    `${BOOKINGS_URL}/api/v1/bookings${qs({ guestEmail })}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.bookings ?? [];
}