import { Hono } from "hono";
import { and, eq, gt, lt } from "drizzle-orm";
import { bookings } from "../db/schema.js";
import { db } from "../db/index.js";
import { fetchSpace } from "../lib/listings.js";
import { checkAvailability } from "../lib/availability.js";
import { computePriceCents } from "../lib/price.js";

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

  return c.json(
    {
      booking: {
        ...booking,
        from: new Date(fromMs).toISOString(),
        to: new Date(toMs).toISOString(),
      },
    },
    201
  );
});

// GET /api/v1/bookings/:id
v1.get("/bookings/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid_id" }, 400);

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!booking) return c.json({ error: "booking_not_found" }, 404);

  return c.json({ booking });
});

// GET /api/v1/bookings?spaceId=1&from=...&to=...  (active bookings overlapping the window)
v1.get("/bookings", async (c) => {
  const spaceId = Number(c.req.query("spaceId"));
  const from = c.req.query("from");
  const to = c.req.query("to");

  const conditions = [eq(bookings.status, ACTIVE_STATUS)];
  if (c.req.query("spaceId") !== undefined) conditions.push(eq(bookings.spaceId, spaceId));

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