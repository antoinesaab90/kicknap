import { describe, expect, it } from 'vitest';
import {
  amsOffsetMinutes,
  amsTimeLabel,
  amsWallClock,
  amsZonedIso,
  formatAmsterdam,
  formatEuro,
} from '@/lib/format';

describe('amsOffsetMinutes (manual EU-DST rule, must match web Intl version)', () => {
  it('winter offset is +01:00 (60 min)', () => {
    expect(amsOffsetMinutes('2026-01-15')).toBe(60);
    expect(amsOffsetMinutes('2026-12-31')).toBe(60);
  });

  it('summer offset is +02:00 (120 min)', () => {
    expect(amsOffsetMinutes('2026-07-15')).toBe(120);
  });

  it('2026 DST start (last Sun Mar = Mar 29)', () => {
    expect(amsOffsetMinutes('2026-03-28')).toBe(60);
    expect(amsOffsetMinutes('2026-03-29')).toBe(120);
  });

  it('2026 DST end (last Sun Oct = Oct 25)', () => {
    expect(amsOffsetMinutes('2026-10-24')).toBe(120);
    expect(amsOffsetMinutes('2026-10-25')).toBe(60);
  });

  it('2025 boundaries (Mar 30 start, Oct 26 end)', () => {
    expect(amsOffsetMinutes('2025-03-29')).toBe(60);
    expect(amsOffsetMinutes('2025-03-30')).toBe(120);
    expect(amsOffsetMinutes('2025-10-25')).toBe(120);
    expect(amsOffsetMinutes('2025-10-26')).toBe(60);
  });

  it('2027 boundaries (Mar 28 start, Oct 31 end)', () => {
    expect(amsOffsetMinutes('2027-03-27')).toBe(60);
    expect(amsOffsetMinutes('2027-03-28')).toBe(120);
    expect(amsOffsetMinutes('2027-10-30')).toBe(120);
    expect(amsOffsetMinutes('2027-10-31')).toBe(60);
  });
});

describe('amsZonedIso — Amsterdam-local wall time to UTC ISO', () => {
  it('summer: 10:30 AMS (+02:00) is 08:30Z', () => {
    expect(amsZonedIso('2026-07-15', '10:30')).toBe('2026-07-15T08:30:00.000Z');
  });

  it('winter: 10:30 AMS (+01:00) is 09:30Z', () => {
    expect(amsZonedIso('2026-01-15', '10:30')).toBe('2026-01-15T09:30:00.000Z');
  });

  it('round-trips through amsTimeLabel', () => {
    for (const [date, time] of [
      ['2026-07-15', '10:30'],
      ['2026-01-15', '00:00'],
      ['2026-03-29', '23:59'],
      ['2026-10-25', '23:59'],
    ] as const) {
      expect(amsTimeLabel(amsZonedIso(date, time))).toBe(time);
    }
  });
});

describe('amsTimeLabel / amsWallClock', () => {
  it('formats UTC ISO to Amsterdam wall clock', () => {
    expect(amsTimeLabel('2026-07-15T08:30:00.000Z')).toBe('10:30');
    expect(amsTimeLabel('2026-01-15T09:30:00.000Z')).toBe('10:30');
  });

  it('wall clock fields are correct', () => {
    expect(amsWallClock('2026-07-15T08:30:00.000Z')).toMatchObject({
      y: 2026,
      mo: 7,
      d: 15,
      hh: 10,
      mm: 30,
    });
  });
});

describe('formatAmsterdam', () => {
  it('prints weekday + date + AMS time', () => {
    expect(formatAmsterdam('2026-07-15T08:30:00.000Z')).toBe('Wed 15 Jul, 10:30');
  });
});

describe('formatEuro', () => {
  it('whole euros drop the decimals', () => {
    expect(formatEuro(1500)).toBe('€15');
    expect(formatEuro(100)).toBe('€1');
  });

  it('cent amounts keep two decimals', () => {
    expect(formatEuro(1513)).toBe('€15.13');
    expect(formatEuro(2)).toBe('€0.02');
  });

  it('zero is €0', () => {
    expect(formatEuro(0)).toBe('€0');
  });
});