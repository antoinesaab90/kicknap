import { describe, expect, it } from "vitest";
import {
  amsDayMinute,
  amsMinutesOfDay,
  dateDayOfWeek,
  flexCoveredAt,
  flexOffsets,
  windowCovered,
  type OpeningRule,
} from "./time.js";

const rule = (
  dayOfWeek: number,
  startMinute: number,
  endMinute: number
): OpeningRule & { dayOfWeek: number } => ({ dayOfWeek, startMinute, endMinute });

describe("amsDayMinute", () => {
  it("maps weekday abbreviations to 0-6", () => {
    expect(amsDayMinute("2026-08-30T10:00:00Z").dayOfWeek).toBe(0); // Sunday
    expect(amsDayMinute("2026-08-31T10:00:00Z").dayOfWeek).toBe(1); // Monday
    expect(amsDayMinute("2026-09-05T10:00:00Z").dayOfWeek).toBe(6); // Saturday
  });

  it("converts local wall time to minutes-of-day", () => {
    expect(amsDayMinute("2026-08-31T06:30:00Z").minute).toBe(8 * 60 + 30); // CEST (UTC+2)
    expect(amsDayMinute("2026-01-06T09:00:00Z").minute).toBe(10 * 60); // CET (UTC+1)
  });

  it("normalizes the hour-24 quirk from Intl to midnight", () => {
    // 23:00 UTC in CET = 00:00 local; Intl can emit hour "24".
    const day = amsDayMinute("2026-01-01T23:00:00Z");
    expect(day.minute).toBe(0);
  });
});

describe("amsMinutesOfDay", () => {
  it("returns wall-clock minutes for an instant", () => {
    expect(amsMinutesOfDay(Date.parse("2026-07-15T08:30:00Z"))).toBe(10 * 60 + 30);
  });
});

describe("dateDayOfWeek", () => {
  it("returns the Amsterdam day-of-week for YYYY-MM-DD", () => {
    expect(dateDayOfWeek("2026-08-30")).toBe(0); // Sunday
    expect(dateDayOfWeek("2026-08-31")).toBe(1);
    expect(dateDayOfWeek("2026-09-05")).toBe(6);
  });

  it("handles a DST-transition date correctly", () => {
    // 2026-03-29 is the spring-forward date in Europe/Amsterdam.
    expect(dateDayOfWeek("2026-03-29")).toBe(0); // Sunday
    expect(dateDayOfWeek("2026-10-25")).toBe(0); // fall-back, Sunday
  });
});

