import { describe, expect, it } from "vitest";
import { allInCents, allInHourlyCents, computeBreakdown, formatDuration } from "./price";

describe("computeBreakdown", () => {
  it("splits a 6h30m stay at €15.75/hr into base, 16% fee and all-in total", () => {
    const b = computeBreakdown(390, 1575);
    expect(b.baseCents).toBe(10238);
    expect(b.feeCents).toBe(1950);
    expect(b.totalCents).toBe(12188);
    expect(b.feeCents).toBe(b.totalCents - b.baseCents);
  });

  it("matches the payments guest total for the fixed 3h session", () => {
    expect(computeBreakdown(180, 1800)).toEqual({
      minutes: 180,
      baseCents: 5400,
      feeCents: 1029,
      totalCents: 6429,
    });
  });

  it("fee is 16% of the total for a clean whole-euro session", () => {
    const b = computeBreakdown(240, 1050);
    expect(b.baseCents).toBe(4200);
    expect(b.feeCents).toBe(800);
    expect(b.totalCents).toBe(5000);
  });
});

describe("all-in helpers", () => {
  it("prices the per-hour display as the guest pays it", () => {
    expect(allInHourlyCents(1575)).toBe(1875);
    expect(allInHourlyCents(1050)).toBe(1250);
  });

  it("converts a booking base price to its all-in guest amount", () => {
    expect(allInCents(5400)).toBe(6429);
  });
});

describe("formatDuration", () => {
  it("formats whole and fractional hours", () => {
    expect(formatDuration(180)).toBe("3h");
    expect(formatDuration(390)).toBe("6h 30m");
    expect(formatDuration(195)).toBe("3h 15m");
  });
});