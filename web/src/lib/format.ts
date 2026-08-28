export function formatEuro(cents: number): string {
  const value = cents / 100;
  return `\u20ac${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

const AMSTERDAM_TIME_ZONE = "Europe/Amsterdam";

export function amsterdamOffsetMinutes(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const noonUtc = Date.UTC(y, m - 1, d, 12, 0, 0);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: AMSTERDAM_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = fmt.formatToParts(new Date(noonUtc));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hour = get("hour") % 24;
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return Math.round((asUtc - noonUtc) / 60000);
}

export function amsterdamOffset(dateStr: string): string {
  const diff = amsterdamOffsetMinutes(dateStr);
  const sign = diff < 0 ? "-" : "+";
  const abs = Math.abs(diff);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

export function localDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateTime(iso: string, lang: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(lang === "nl" ? "nl-NL" : "en-GB", {
    timeZone: AMSTERDAM_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function amsZonedIso(dateStr: string, timeStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [hh, mi] = timeStr.split(":").map(Number);
  const minutesIntoDay = hh * 60 + mi;
  const utc =
    Date.UTC(y, mo - 1, d) + minutesIntoDay * 60000 - amsterdamOffsetMinutes(dateStr) * 60000;
  return new Date(utc).toISOString();
}

export function amsTimeLabel(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: AMSTERDAM_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}`;
}