export const TIME_ZONE = "Europe/Amsterdam";

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function amsDayMinute(iso: string): { dayOfWeek: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  const hour = Number(read("hour"));
  return {
    dayOfWeek: WEEKDAYS[read("weekday")] ?? 0,
    minute: (hour === 24 ? 0 : hour) * 60 + Number(read("minute")),
  };
}

export function amsMinutesOfDay(ms: number): number {
  return amsDayMinute(new Date(ms).toISOString()).minute;
}

// YYYY-MM-DD -> day of week in Amsterdam (0 = Sunday)
export function dateDayOfWeek(date: string): number {
  return amsDayMinute(`${date}T02:00:00Z`).dayOfWeek;
}

export interface OpeningRule {
  startMinute: number;
  endMinute: number;
}

// YYYY-MM-DD of the instant in the Amsterdam timezone.
function amsDateStringAt(ms: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ms);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

// Absolute start-of-day (00:00 local) for a YYYY-MM-DD in Amsterdam.
// Probed at 12:00Z so the wall clock is always well inside that calendar day.
function amsMidnightOfDate(date: string): number {
  const probe = Date.parse(`${date}T12:00:00Z`);
  return probe - amsMinutesOfDay(probe) * 60 * 1000;
}

// Next calendar date after `date` in the Amsterdam timezone.
// Safe across DST transitions (a wall day can be 23, 24 or 25 hours long).
function amsNextDate(date: string): string {
  let ms = amsMidnightOfDate(date) + 24 * 60 * 60 * 1000;
  let next = amsDateStringAt(ms);
  if (next === date) {
    ms += 24 * 60 * 60 * 1000;
    next = amsDateStringAt(ms);
  }
  return next;
}

export function windowCovered(
  fromMs: number,
  toMs: number,
  rules: (OpeningRule & { dayOfWeek: number })[]
): boolean {
  const byDay = new Map<number, OpeningRule[]>();
  for (const rule of rules) {
    const bucket = byDay.get(rule.dayOfWeek) ?? [];
    bucket.push({ startMinute: rule.startMinute, endMinute: rule.endMinute });
    byDay.set(rule.dayOfWeek, bucket);
  }

  const isCovered = (dayOfWeek: number, startMinute: number, endMinute: number) => {
    const dayRules = byDay.get(dayOfWeek) ?? [];
    return dayRules.some(
      (rule) => rule.startMinute <= startMinute && rule.endMinute >= endMinute
    );
  };

  const startDate = amsDateStringAt(fromMs);
  const endDate = amsDateStringAt(toMs - 1);

  let date = startDate;
  for (;;) {
    const dayStart = amsMidnightOfDate(date);
    const dayEnd = amsMidnightOfDate(amsNextDate(date));
    const segmentFrom = Math.max(fromMs, dayStart);
    const segmentTo = Math.min(toMs, dayEnd);

    if (segmentTo > segmentFrom) {
      const startMinute = segmentFrom === fromMs ? amsMinutesOfDay(fromMs) : 0;
      const endMinute = segmentTo === toMs ? amsMinutesOfDay(toMs) : 1440;
      if (!isCovered(dateDayOfWeek(date), startMinute, endMinute)) return false;
    }

    if (date === endDate) break;
    date = amsNextDate(date);
  }

  return true;
}