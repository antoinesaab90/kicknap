function lastSundayUtc(year: number, monthIndex: number): number {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
  const day = lastDay.getUTCDay();
  const shift = (day + 1) % 7;
  return Date.UTC(year, monthIndex, lastDay.getUTCDate() - shift, 1);
}

export function amsOffsetMinutes(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const noon = Date.UTC(y, m - 1, d, 12);
  const dstStart = lastSundayUtc(y, 2);
  const dstEnd = lastSundayUtc(y, 9);
  return noon >= dstStart && noon < dstEnd ? 120 : 60;
}

export function amsZonedIso(dateStr: string, timeStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [hh, mi] = timeStr.split(':').map(Number);
  const minutesIntoDay = hh * 60 + mi;
  const utc = Date.UTC(y, mo - 1, d) + minutesIntoDay * 60000 - amsOffsetMinutes(dateStr) * 60000;
  return new Date(utc).toISOString();
}

export function formatEuro(cents: number): string {
  const value = cents / 100;
  return `\u20ac${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

function amsWallClock(iso: string): { y: number; mo: number; d: number; hh: number; mm: number } {
  const epoch = Date.parse(iso);
  const dateStr = new Date(epoch).toISOString().slice(0, 10);
  const shifted = epoch + amsOffsetMinutes(dateStr) * 60000;
  const dt = new Date(shifted);
  return { y: dt.getUTCFullYear(), mo: dt.getUTCMonth() + 1, d: dt.getUTCDate(), hh: dt.getUTCHours(), mm: dt.getUTCMinutes() };
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatAmsterdam(iso: string): string {
  const { d, mo, hh, mm } = amsWallClock(iso);
  const weekday = WEEKDAYS[new Date(Date.UTC(amsWallClock(iso).y, amsWallClock(iso).mo - 1, amsWallClock(iso).d)).getUTCDay()];
  const h = String(hh).padStart(2, '0');
  const min = String(mm).padStart(2, '0');
  return `${weekday} ${d} ${MONTHS[mo - 1]}, ${h}:${min}`;
}

export function amsTimeLabel(iso: string): string {
  const { hh, mm } = amsWallClock(iso);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}