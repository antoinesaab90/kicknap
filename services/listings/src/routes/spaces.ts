import { Hono } from "hono";
import { and, asc, desc, eq, lte, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { spaces, users, reviews } from "../db/schema.js";
import { db, ensureReviewsTable } from "../db/index.js";

export const AREAS = ["centrum", "oost", "west", "zuid", "noord", "schiphol"] as const;

export type Area = (typeof AREAS)[number];

const v1 = new Hono();

let reviewsEnsured = false;
async function ensureReviewsReady(): Promise<void> {
  if (reviewsEnsured) return;
  await ensureReviewsTable();
  reviewsEnsured = true;
}

async function upsertHost(hostEmail: string): Promise<number> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, hostEmail)).limit(1);
  if (existing) return existing.id;
  const [created] = await db
    .insert(users)
    .values({ email: hostEmail, name: hostEmail.split("@")[0] })
    .returning({ id: users.id });
  return created.id;
}

function parseSpaceBody(body: Record<string, unknown>) {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
  const int = (v: unknown) => (Number.isInteger(v) && (v as number) > 0 ? (v as number) : NaN);
  return {
    name: str(body.name) || null,
    description: str(body.description) || null,
    address: str(body.address) || null,
    neighborhood: str(body.neighborhood) || null,
    city: str(body.city) || null,
    lat: num(body.lat),
    lng: num(body.lng),
    hourlyPriceCents: int(body.hourlyPriceCents),
    minHours: int(body.minHours),
    maxHours: int(body.maxHours),
    photoUrl: str(body.photoUrl) || null,
  };
}

// GET /api/v1/spaces?area=centrum&max=15&sort=priceAsc|priceDesc|rating | host=email
v1.get("/spaces", async (c) => {
  const area = c.req.query("area");
  const sort = c.req.query("sort");
  const hostEmail = c.req.query("host");

  if (hostEmail) {
    const [host] = await db.select({ id: users.id }).from(users).where(eq(users.email, hostEmail)).limit(1);
    if (!host) return c.json({ count: 0, spaces: [] });
    const rows = await db
      .select()
      .from(spaces)
      .where(eq(spaces.hostId, host.id))
      .orderBy(desc(spaces.createdAt));
    return c.json({ count: rows.length, spaces: rows });
  }

  const conditions: SQL[] = [eq(spaces.published, true)];
  if (area && (AREAS as readonly string[]).includes(area)) {
    conditions.push(eq(spaces.neighborhood, area));
  }

  const max = Number(c.req.query("max"));
  if (Number.isFinite(max) && max > 0) {
    conditions.push(lte(spaces.hourlyPriceCents, Math.round(max * 100)));
  }

  const order =
    sort === "priceDesc"
      ? desc(spaces.hourlyPriceCents)
      : sort === "rating"
        ? desc(spaces.rating)
        : asc(spaces.hourlyPriceCents);

  const rows = await db
    .select()
    .from(spaces)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(order)
    .limit(60);

  return c.json({ count: rows.length, spaces: rows });
});

// GET /api/v1/spaces/:id
v1.get("/spaces/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid_id" }, 400);

  const [space] = await db
    .select({
      id: spaces.id,
      hostId: spaces.hostId,
      hostEmail: users.email,
      name: spaces.name,
      description: spaces.description,
      address: spaces.address,
      neighborhood: spaces.neighborhood,
      city: spaces.city,
      lat: spaces.lat,
      lng: spaces.lng,
      hourlyPriceCents: spaces.hourlyPriceCents,
      minHours: spaces.minHours,
      maxHours: spaces.maxHours,
      rating: spaces.rating,
      timesRated: spaces.timesRated,
      photoUrl: spaces.photoUrl,
      isDemo: spaces.isDemo,
      published: spaces.published,
      createdAt: spaces.createdAt,
    })
    .from(spaces)
    .leftJoin(users, eq(users.id, spaces.hostId))
    .where(eq(spaces.id, id))
    .limit(1);
  if (!space) return c.json({ error: "space_not_found" }, 404);
  if (!space.published) return c.json({ error: "space_not_found" }, 404);

  return c.json({ space });
});

