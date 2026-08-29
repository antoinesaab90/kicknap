import { amsOffsetMinutes } from './format';

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

export type DayState = 'open' | 'booked' | 'closed';

export function amsWeekday(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function nextDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

export function minutesToHm(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
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

export function subtractIntervals(free: MinutesInterval[], blocked: MinutesInterval[]): MinutesInterval[] {
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
  return Date.parse(`${dateStr}T00:00:00Z`) - amsOffsetMinutes(dateStr) * 60000;
}

export function rulesForDay(dateStr: string, rules: OpeningRule[]): OpeningRule[] {
  const dow = amsWeekday(dateStr);
  return rules.filter((rule) => rule.dayOfWeek === dow);
}

export function dayOpenIntervals(dateStr: string, rules: OpeningRule[]): MinutesInterval[] {
  return unionIntervals(
    rulesForDay(dateStr, rules).map((rule) => ({ start: rule.startMinute, end: rule.endMinute }))
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
    if (end > start) blocked.push({ start: (start - dayStart) / 60000, end: (end - dayStart) / 60000 });
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
  if (!open.length) return 'closed';
  const free = freeIntervals(dateStr, rules, booked);
  return hasFreeWindow(free, minHours) ? 'open' : 'booked';
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

export const TAX_RATE = 0.21;
export const GUEST_FEE_RATE = 0.1;

export interface PriceBreakdown {
  minutes: number;
  baseCents: number;
  taxCents: number;
  feeCents: number;
  totalCents: number;
}

export function computeBreakdown(minutes: number, hourlyCents: number): PriceBreakdown {
  const baseCents = Math.round((minutes / 60) * hourlyCents);
  const taxCents = Math.round(baseCents * TAX_RATE);
  const feeCents = Math.round(baseCents * GUEST_FEE_RATE);
  return { minutes, baseCents, taxCents, feeCents, totalCents: baseCents + feeCents };
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}