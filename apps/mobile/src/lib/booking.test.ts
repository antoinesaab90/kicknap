import { describe, expect, it } from 'vitest';
import {
  availableStartMinutes,
  computeBreakdown,
  dayState,
  dayOpenIntervals,
  formatDuration,
  freeIntervals,
  hasFreeWindow,
  minutesToHm,
  nextDateStr,
  subtractIntervals,
  unionIntervals,
  windowsFromStart,
  type BookedWindow,
  type OpeningRule,
} from '@/lib/booking';

const day = (dow: number, startMinute: number, endMinute: number): OpeningRule => ({
  dayOfWeek: dow,
  startMinute,
  endMinute,
});

// Space 25 demo config: weekdays 08:00-16:00 (Mon=1..Fri=5), min 2h.
const weekdayEightSixteen = [1, 2, 3, 4, 5].map((dow) => day(dow, 480, 960));

const booked = (fromIso: string, toIso: string): BookedWindow => ({ fromIso, toIso });

describe('unionIntervals', () => {
  it('merges overlapping and adjacent-free intervals', () => {
    expect(unionIntervals([
      { start: 480, end: 600 },
      { start: 570, end: 720 },
      { start: 900, end: 1000 },
    ])).toEqual([
      { start: 480, end: 720 },
      { start: 900, end: 1000 },
    ]);
  });

  it('drops empty and out-of-order input', () => {
    expect(unionIntervals([
      { start: 800, end: 700 },
      { start: 100, end: 100 },
      { start: 10, end: 20 },
    ])).toEqual([{ start: 10, end: 20 }]);
  });
});

describe('subtractIntervals', () => {
  it('carves blocked windows out of free time', () => {
    const free = subtractIntervals(
      [{ start: 480, end: 960 }],
      [{ start: 600, end: 660 }]
    );
    expect(free).toEqual([
      { start: 480, end: 600 },
      { start: 660, end: 960 },
    ]);
  });

  it('clamps blocked windows that hang off the free interval', () => {
    const free = subtractIntervals([{ start: 480, end: 960 }], [{ start: 0, end: 600 }]);
    expect(free).toEqual([{ start: 600, end: 960 }]);
  });

  it('ignores blocked windows outside free time', () => {
    const free = subtractIntervals([{ start: 480, end: 600 }], [{ start: 700, end: 800 }]);
    expect(free).toEqual([{ start: 480, end: 600 }]);
  });
});

describe('date/day helpers', () => {
  it('nextDateStr rolls months and years', () => {
    expect(nextDateStr('2026-01-31')).toBe('2026-02-01');
    expect(nextDateStr('2026-12-31')).toBe('2027-01-01');
  });

  it('minutesToHm pads and rolls over', () => {
    expect(minutesToHm(0)).toBe('00:00');
    expect(minutesToHm(540)).toBe('09:00');
    expect(minutesToHm(965)).toBe('16:05');
  });
});

describe('freeIntervals', () => {
  it('returns weekday opening hours when nothing is booked', () => {
    // 2026-08-31 is a Monday.
    const free = freeIntervals('2026-08-31', weekdayEightSixteen, []);
    expect(free).toEqual([{ start: 480, end: 960 }]);
  });

  it('returns [] on a closed day (weekend)', () => {
    // 2026-08-30 is a Sunday.
    expect(freeIntervals('2026-08-30', weekdayEightSixteen, [])).toEqual([]);
  });

  it('carves a booked window out of a summer day', () => {
    const free = freeIntervals('2026-08-31', weekdayEightSixteen, [
      booked('2026-08-31T08:00:00Z', '2026-08-31T09:00:00Z'), // 10:00-11:00 local
    ]);
    expect(free).toEqual([
      { start: 480, end: 600 },
      { start: 660, end: 960 },
    ]);
  });

  it('ignores bookings outside the day', () => {
    const free = freeIntervals('2026-09-01', weekdayEightSixteen, [
      booked('2026-08-31T08:00:00Z', '2026-08-31T12:00:00Z'),
    ]);
    expect(free).toEqual([{ start: 480, end: 960 }]);
  });
});

