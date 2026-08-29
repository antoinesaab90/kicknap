import { Hono } from "hono";
import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { bookings } from "../db/schema.js";
import { db } from "../db/index.js";
import { fetchSpace } from "../lib/listings.js";
import { checkAvailability } from "../lib/availability.js";
import { computePriceCents, guestTotalCents } from "../lib/price.js";
import {
  notifyBookingCreated,
  notifyBookingCancelled,
  notifyRefunded,
} from "../lib/mail.js";
import {
  CANCELLATION_DEADLINE_HOURS,
  bookingReference,
  cancellationReference,
  guestCanCancel,
} from "../lib/policy.js";

const v1 = new Hono();

const ACTIVE_STATUS = "confirmed";

function parseBody(body: unknown): {
  spaceId: number;
  from: string;
  to: string;
  guestEmail?: string;
  guestName?: string;
} {
  const b = body as {
    spaceId?: unknown;
    from?: unknown;
    to?: unknown;
    guestEmail?: unknown;
    guestName?: unknown;
  };
  const spaceId = Number(b.spaceId);
  if (!Number.isInteger(spaceId) || spaceId <= 0) {
    throw { status: 400, error: "invalid_spaceId" };
  }
  if (typeof b.from !== "string" || typeof b.to !== "string") {
    throw { status: 400, error: "missing_from_or_to" };
  }
  const fromMs = Date.parse(b.from);
  const toMs = Date.parse(b.to);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
    throw { status: 400, error: "invalid_range" };
  }
  const pick = (value: unknown) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined;

  return {
    spaceId,
    from: b.from,
    to: b.to,
    guestEmail: pick(b.guestEmail),
    guestName: pick(b.guestName),
  };
}

// POST /api/v1/bookings { spaceId, from, to, guestEmail?, guestName? }
v1.post("/bookings", async (c) => {
  let body: {
    spaceId: number;
    from: string;
    to: string;
    guestEmail?: string;
    guestName?: string;
  };
  try {
    body = parseBody(await c.req.json());
  } catch (err) {
    const e = err as { status?: number; error?: string };
    return c.json({ error: e.error ?? "invalid_body" }, (e.status ?? 400) as 400);
  }

  const fromMs = Date.parse(body.from);
  const toMs = Date.parse(body.to);

  const space = await fetchSpace(body.spaceId);
  if (!space) return c.json({ error: "space_not_found", spaceId: body.spaceId }, 404);

  const check = await checkAvailability(body.spaceId, body.from, body.to);
  if (!check.available) {
    return c.json(
      { error: check.reason, spaceId: body.spaceId, from: body.from, to: body.to },
      409
    );
  }

  const overlap = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.spaceId, body.spaceId),
        eq(bookings.status, ACTIVE_STATUS),
        lt(bookings.fromTs, new Date(toMs)),
        gt(bookings.toTs, new Date(fromMs))
      )
    )
    .limit(1);

  if (overlap.length) {
    return c.json(
      { error: "slot_conflict", spaceId: body.spaceId, from: body.from, to: body.to },
      409
    );
  }

  const durationMinutes = (toMs - fromMs) / 60000;
  const priceCents = computePriceCents(fromMs, toMs, space.hourlyPriceCents);

  const row = {
    spaceId: body.spaceId,
    guestEmail: body.guestEmail,
    guestName: body.guestName,
    fromTs: new Date(fromMs),
    toTs: new Date(toMs),
    durationMinutes,
    priceCents,
  };

  const [booking] = await db.insert(bookings).values(row).returning();

  const reference = bookingReference(booking.id);
  void notifyBookingCreated({
    guestEmail: body.guestEmail ?? "",
    guestName: body.guestName,
    hostEmail: space.hostEmail ?? undefined,
    reference,
    spaceName: space.name,
    neighborhood: space.neighborhood,
    city: space.city ?? "Amsterdam",
    fromIso: new Date(fromMs).toISOString(),
    toIso: new Date(toMs).toISOString(),
    priceCents,
  });

  return c.json(
    {
      booking: {
        ...booking,
        reference,
        from: new Date(fromMs).toISOString(),
        to: new Date(toMs).toISOString(),
      },
    },
    201
  );
});

// GET /api/v1/bookings/by-space?spaceIds=1,2,3  (server-to-server: all bookings for a host's spaces)
// Registered before /bookings/:id so "by-space" is not captured as an id.
v1.get("/bookings/by-space", async (c) => {
  const spaceIds = String(c.req.query("spaceIds") ?? "")
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
  if (!spaceIds.length) return c.json({ count: 0, bookings: [] });

  const rows = await db
    .select()
    .from(bookings)
    .where(inArray(bookings.spaceId, spaceIds))
    .orderBy(bookings.fromTs);

  return c.json({ count: rows.length, bookings: rows });
});

// GET /api/v1/bookings/:id
v1.get("/bookings/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid_id" }, 400);

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!booking) return c.json({ error: "booking_not_found" }, 404);

  return c.json({ booking });
});

