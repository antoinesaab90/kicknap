import { NextResponse } from "next/server";
import { serviceBaseUrl } from "@/lib/api";

// GET /api/spaces/[id]/bookings?from=..&to=.. — booked windows for a space in a
// time range (public; the bookings service exposes this filter without auth).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!/^\d+$/.test(id) || !from || !to) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const url =
    `${serviceBaseUrl("bookings")}/api/v1/bookings?` +
    `spaceId=${id}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(data, { status: res.status });
}