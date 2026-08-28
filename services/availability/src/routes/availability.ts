import { Hono } from "hono";
import { eq, inArray } from "drizzle-orm";
import { openingHours } from "../db/schema.js";
import { db } from "../db/index.js";
import { fetchAllSpaces, fetchOwnedSpace, fetchSpace } from "../lib/listings.js";
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

// GET /api/v1/check-many?from=2026-08-28T08:00:00Z&to=2026-08-28T11:00:00Z
// Availability for every published space in one call (used by search filters).
v1.get("/check-many", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");

  if (!from || !to) return c.json({ error: "missing_from_or_to" }, 400);

  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
    return c.json({ error: "invalid_range" }, 400);
  }

  const spaces = await fetchAllSpaces();
  if (!spaces.length) return c.json({ from, to, results: [] });

  const rules = (await db
    .select()
    .from(openingHours)
    .where(inArray(openingHours.spaceId, spaces.map((s) => s.id)))) as (OpeningHour & { dayOfWeek: number })[];

  const rulesBySpace = new Map<number, OpeningHour[]>();
  for (const rule of rules) {
    const list = rulesBySpace.get(rule.spaceId) ?? [];
    list.push(rule);
    rulesBySpace.set(rule.spaceId, list);
  }

  const durationMinutes = (toMs - fromMs) / 60000;

  const results = spaces.map((space) => {
    if (durationMinutes < space.minHours * 60) {
      return { spaceId: space.id, available: false, reason: "shorter_than_min" as const };
    }
    if (durationMinutes > space.maxHours * 60) {
      return { spaceId: space.id, available: false, reason: "longer_than_max" as const };
    }
    const spaceRules = rulesBySpace.get(space.id) ?? [];
    if (!spaceRules.length) {
      return { spaceId: space.id, available: false, reason: "no_opening_hours" as const };
    }
    const covered = windowCovered(fromMs, toMs, spaceRules);
    return {
      spaceId: space.id,
      available: covered,
      reason: covered ? ("available" as const) : ("outside_opening_hours" as const),
    };
  });

  const available = results.filter((r) => r.available).length;
  return c.json({ from, to, available, total: results.length, results });
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

// GET /api/v1/spaces/:id/hours — weekly opening rules for a space
v1.get("/spaces/:id/hours", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid_id" }, 400);

  const rules = await db
    .select()
    .from(openingHours)
    .where(eq(openingHours.spaceId, id))
    .orderBy(openingHours.dayOfWeek);

  return c.json({
    spaceId: id,
    rules: rules.map((rule) => ({
      dayOfWeek: rule.dayOfWeek,
      startMinute: rule.startMinute,
      endMinute: rule.endMinute,
    })),
  });
});

// PUT /api/v1/spaces/:id/hours { hostEmail, rules: [{dayOfWeek, startMinute, endMinute}] }
// Replaces the full weekly schedule. Per-day (spaceId, dayOfWeek) unique.
v1.put("/spaces/:id/hours", async (c) => {
  const id = Number(c.req.param("id"));
  const body = (await c.req.json().catch(() => null)) as {
    hostEmail?: unknown;
    rules?: unknown;
  } | null;
  if (!Number.isInteger(id)) return c.json({ error: "invalid_id" }, 400);
  const hostEmail = typeof body?.hostEmail === "string" ? body.hostEmail.trim() : "";
  if (!hostEmail) return c.json({ error: "invalid_host" }, 400);

  const space = await fetchOwnedSpace(id, hostEmail);
  if (!space) return c.json({ error: "space_not_found" }, 404);

  const rules = Array.isArray(body?.rules) ? body.rules : [];
  const parsed: { dayOfWeek: number; startMinute: number; endMinute: number }[] = [];
  for (const rule of rules) {
    const r = rule as Record<string, unknown>;
    const dayOfWeek = Number(r.dayOfWeek);
    const startMinute = Number(r.startMinute);
    const endMinute = Number(r.endMinute);
    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6 ||
      !Number.isInteger(startMinute) ||
      !Number.isInteger(endMinute) ||
      startMinute < 0 ||
      endMinute > 1440 ||
      endMinute <= startMinute
    ) {
      return c.json({ error: "invalid_rule" }, 400);
    }
    parsed.push({ dayOfWeek, startMinute, endMinute });
  }

  if (parsed.length > 7) return c.json({ error: "too_many_rules" }, 400);

  await db.delete(openingHours).where(eq(openingHours.spaceId, id));
  if (parsed.length) {
    await db.insert(openingHours).values(parsed.map((rule) => ({ ...rule, spaceId: id })));
  }

  return c.json({ spaceId: id, rules: parsed.sort((a, b) => a.dayOfWeek - b.dayOfWeek) });
});

export default v1;