import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { identifyUser, serviceBaseUrl } from "@/lib/api";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await identifyUser(session.token);
  if (!user) {
    await clearSession();
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let bookingId: number;
  let spaceId: number;
  let lang: string;
  try {
    const body = (await request.json()) as {
      bookingId?: unknown;
      spaceId?: unknown;
      lang?: unknown;
    };
    bookingId = Number(body.bookingId);
    spaceId = Number(body.spaceId);
    lang = typeof body.lang === "string" ? body.lang : "en";
    if (!Number.isInteger(bookingId) || bookingId <= 0 || !Number.isInteger(spaceId)) {
      return NextResponse.json({ error: "invalid_params" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const successUrl = `${origin}/${lang}/spaces/${spaceId}?paid=1`;
  const cancelUrl = `${origin}/${lang}/spaces/${spaceId}?canceled=1`;

  const res = await fetch(`${serviceBaseUrl("payments")}/api/v1/payments/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bookingId, successUrl, cancelUrl }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  return NextResponse.json(data, { status: 201 });
}