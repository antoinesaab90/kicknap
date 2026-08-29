import { amsterdamOffsetMinutes, minutesToTime } from "@/lib/format";

export interface OpeningRule {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

export interface MinutesInterval {
  start: number;
  end: number;
}

export interface BookedWindow {
  fromIso: string;
  toIso: string;
}

export type DayState = "open" | "booked" | "closed";

export function amsWeekday(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function nextDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

export { minutesToTime as minutesToHm };

// Amsterdam-local "today" as YYYY-MM-DD (correct across the device timezone).
export function todayAmsterdamDate(): string {
  const now = new Date();
  const offset = amsterdamOffsetMinutes(now.toISOString().slice(0, 10));
  const shifted = new Date(now.getTime() + offset * 60000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function unionIntervals(intervals: MinutesInterval[]): MinutesInterval[] {
  const sorted = [...intervals]
    .filter((iv) => iv.end > iv.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: MinutesInterval[] = [];
  for (const iv of sorted) {
    const last = merged[merged.length - 1];
    if (last && iv.start <= last.end) {
      last.end = Math.max(last.end, iv.end);
    } else {
      merged.push({ ...iv });
    }
  }
  return merged;
}

export function subtractIntervals(
  free: MinutesInterval[],
  blocked: MinutesInterval[]
): MinutesInterval[] {
  const sortedBlocked = unionIntervals(blocked);
  let result = unionIntervals(free);
  for (const block of sortedBlocked) {
    const next: MinutesInterval[] = [];
    for (const iv of result) {
      if (block.end <= iv.start || block.start >= iv.end) {
        next.push(iv);
        continue;
      }
      if (block.start > iv.start) next.push({ start: iv.start, end: block.start });
      if (block.end < iv.end) next.push({ start: block.end, end: iv.end });
    }
    result = next;
  }
  return result;
}

function amsMidnightMs(dateStr: string): number {
  return Date.parse(`${dateStr}T00:00:00Z`) - amsterdamOffsetMinutes(dateStr) * 60000;
}

export function rulesForDay(dateStr: string, rules: OpeningRule[]): OpeningRule[] {
  const dow = amsWeekday(dateStr);
  return rules.filter((rule) => rule.dayOfWeek === dow);
}

export function dayOpenIntervals(dateStr: string, rules: OpeningRule[]): MinutesInterval[] {
  return unionIntervals(
    rulesForDay(dateStr, rules).map((rule) => ({
      start: rule.startMinute,
      end: rule.endMinute,
    }))
  );
}

export function freeIntervals(
  dateStr: string,
  rules: OpeningRule[],
  booked: BookedWindow[]
): MinutesInterval[] {
  const open = dayOpenIntervals(dateStr, rules);
  if (!open.length) return [];
  const dayStart = amsMidnightMs(dateStr);
  const dayEnd = amsMidnightMs(nextDateStr(dateStr));
  const blocked: MinutesInterval[] = [];
  for (const window of booked) {
    const fromMs = Date.parse(window.fromIso);
    const toMs = Date.parse(window.toIso);
    const start = Math.max(fromMs, dayStart);
    const end = Math.min(toMs, dayEnd);
    if (end > start) {
      blocked.push({ start: (start - dayStart) / 60000, end: (end - dayStart) / 60000 });
    }
  }
  return subtractIntervals(open, blocked);
}

export function hasFreeWindow(free: MinutesInterval[], minHours: number): boolean {
  return free.some((iv) => iv.end - iv.start >= minHours * 60);
}

export function dayState(
  dateStr: string,
  rules: OpeningRule[],
  booked: BookedWindow[],
  minHours: number
): DayState {
  const open = dayOpenIntervals(dateStr, rules);
  if (!open.length) return "closed";
  const free = freeIntervals(dateStr, rules, booked);
  return hasFreeWindow(free, minHours) ? "open" : "booked";
}

export function availableStartMinutes(
  free: MinutesInterval[],
  minHours: number,
  stepMin = 30
): number[] {
  const starts: number[] = [];
  for (const iv of free) {
    if (iv.end - iv.start < minHours * 60) continue;
    for (let start = iv.start; start + minHours * 60 <= iv.end; start += stepMin) {
      starts.push(start);
    }
  }
  return starts;
}

export function windowsFromStart(
  free: MinutesInterval[],
  startMin: number,
  minHours: number,
  maxHours: number,
  stepMin = 30
): number[] {
  const iv = free.find((f) => f.start <= startMin && startMin < f.end);
  if (!iv || startMin + minHours * 60 > iv.end) return [];
  const latestEnd = Math.min(iv.end, startMin + maxHours * 60);
  const ends: number[] = [];
  for (let end = startMin + minHours * 60; end <= latestEnd; end += stepMin) {
    ends.push(end);
  }
  return ends;
}