describe('dayState', () => {
  it('marks a closed day', () => {
    expect(dayState('2026-08-30', weekdayEightSixteen, [], 2)).toBe('closed');
  });

  it('marks an open day when a min-length window survives', () => {
    expect(dayState('2026-08-31', weekdayEightSixteen, [], 2)).toBe('open');
  });

  it('marks a fully-booked day when no min-length window is left', () => {
    // 08:00-16:00 open, min 4h: book 08-12 and 12-16 → nothing left.
    const free = freeIntervals('2026-08-31', weekdayEightSixteen, [
      booked('2026-08-31T06:00:00Z', '2026-08-31T10:00:00Z'), // 08:00-12:00
      booked('2026-08-31T10:00:00Z', '2026-08-31T14:00:00Z'), // 12:00-16:00
    ]);
    expect(hasFreeWindow(free, 4)).toBe(false);
    expect(
      dayState('2026-08-31', weekdayEightSixteen, [
        booked('2026-08-31T06:00:00Z', '2026-08-31T10:00:00Z'),
        booked('2026-08-31T10:00:00Z', '2026-08-31T14:00:00Z'),
      ], 4)
    ).toBe('booked');
  });

  it('still opens the day when a booking leaves a window >= min', () => {
    expect(
      dayState('2026-08-31', weekdayEightSixteen, [
        booked('2026-08-31T06:00:00Z', '2026-08-31T09:00:00Z'), // 08:00-11:00
      ], 2)
    ).toBe('open');
  });
});

describe('fixed-duration starts (take it or leave it)', () => {
  it('exposes every possible fixed 4h start on the free interval', () => {
    const starts = availableStartMinutes([{ start: 540, end: 780 }], 4);
    expect(starts).toEqual([540]);
    const starts8 = availableStartMinutes([{ start: 480, end: 960 }], 4);
    expect(starts8).toEqual([480, 510, 540, 570, 600, 630, 660, 690, 720]);
  });
});

describe('flexible windows', () => {
  it('windowsFromStart respects min and max hours', () => {
    // 08:00-16:00 free, min 2h, max 4h, start 08:00.
    const ends = windowsFromStart([{ start: 480, end: 960 }], 480, 2, 4);
    expect(ends).toEqual([600, 630, 660, 690, 720]);
  });

  it('clips ends at the free interval close', () => {
    // Free 10:00-14:00, min 2h max 4h, start 10:30 → ends 12:30..14:00.
    const ends = windowsFromStart([{ start: 600, end: 840 }], 630, 2, 4);
    expect(ends).toEqual([750, 780, 810, 840]);
  });

  it('returns [] for a start with no min-length room', () => {
    expect(windowsFromStart([{ start: 480, end: 600 }], 540, 2, 4)).toEqual([]);
  });

  it('availableStartMinutes exposes flexible start points', () => {
    const starts = availableStartMinutes([{ start: 480, end: 960 }], 2);
    expect(starts).toEqual([480, 510, 540, 570, 600, 630, 660, 690, 720, 750, 780, 810, 840]);
  });
});

describe('dayOpenIntervals', () => {
  it('unions multiple rules for the same weekday', () => {
    const free = dayOpenIntervals('2026-08-31', [
      day(1, 480, 720),
      day(1, 660, 960),
    ]);
    expect(free).toEqual([{ start: 480, end: 960 }]);
  });
});

describe('computeBreakdown', () => {
  it('splits a 6h30m stay at €15.75/hr into rent, VAT-included and fee', () => {
    const b = computeBreakdown(390, 1575);
    expect(b.baseCents).toBe(10238);
    expect(b.taxCents).toBe(2150);
    expect(b.feeCents).toBe(1024);
    expect(b.totalCents).toBe(11262);
  });

  it('matches the payments guest total for the fixed 3h session', () => {
    const b = computeBreakdown(180, 1800);
    expect(b).toEqual({
      minutes: 180,
      baseCents: 5400,
      taxCents: 1134,
      feeCents: 540,
      totalCents: 5940,
    });
  });

  it('rounds a fractional hour stay', () => {
    const b = computeBreakdown(150, 1000);
    expect(b.baseCents).toBe(2500);
    expect(b.feeCents).toBe(250);
  });
});

describe('formatDuration', () => {
  it('formats whole and fractional hours', () => {
    expect(formatDuration(180)).toBe('3h');
    expect(formatDuration(390)).toBe('6h 30m');
    expect(formatDuration(195)).toBe('3h 15m');
  });
});