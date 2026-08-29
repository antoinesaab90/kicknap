import { describe, expect, it } from "vitest";
import {
  availableStartMinutes,
  dayState,
  freeIntervals,
  hasFreeWindow,
  minutesToHm,
  nextDateStr,
  subtractIntervals,
  unionIntervals,
  windowsFromStart,
  type BookedWindow,
  type OpeningRule,
} from "./availability";

const day = (dow: number, startMinute: number, endMinute: number): OpeningRule => ({
  dayOfWeek: dow,
  startMinute,
  endMinute,
});

const weekdayEightSixteen = [1, 2, 3, 4, 5].map((dow) => day(dow, 480, 960));

const booked = (fromIso: string, toIso: string): BookedWindow => ({ fromIso, toIso });

describe("unionIntervals", () => {
  it("merges overlapping and adjacent-free intervals and drops junk", () => {
    expect(
      unionIntervals([
        { start: 480, end: 600 },
        { start: 570, end: 720 },
        { start: 900, end: 1000 },
        { start: 100, end: 100 },
        { start: 800, end: 700 },
      ])
    ).toEqual([
      { start: 480, end: 720 },
      { start: 900, end: 1000 },
    ]);
  });
});

describe("subtractIntervals", () => {
  it("carves blocked windows out of free time", () => {
    expect(subtractIntervals([{ start: 480, end: 960 }], [{ start: 600, end: 660 }])).toEqual([
      { start: 480, end: 600 },
      { start: 660, end: 960 },
    ]);
  });
});

describe("date helpers", () => {
  it("nextDateStr rolls months and years", () => {
    expect(nextDateStr("2026-01-31")).toBe("2026-02-01");
    expect(nextDateStr("2026-12-31")).toBe("2027-01-01");
  });

  it("minutesToHm pads and rolls over", () => {
    expect(minutesToHm(0)).toBe("00:00");
    expect(minutesToHm(540)).toBe("09:00");
    expect(minutesToHm(965)).toBe("16:05");
  });
});

describe("freeIntervals", () => {
  it("returns weekday opening hours and [] on a closed day", () => {
    expect(freeIntervals("2026-08-31", weekdayEightSixteen, [])).toEqual([
      { start: 480, end: 960 },
    ]);
    expect(freeIntervals("2026-08-30", weekdayEightSixteen, [])).toEqual([]);
  });

  it("carves a booked window (summer UTC) out of the day", () => {
    const free = freeIntervals("2026-08-31", weekdayEightSixteen, [
      booked("2026-08-31T08:00:00Z", "2026-08-31T09:00:00Z"),
    ]);
    expect(free).toEqual([
      { start: 480, end: 600 },
      { start: 660, end: 960 },
    ]);
  });
});

describe("dayState", () => {
  const both = [
    booked("2026-08-31T06:00:00Z", "2026-08-31T10:00:00Z"),
    booked("2026-08-31T10:00:00Z", "2026-08-31T14:00:00Z"),
  ];
  it("marks closed, open and fully-booked days", () => {
    expect(dayState("2026-08-30", weekdayEightSixteen, [], 4)).toBe("closed");
    expect(dayState("2026-08-31", weekdayEightSixteen, [], 4)).toBe("open");
    expect(hasFreeWindow(freeIntervals("2026-08-31", weekdayEightSixteen, both), 4)).toBe(false);
    expect(dayState("2026-08-31", weekdayEightSixteen, both, 4)).toBe("booked");
  });
});

describe("atomic windows (take it or leave it)", () => {
  it("exposes every possible fixed 4h start on the free interval", () => {
    expect(availableStartMinutes([{ start: 540, end: 780 }], 4)).toEqual([540]);
    expect(availableStartMinutes([{ start: 480, end: 960 }], 4)).toEqual([
      480, 510, 540, 570, 600, 630, 660, 690, 720,
    ]);
  });
});

describe("flexible windows", () => {
  it("windowsFromStart respects min and max hours", () => {
    expect(windowsFromStart([{ start: 480, end: 960 }], 480, 2, 4)).toEqual([
      600, 630, 660, 690, 720,
    ]);
  });

  it("clips ends at the free interval close", () => {
    expect(windowsFromStart([{ start: 600, end: 840 }], 630, 2, 4)).toEqual([
      750, 780, 810, 840,
    ]);
  });

  it("exposes flexible start points", () => {
    expect(availableStartMinutes([{ start: 480, end: 960 }], 2)).toEqual([
      480, 510, 540, 570, 600, 630, 660, 690, 720, 750, 780, 810, 840,
    ]);
  });
});