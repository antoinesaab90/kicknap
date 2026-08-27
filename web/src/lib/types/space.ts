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

export interface SpacesResponse {
  count: number;
  spaces: SpaceDto[];
}