describe("windowCovered", () => {
  // Helpers producing absolute times in Europe/Amsterdam wall terms.
  // In CET (winter): wall+01:00. In CEST (summer): wall+02:00.
  const at = (isoWall: string) => Date.parse(isoWall);

  it("covers a same-day window fully inside the rule", () => {
    const rules = [rule(1, 8 * 60, 22 * 60)];
    expect(
      windowCovered(at("2026-08-31T06:00:00Z"), at("2026-08-31T20:00:00Z"), rules)
    ).toBe(true); // Monday 08:00-22:00 local
  });

  it("rejects a window outside the rule", () => {
    const rules = [rule(1, 8 * 60, 18 * 60)];
    expect(
      windowCovered(at("2026-08-31T17:00:00Z"), at("2026-08-31T20:00:00Z"), rules)
    ).toBe(false); // runs past closing 19:00 local
  });

  it("rejects a window on a day with no rule", () => {
    const rules = [rule(2, 8 * 60, 18 * 60)]; // only Tuesday
    expect(
      windowCovered(at("2026-08-31T06:00:00Z"), at("2026-08-31T08:00:00Z"), rules)
    ).toBe(false); // Monday
  });

  it("covers a multi-day window when every covered day has a rule", () => {
    const rules = [rule(1, 0, 1440), rule(2, 0, 1440)];
    expect(
      windowCovered(at("2026-08-31T00:00:00Z"), at("2026-09-01T00:00:00Z"), rules)
    ).toBe(true);
  });

  it("rejects a window that spills onto an uncovered day", () => {
    const rules = [rule(1, 0, 1440), rule(2, 0, 1440)]; // no Wednesday rule
    expect(
      windowCovered(at("2026-08-31T00:00:00Z"), at("2026-09-02T00:00:00Z"), rules)
    ).toBe(false);
  });

  it("covers a same-day window clipped inside the rule on both ends", () => {
    const rules = [rule(1, 8 * 60, 22 * 60)];
    expect(
      windowCovered(
        at("2026-08-31T06:30:00Z"), // Mon 08:30 local
        at("2026-08-31T14:00:00Z") // Mon 16:00 local
      , rules)
    ).toBe(true);
  });

  it("rejects a multi-day window whose last-day morning precedes the day's opening", () => {
    // Window Mon 10:00 -> Tue 18:00 local. Covers Mon 10:00->midnight and
    // all of Tuesday up to 18:00, so Tuesday's rule must start at/before 00:00.
    const rules = [rule(1, 8 * 60, 22 * 60), rule(2, 6 * 60, 20 * 60)];
    expect(
      windowCovered(
        at("2026-08-31T08:00:00Z"),
        at("2026-09-01T16:00:00Z"),
        rules
      )
    ).toBe(false);
  });

  it("covers a late-start multi-day window when every covered day has rules", () => {
    // Regression: the old fixed-24h stepping rejected this (false negative).
    // Mon 22:00 -> Tue 14:00 local: Mon 22:00->midnight inside the 22:00 close,
    // Tuesday 00:00->14:00 inside the all-day rule.
    const rules = [rule(1, 8 * 60, 24 * 60), rule(2, 0, 24 * 60)];
    expect(
      windowCovered(
        at("2026-08-31T20:00:00Z"), // Mon 22:00 CEST
        at("2026-09-01T12:00:00Z"), // Tue 14:00 CEST
        rules
      )
    ).toBe(true);
  });

  it("supports overnight rules where endMinute reaches 1440", () => {
    const rules = [rule(0, 0, 1440), rule(1, 0, 1440)];
    expect(
      windowCovered(
        at("2026-08-30T22:00:00Z"),
        at("2026-08-31T06:00:00Z"),
        rules
      )
    ).toBe(true);
  });

  it("handles a window crossing the spring-forward DST transition", () => {
    // 2026-03-29 00:00 -> 2026-03-30 00:00 Amsterdam (23-hour day).
    const rules = [rule(0, 0, 1440), rule(1, 0, 1440)];
    expect(
      windowCovered(
        at("2026-03-28T23:00:00Z"),
        at("2026-03-29T22:00:00Z"),
        rules
      )
    ).toBe(true);
  });

  it("handles a window crossing the fall-back DST transition", () => {
    // 2026-10-25 00:00 -> 2026-10-26 00:00 Amsterdam (25-hour day).
    const rules = [rule(0, 0, 1440), rule(1, 0, 1440)];
    expect(
      windowCovered(
        at("2026-10-24T22:00:00Z"),
        at("2026-10-25T22:00:00Z"),
        rules
      )
    ).toBe(true);
  });
});

describe("flexOffsets", () => {
  it("returns the exact start first, then symmetric 1-hour steps outward", () => {
    expect(flexOffsets(0)).toEqual([0]);
    expect(flexOffsets(120)).toEqual([0, -60, 60, -120, 120]);
    expect(flexOffsets(240)).toEqual([0, -60, 60, -120, 120, -180, 180, -240, 240]);
  });

  it("rounds a non-hour budget up to whole hours", () => {
    expect(flexOffsets(90)).toEqual([0, -60, 60, -120, 120]);
  });
});

describe("flexCoveredAt", () => {
  // Rule like demo space 14: Monday 13:00-16:00 local (CEST, UTC+2 in August).
  const rules = [rule(1, 13 * 60, 16 * 60)];

  it("resolves a window that starts too early by shifting +1h", () => {
    // Mon 12:30 -> 14:30 local: starts before opening, not covered exactly.
    expect(
      windowCovered(Date.parse("2026-08-31T10:30:00Z"), Date.parse("2026-08-31T12:30:00Z"), rules)
    ).toBe(false);
    const result = flexCoveredAt(
      Date.parse("2026-08-31T10:30:00Z"),
      Date.parse("2026-08-31T12:30:00Z"),
      rules,
      60
    );
    expect(result).toEqual({ covered: true, shiftMinutes: 60 });
  });

  it("prefers the exact start over any shift", () => {
    const allDay = [rule(1, 10 * 60, 18 * 60)];
    const result = flexCoveredAt(
      Date.parse("2026-08-31T10:00:00Z"), // Mon 12:00 local
      Date.parse("2026-08-31T12:00:00Z"), // Mon 14:00 local
      allDay,
      240
    );
    expect(result).toEqual({ covered: true, shiftMinutes: 0 });
  });

  it("stays unavailable when no shift fits", () => {
    const result = flexCoveredAt(
      Date.parse("2026-09-01T10:30:00Z"), // Tue — no rule at all
      Date.parse("2026-09-01T12:30:00Z"),
      rules,
      240
    );
    expect(result).toEqual({ covered: false, shiftMinutes: 0 });
  });
});