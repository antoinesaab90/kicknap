import { describe, expect, it } from "vitest";
import { computeBreakdown, formatDuration } from "./price";

describe("computeBreakdown", () => {
  it("splits a 6h30m stay at €15.75/hr into rent, tax-included and fee", () => {
    const b = computeBreakdown(390, 1575);
    expect(b.baseCents).toBe(10238);
    expect(b.taxCents).toBe(2150);
    expect(b.feeCents).toBe(1024);
    expect(b.totalCents).toBe(11262);
  });

  it("matches the payments guest total for the fixed 3h session", () => {
    expect(computeBreakdown(180, 1800)).toEqual({
      minutes: 180,
      baseCents: 5400,
      taxCents: 1134,
      feeCents: 540,
      totalCents: 5940,
    });
  });

  it("includes the fee in the total, as Stripe charges it", () => {
    const b = computeBreakdown(240, 1050);
    expect(b.baseCents).toBe(4200);
    expect(b.feeCents).toBe(420);
    expect(b.totalCents).toBe(b.baseCents + b.feeCents);
  });
});

describe("formatDuration", () => {
  it("formats whole and fractional hours", () => {
    expect(formatDuration(180)).toBe("3h");
    expect(formatDuration(390)).toBe("6h 30m");
    expect(formatDuration(195)).toBe("3h 15m");
  });
});