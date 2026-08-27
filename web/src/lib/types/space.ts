export interface SpaceDto {
  id: number;
  name: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  hourlyPriceCents: number;
  minHours: number;
  photoUrl: string | null;
  rating: number;
  timesRated: number;
  isDemo: boolean;
}

export interface SpaceDetailDto extends SpaceDto {
  description: string | null;
  address: string | null;
  maxHours: number;
  published: boolean;
  hostId: number;
}

export interface SpacesResponse {
  count: number;
  spaces: SpaceDto[];
}

export interface SpaceResponse {
  space: SpaceDetailDto;
}