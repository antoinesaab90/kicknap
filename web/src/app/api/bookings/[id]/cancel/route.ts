import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { identifyUser, serviceBaseUrl } from "@/lib/api";

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
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const res = await fetch(
    `${serviceBaseUrl("bookings")}/api/v1/bookings/${bookingId}/cancel`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guestEmail: user.email }),
      cache: "no-store",
    }
  );

  const form = await request.formData().catch(() => null);
  const lang = form?.get("lang") === "nl" ? "nl" : "en";

  if (!res.ok) {
    return NextResponse.redirect(
      new URL(`/${lang}/bookings?cancelError=1`, request.url),
      { status: 303 }
    );
  }

  return NextResponse.redirect(new URL(`/${lang}/bookings?cancelled=1`, request.url), {
    status: 303,
  });
}