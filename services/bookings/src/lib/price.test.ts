import { describe, expect, it } from "vitest";
import { computePriceCents } from "./price.js";

const HOUR_MS = 60 * 60 * 1000;

describe("computePriceCents", () => {
  it("prices a whole hour at the hourly rate", () => {
    expect(computePriceCents(0, HOUR_MS, 2000)).toBe(2000);
  });

  it("prices fractional hours pro-rata", () => {
    // 1h30 at €20/h -> 3000 cents.
    expect(computePriceCents(0, 1.5 * HOUR_MS, 2000)).toBe(3000);
    // 30 min at €30/h -> 1500 cents.
    expect(computePriceCents(0, 0.5 * HOUR_MS, 3000)).toBe(1500);
  });

  it("rounds to the nearest cent with a half-up tie", () => {
    // 1h30 at €15/h -> 22.50 -> 2250 (exact).
    expect(computePriceCents(0, 1.5 * HOUR_MS, 1500)).toBe(2250);
    // 91 min at €10/h -> 1516.66... -> 1517.
    expect(computePriceCents(0, (91 / 60) * HOUR_MS, 1000)).toBe(1517);
  });

  it("prices a zero-length window at zero", () => {
    expect(computePriceCents(0, 0, 5000)).toBe(0);
  });

  it("is linear in the hourly rate", () => {
    expect(computePriceCents(0, 2 * HOUR_MS, 4250)).toBe(8500);
  });
});