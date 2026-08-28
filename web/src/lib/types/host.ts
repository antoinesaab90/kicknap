export interface HostSpaceDto {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  hourlyPriceCents: number;
  minHours: number;
  maxHours: number;
  photoUrl: string | null;
  published: boolean;
  createdAt: string;
}

export interface OpeningRuleDto {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

export interface HostSpacesResponse {
  count: number;
  spaces: HostSpaceDto[];
}

export interface HostSpaceResponse {
  space: HostSpaceDto;
}

export interface HoursResponse {
  spaceId: number;
  rules: OpeningRuleDto[];
}

export const AREAS = ["centrum", "oost", "west", "zuid", "noord", "schiphol"] as const;

export const AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  centrum: { lat: 52.3702, lng: 4.8952 },
  oost: { lat: 52.3607, lng: 4.916 },
  west: { lat: 52.3658, lng: 4.857 },
  zuid: { lat: 52.3392, lng: 4.8749 },
  noord: { lat: 52.3865, lng: 4.9277 },
  schiphol: { lat: 52.3105, lng: 4.7683 },
};

export const WEEKDAY_LABELS = [0, 1, 2, 3, 4, 5, 6] as const;