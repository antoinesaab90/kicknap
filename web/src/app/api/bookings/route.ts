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

  let spaceId: number;
  let from: string;
  let to: string;
  try {
    const body = (await request.json()) as {
      spaceId?: unknown;
      from?: unknown;
      to?: unknown;
    };
    spaceId = Number(body.spaceId);
    from = typeof body.from === "string" ? body.from : "";
    to = typeof body.to === "string" ? body.to : "";
    if (!Number.isInteger(spaceId) || spaceId <= 0 || !from || !to) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const res = await fetch(`${serviceBaseUrl("bookings")}/api/v1/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      spaceId,
      from,
      to,
      guestEmail: user.email,
      guestName: user.name,
    }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(data, { status: res.ok ? 201 : res.status });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await identifyUser(session.token);
  if (!user) {
    await clearSession();
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const res = await fetch(
    `${serviceBaseUrl("bookings")}/api/v1/bookings?guestEmail=${encodeURIComponent(user.email)}`,
    { cache: "no-store" }
  );
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(data, { status: res.ok ? 200 : res.status });
}