// Requests a full refund for the booking from the payments service. Best-effort:
// the cancellation stands regardless, and the caller decides what to do with the result.
async function requestRefund(bookingId: number): Promise<{
  refunded: boolean;
  reason?: string;
  refundId?: string;
  amountCents?: number;
}> {
  const paymentsUrl = process.env.SERVICE_PAYMENTS_URL ?? "http://localhost:3004";
  try {
    const res = await fetch(`${paymentsUrl}/api/v1/payments/refund`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bookingId }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { refunded: false, reason: `http_${res.status}` };
    const data = (await res.json()) as {
      refunded?: boolean;
      reason?: string;
      refundId?: string;
      payment?: { amountCents?: number } | null;
    };
    if (!data.refunded) return { refunded: false, reason: data.reason ?? "not_refunded" };
    return {
      refunded: true,
      reason: data.reason,
      refundId: data.refundId,
      amountCents: data.payment?.amountCents,
    };
  } catch {
    return { refunded: false, reason: "error" };
  }
}

// POST /api/v1/bookings/:id/cancel { guestEmail }  — cancels a confirmed, not-yet-started
// booking. The canceller must be the guest who created it OR the hosting space's owner.
// This endpoint is the single source of truth for the cancellation policy:
//   - Guests may cancel free of charge up to 24h before start (full refund, fee not kept).
//     Within the last 24h cancellation is no longer possible.
//   - Hosts may cancel at any time before start; the guest gets a full refund.
//   - Refunds and cancellation/refund emails are triggered from here, so the policy,
//     the money movement and the notifications can never drift apart.
v1.post("/bookings/:id/cancel", async (c) => {
  const id = Number(c.req.param("id"));
  const body = (await c.req.json().catch(() => null)) as { guestEmail?: unknown } | null;
  const guestEmail = typeof body?.guestEmail === "string" ? body.guestEmail.trim().toLowerCase() : "";
  if (!Number.isInteger(id) || id <= 0) return c.json({ error: "invalid_id" }, 400);
  if (!guestEmail) return c.json({ error: "invalid_guest" }, 400);

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!booking) return c.json({ error: "booking_not_found" }, 404);
  if (booking.status !== ACTIVE_STATUS) return c.json({ error: "booking_not_active" }, 409);
  if (booking.fromTs.getTime() <= Date.now()) return c.json({ error: "already_started" }, 409);

  const space = await fetchSpace(booking.spaceId);
  const isGuest = booking.guestEmail?.trim().toLowerCase() === guestEmail;
  const isHost = space?.hostEmail?.trim().toLowerCase() === guestEmail;
  if (!isGuest && !isHost) return c.json({ error: "forbidden" }, 403);

  const nowMs = Date.now();
  const startMs = booking.fromTs.getTime();
  if (isGuest && !guestCanCancel(startMs, nowMs)) {
    return c.json(
      { error: "cancellation_deadline_passed", hours: CANCELLATION_DEADLINE_HOURS },
      409
    );
  }

  const cancellationRef = cancellationReference(id, nowMs);
  const [updated] = await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(eq(bookings.id, id))
    .returning();

  // Guests who reached this point are inside the free-cancel window; host
  // cancellations are refundable by definition. Both refund in full — no penalty
  // exists, so there is no partial-refund math to keep consistent. The attempt is
  // best-effort: if a booking was never paid there is simply nothing to refund.
  const refund = await requestRefund(id);

  const common = {
    guestEmail: booking.guestEmail ?? guestEmail,
    guestName: booking.guestName ?? undefined,
    hostEmail: space?.hostEmail ?? undefined,
    spaceName: space?.name ?? `#${booking.spaceId}`,
    neighborhood: space?.neighborhood ?? "",
    city: space?.city ?? "Amsterdam",
    fromIso: booking.fromTs.toISOString(),
    toIso: booking.toTs.toISOString(),
    reference: bookingReference(id),
    cancellationReference: cancellationRef,
  };

  void notifyBookingCancelled({ ...common, refunded: refund.refunded });

  if (refund.refunded) {
    void notifyRefunded({
      ...common,
      amountCents: refund.amountCents ?? guestTotalCents(booking.priceCents),
      refundId: refund.refundId,
    });
  }

  return c.json({
    booking: updated,
    cancellationReference: cancellationRef,
    refund: { refunded: refund.refunded, reason: refund.reason, refundId: refund.refundId },
  });
});

// GET /api/v1/bookings?spaceId=1&from=...&to=...&guestEmail=...  (active bookings; filter by space, time window, or guest)
v1.get("/bookings", async (c) => {
  const spaceId = Number(c.req.query("spaceId"));
  const from = c.req.query("from");
  const to = c.req.query("to");
  const guestEmail = c.req.query("guestEmail");

  const conditions = [eq(bookings.status, ACTIVE_STATUS)];
  if (c.req.query("spaceId") !== undefined) conditions.push(eq(bookings.spaceId, spaceId));
  if (typeof guestEmail === "string" && guestEmail) {
    conditions.push(eq(bookings.guestEmail, guestEmail));
  }

  const toMs = typeof to === "string" ? Date.parse(to) : Number.NaN;
  const fromMs = typeof from === "string" ? Date.parse(from) : Number.NaN;
  if (Number.isFinite(toMs)) conditions.push(lt(bookings.fromTs, new Date(toMs)));
  if (Number.isFinite(fromMs)) conditions.push(gt(bookings.toTs, new Date(fromMs)));

  const rows = await db
    .select()
    .from(bookings)
    .where(and(...conditions))
    .orderBy(bookings.fromTs)
    .limit(100);

  return c.json({ count: rows.length, bookings: rows });
});

export default v1;