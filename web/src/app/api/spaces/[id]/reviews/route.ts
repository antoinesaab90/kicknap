import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { identifyUser, serviceBaseUrl } from "@/lib/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const spaceId = Number(id);
  if (!Number.isInteger(spaceId) || spaceId <= 0) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  const res = await fetch(
    `${serviceBaseUrl("listings")}/api/v1/spaces/${spaceId}/reviews`,
    { cache: "no-store" }
  );
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(data, { status: res.ok ? 200 : res.status });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await identifyUser(session.token);
  if (!user) {
    await clearSession();
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const spaceId = Number(id);
  if (!Number.isInteger(spaceId) || spaceId <= 0) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let rating: number;
  let comment: string;
  try {
    const body = (await request.json()) as { rating?: unknown; comment?: unknown };
    rating = Number(body.rating);
    comment = typeof body.comment === "string" ? body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "invalid_rating" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const hasBooking = await fetch(
    `${serviceBaseUrl("bookings")}/api/v1/bookings?spaceId=${spaceId}&guestEmail=${encodeURIComponent(user.email)}`,
    { cache: "no-store" }
  )
    .then((res) => (res.ok ? res.json() : { count: 0 }))
    .then((data) => ((data as { count?: number }).count ?? 0) > 0)
    .catch(() => false);
  if (!hasBooking) {
    return NextResponse.json({ error: "no_booking" }, { status: 403 });
  }

  const res = await fetch(
    `${serviceBaseUrl("listings")}/api/v1/spaces/${spaceId}/reviews`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        guestEmail: user.email,
        guestName: user.name,
        rating,
        comment: comment || undefined,
      }),
      cache: "no-store",
    }
  );
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(data, { status: res.ok ? 201 : res.status });
}