export interface ListingSpace {
  id: number;
  name: string;
  minHours: number;
  maxHours: number;
}

export interface SpaceList {
  spaces: ListingSpace[];
}

const base = process.env.SERVICE_LISTINGS_URL ?? "http://localhost:3001";

export async function fetchSpace(id: number): Promise<ListingSpace | null> {
  const res = await fetch(`${base}/api/v1/spaces/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as { space: ListingSpace };
  return data.space;
}

export async function fetchAllSpaces(): Promise<ListingSpace[]> {
  const res = await fetch(`${base}/api/v1/spaces`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as SpaceList;
  return data.spaces;
}