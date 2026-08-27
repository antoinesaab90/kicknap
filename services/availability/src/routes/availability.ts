import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { openingHours } from "../db/schema.js";
import { db } from "../db/index.js";
import { fetchSpace } from "../lib/listings.js";
import { amsMinutesOfDay, dateDayOfWeek, windowCovered } from "../lib/time.js";
import type { OpeningHour } from "../db/index.js";

const v1 = new Hono();

// GET /api/v1/check?spaceId=1&from=2026-08-28T08:00:00Z&to=2026-08-28T11:00:00Z
v1.get("/check", async (c) => {
  const spaceId = Number(c.req.query("spaceId"));
  const from = c.req.query("from");
  const to = c.req.query("to");

  if (!Number.isInteger(spaceId)) return c.json({ error: "invalid_spaceId" }, 400);
  if (!from || !to) return c.json({ error: "missing_from_or_to" }, 400);

  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
    return c.json({ error: "invalid_range" }, 400);
  }

  const space = await fetchSpace(spaceId);
  if (!space) return c.json({ available: false, reason: "space_not_found", spaceId }, 404);

  const durationMinutes = (toMs - fromMs) / 60000;
  if (durationMinutes < space.minHours * 60) {
    return c.json({ available: false, reason: "shorter_than_min", minHours: space.minHours });
  }
  if (durationMinutes > space.maxHours * 60) {
    return c.json({ available: false, reason: "longer_than_max", maxHours: space.maxHours });
  }

  const rules = (await db
    .select()
    .from(openingHours)
    .where(eq(openingHours.spaceId, spaceId))) as (OpeningHour & { dayOfWeek: number })[];

  if (!rules.length) {
    return c.json({ available: false, reason: "no_opening_hours", spaceId });
  }

  const covered = windowCovered(fromMs, toMs, rules);
  return c.json({
    available: covered,
    reason: covered ? "available" : "outside_opening_hours",
    spaceId,
  });
});

// GET /api/v1/spaces/:id/day?date=2026-08-28
v1.get("/spaces/:id/day", async (c) => {
  const id = Number(c.req.param("id"));
  const date = c.req.query("date");

  if (!Number.isInteger(id)) return c.json({ error: "invalid_id" }, 400);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: "invalid_date" }, 400);
  }

  const space = await fetchSpace(id);
  if (!space) return c.json({ error: "space_not_found" }, 404);

  const dayOfWeek = dateDayOfWeek(date);
  const rules = await db
    .select()
    .from(openingHours)
    .where(eq(openingHours.spaceId, id));

  const slots = rules
    .filter((rule) => rule.dayOfWeek === dayOfWeek)
    .map((rule) => ({
      startMinute: rule.startMinute,
      endMinute: rule.endMinute,
    }));

  return c.json({
    spaceId: id,
    date,
    dayOfWeek,
    minHours: space.minHours,
    maxHours: space.maxHours,
    slots,
  });
});

export default v1;