// GET /api/v1/spaces/:id/reviews — newest first
v1.get("/spaces/:id/reviews", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid_id" }, 400);

  await ensureReviewsReady();

  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.spaceId, id))
    .orderBy(desc(reviews.createdAt))
    .limit(100);

  return c.json({ count: rows.length, reviews: rows });
});

// POST /api/v1/spaces/:id/reviews { guestEmail, guestName?, rating, comment? }
// One review per guest per space. Recomputes the space's aggregate rating.
v1.post("/spaces/:id/reviews", async (c) => {
  const id = Number(c.req.param("id"));
  const body = (await c.req.json().catch(() => null)) as {
    guestEmail?: unknown;
    guestName?: unknown;
    rating?: unknown;
    comment?: unknown;
  } | null;
  if (!Number.isInteger(id)) return c.json({ error: "invalid_id" }, 400);

  await ensureReviewsReady();

  const [space] = await db.select({ id: spaces.id, published: spaces.published }).from(spaces).where(eq(spaces.id, id)).limit(1);
  if (!space || !space.published) return c.json({ error: "space_not_found" }, 404);

  const guestEmail = typeof body?.guestEmail === "string" ? body.guestEmail.trim() : "";
  const rating = Number(body?.rating);
  const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 2000) : null;
  if (!guestEmail) return c.json({ error: "invalid_guest" }, 400);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return c.json({ error: "invalid_rating" }, 400);
  }

  const guestName =
    typeof body?.guestName === "string" && body.guestName.trim()
      ? body.guestName.trim().slice(0, 120)
      : null;

  const [created] = await db
    .insert(reviews)
    .values({
      spaceId: id,
      guestEmail,
      guestName,
      rating,
      comment: comment ? comment : null,
    })
    .onConflictDoNothing({ target: [reviews.spaceId, reviews.guestEmail] })
    .returning();

  if (!created) return c.json({ error: "already_reviewed" }, 409);

  const [agg] = await db
    .select({
      rating: sql<number>`coalesce(round(avg(${reviews.rating})::numeric, 1)::float, 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(eq(reviews.spaceId, id));

  await db
    .update(spaces)
    .set({ rating: agg.rating, timesRated: agg.count })
    .where(eq(spaces.id, id));

  return c.json({ review: created }, 201);
});

// GET /api/v1/internal/host-spaces/:id?hostEmail= — owned space by host (any publish state)
v1.get("/internal/host-spaces/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const hostEmail = c.req.query("hostEmail")?.trim() ?? "";
  if (!Number.isInteger(id) || !hostEmail) return c.json({ error: "invalid_request" }, 400);

  const hostId = await upsertHost(hostEmail);
  const [space] = await db.select().from(spaces).where(eq(spaces.id, id)).limit(1);
  if (!space || space.hostId !== hostId) return c.json({ error: "space_not_found" }, 404);

  return c.json({ space });
});

// POST /api/v1/spaces { hostEmail, name, ... , published? }
v1.post("/spaces", async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const hostEmail = typeof body?.hostEmail === "string" ? body.hostEmail.trim() : "";
  if (!hostEmail) return c.json({ error: "invalid_host" }, 400);

  const f = parseSpaceBody(body ?? {});
  if (!f.name) return c.json({ error: "missing_name" }, 400);
  if (!f.neighborhood || !(AREAS as readonly string[]).includes(f.neighborhood)) {
    return c.json({ error: "invalid_neighborhood" }, 400);
  }
  if (!Number.isFinite(f.lat) || !Number.isFinite(f.lng)) return c.json({ error: "invalid_coords" }, 400);
  if (!Number.isInteger(f.hourlyPriceCents) || f.hourlyPriceCents <= 0) {
    return c.json({ error: "invalid_price" }, 400);
  }

  const hostId = await upsertHost(hostEmail);

  const [space] = await db
    .insert(spaces)
    .values({
      hostId,
      name: f.name,
      description: f.description,
      address: f.address,
      neighborhood: f.neighborhood,
      city: f.city ?? "Amsterdam",
      lat: f.lat,
      lng: f.lng,
      hourlyPriceCents: f.hourlyPriceCents,
      minHours: Number.isInteger(f.minHours) ? f.minHours : 1,
      maxHours: Number.isInteger(f.maxHours) ? f.maxHours : 8,
      photoUrl: f.photoUrl,
      published: false,
    })
    .returning();

  return c.json({ space }, 201);
});

// PUT /api/v1/spaces/:id { hostEmail, ... }  — full update of editable fields
v1.put("/spaces/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const hostEmail = typeof body?.hostEmail === "string" ? body.hostEmail.trim() : "";
  if (!Number.isInteger(id)) return c.json({ error: "invalid_id" }, 400);
  if (!hostEmail) return c.json({ error: "invalid_host" }, 400);

  const [space] = await db
    .select({
      id: spaces.id,
      hostId: spaces.hostId,
      minHours: spaces.minHours,
      maxHours: spaces.maxHours,
    })
    .from(spaces)
    .where(eq(spaces.id, id))
    .limit(1);
  if (!space) return c.json({ error: "space_not_found" }, 404);

  const hostId = await upsertHost(hostEmail);
  if (space.hostId !== hostId) return c.json({ error: "forbidden" }, 403);

  const f = parseSpaceBody(body ?? {});
  if (!f.name) return c.json({ error: "missing_name" }, 400);
  if (!f.neighborhood || !(AREAS as readonly string[]).includes(f.neighborhood)) {
    return c.json({ error: "invalid_neighborhood" }, 400);
  }
  if (!Number.isFinite(f.lat) || !Number.isFinite(f.lng)) return c.json({ error: "invalid_coords" }, 400);
  if (!Number.isInteger(f.hourlyPriceCents) || f.hourlyPriceCents <= 0) {
    return c.json({ error: "invalid_price" }, 400);
  }

  const [updated] = await db
    .update(spaces)
    .set({
      name: f.name,
      description: f.description,
      address: f.address,
      neighborhood: f.neighborhood,
      city: f.city ?? "Amsterdam",
      lat: f.lat,
      lng: f.lng,
      hourlyPriceCents: f.hourlyPriceCents,
      minHours: Number.isInteger(f.minHours) ? f.minHours : space.minHours,
      maxHours: Number.isInteger(f.maxHours) ? f.maxHours : space.maxHours,
      photoUrl: f.photoUrl,
    })
    .where(eq(spaces.id, id))
    .returning();

  return c.json({ space: updated });
});

// POST /api/v1/spaces/:id/publish { hostEmail, published }
v1.post("/spaces/:id/publish", async (c) => {
  const id = Number(c.req.param("id"));
  const body = (await c.req.json().catch(() => null)) as { hostEmail?: unknown; published?: unknown } | null;
  const hostEmail = typeof body?.hostEmail === "string" ? body.hostEmail.trim() : "";
  if (!Number.isInteger(id)) return c.json({ error: "invalid_id" }, 400);
  if (!hostEmail) return c.json({ error: "invalid_host" }, 400);

  const [space] = await db.select({ id: spaces.id, hostId: spaces.hostId }).from(spaces).where(eq(spaces.id, id)).limit(1);
  if (!space) return c.json({ error: "space_not_found" }, 404);

  const hostId = await upsertHost(hostEmail);
  if (space.hostId !== hostId) return c.json({ error: "forbidden" }, 403);

  const [updated] = await db
    .update(spaces)
    .set({ published: body?.published === true })
    .where(eq(spaces.id, id))
    .returning();

  return c.json({ space: updated });
});

export default v1;