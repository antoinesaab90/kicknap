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

  let dayStart = fromMs;
  let firstDay = true;

  while (dayStart < toMs) {
    const dayOfWeek = amsDayMinute(new Date(dayStart).toISOString()).dayOfWeek;
    const nextDay = dayStart + 24 * 60 * 60 * 1000;
    const segmentFrom = firstDay ? amsMinutesOfDay(fromMs) : 0;
    const segmentTo = nextDay >= toMs ? amsMinutesOfDay(toMs) : 1440;
    if (!isCovered(dayOfWeek, segmentFrom, segmentTo)) return false;
    dayStart = nextDay;
    firstDay = false;
  }

  return true;
}