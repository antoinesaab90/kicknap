import type { MeResponse, UserDto } from "./types/auth";
import type { SpaceDetailDto, SpaceResponse } from "./types/space";

export function serviceBaseUrl(name: "listings" | "availability" | "bookings" | "identity"): string {
  const map = {
    listings: process.env.SERVICE_LISTINGS_URL ?? "http://localhost:3001",
    availability: process.env.SERVICE_AVAILABILITY_URL ?? "http://localhost:3002",
    bookings: process.env.SERVICE_BOOKINGS_URL ?? "http://localhost:3003",
    identity: process.env.SERVICE_IDENTITY_URL ?? "http://localhost:3004",
  } as const;
  return map[name];
}

export async function fetchSpace(spaceId: number): Promise<SpaceDetailDto | null> {
  const res = await fetch(
    `${serviceBaseUrl("listings")}/api/v1/spaces/${spaceId}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as SpaceResponse;
  return data.space ?? null;
}

export async function identifyUser(token: string): Promise<UserDto | null> {
  try {
    const res = await fetch(`${serviceBaseUrl("identity")}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as MeResponse;
    return data.user ?? null;
  } catch {
    return null;
  }
}