import { NextResponse } from "next/server";
import { requireHost } from "@/lib/host";
import { serviceFetch } from "@/lib/api";

export async function GET() {
  const host = await requireHost();
  if (!host) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const spacesRes = await serviceFetch(
    "listings",
    `/api/v1/spaces?host=${encodeURIComponent(host.email)}`
  );
  if (!spacesRes.ok) return NextResponse.json({ error: "spaces_unavailable" }, { status: 502 });
  const spacesData = (await spacesRes.json()) as {
    spaces?: { id: number; name: string; neighborhood: string }[];
  };
  const spaces = spacesData.spaces ?? [];
  const spaceIds = spaces.map((s) => s.id);
  if (!spaceIds.length) {
    return NextResponse.json({ spaces, bookings: [], totals: { bookings: 0, paid: 0, earnedCents: 0 } });
  }

  const bookingsRes = await serviceFetch(
    "bookings",
    `/api/v1/bookings/by-space?spaceIds=${spaceIds.join(",")}`
  );
  if (!bookingsRes.ok) return NextResponse.json({ error: "bookings_unavailable" }, { status: 502 });
  const bookingsData = (await bookingsRes.json()) as {
    bookings?: { id: number; spaceId: number; guestName?: string; fromTs: string; toTs: string; priceCents: number; status: string }[];
  };
  const rawBookings = bookingsData.bookings ?? [];

  const paymentsRes = await serviceFetch(
    "payments",
    `/api/v1/payments/by-bookings?ids=${rawBookings.map((b) => b.id).join(",")}`
  );
  const paymentsData = paymentsRes.ok
    ? ((await paymentsRes.json()) as {
        payments?: { bookingId: number; status: string; hostPayoutCents: number }[];
      })
    : { payments: [] };

  const paymentByBooking = new Map(
    (paymentsData.payments ?? []).map((p) => [p.bookingId, p])
  );
  const spaceById = new Map(spaces.map((s) => [s.id, s]));

  const bookings = rawBookings
    .map((b) => {
      const space = spaceById.get(b.spaceId);
      const payment = paymentByBooking.get(b.id);
      return {
        id: b.id,
        spaceId: b.spaceId,
        spaceName: space?.name ?? `Space #${b.spaceId}`,
        neighborhood: space?.neighborhood ?? "",
        guestName: b.guestName ?? "",
        fromIso: b.fromTs,
        toIso: b.toTs,
        priceCents: b.priceCents,
        bookingStatus: b.status,
        paymentStatus: payment?.status ?? "unpaid",
        hostPayoutCents: b.status === "confirmed" ? (payment?.hostPayoutCents ?? 0) : 0,
      };
    })
    .sort((a, b) => (a.fromIso < b.fromIso ? 1 : -1));

  const paidBookings = bookings.filter((b) => b.bookingStatus === "confirmed" && b.paymentStatus === "succeeded");
  const earnedCents = paidBookings.reduce((sum, b) => sum + b.hostPayoutCents, 0);

  return NextResponse.json({
    spaces,
    bookings,
    totals: { bookings: bookings.length, paid: paidBookings.length, earnedCents },
  });
}