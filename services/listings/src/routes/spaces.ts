import { Hono } from "hono";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { spaces } from "../db/schema.js";
import { db } from "../db/index.js";

export const AREAS = ["centrum", "oost", "west", "zuid", "noord", "schiphol"] as const;

export type Area = (typeof AREAS)[number];

const v1 = new Hono();

// GET /api/v1/spaces/:id
v1.get("/spaces/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid_id" }, 400);

  const [space] = await db.select().from(spaces).where(eq(spaces.id, id)).limit(1);
  if (!space) return c.json({ error: "space_not_found" }, 404);

  return c.json({ space });
});

// GET /api/v1/spaces?area=centrum&max=15&sort=priceAsc|priceDesc|rating
v1.get("/spaces", async (c) => {
  const area = c.req.query("area");
  const sort = c.req.query("sort");

  const conditions: SQL[] = [];
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

export default v1;