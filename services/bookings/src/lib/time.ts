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

// YYYY-MM-DD in Europe/Amsterdam, offsetDays from today.
export function amsDateString(offsetDays: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000));

  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

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

export interface Interval {
  fromMs: number;
  toMs: number;
}

export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.fromMs < b.toMs && a.toMs > b.fromMs;
}