export type BookingStatus = "confirmed" | "cancelled";

export interface BookingDto {
  id: number;
  spaceId: number;
  guestEmail: string | null;
  guestName: string | null;
  fromTs: string;
  toTs: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  status: BookingStatus;
  createdAt: string;
  from?: string;
  to?: string;
}

export interface BookingsResponse {
  count: number;
  bookings: BookingDto[];
}

export interface CreateBookingResponse {
  booking: BookingDto;
}

export type BookingErrorCode =
  | "invalid_body"
  | "invalid_spaceId"
  | "missing_from_or_to"
  | "invalid_range"
  | "space_not_found"
  | "slot_conflict"
  | "already_booked"
  | "shorter_than_min"
  | "longer_than_max"
  | "no_opening_hours"
  | "outside_opening_hours";