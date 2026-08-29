import { describe, expect, it } from "vitest";
import { computeFees } from "./fees.js";

describe("computeFees", () => {
  it("embeds a single 16% fee in the guest total, host gets the full base", () => {
    const f = computeFees(5400);
    expect(f.guestTotalCents).toBe(6429);
    expect(f.guestFeeCents).toBe(1029);
    expect(f.hostFeeCents).toBe(0);
    expect(f.hostPayoutCents).toBe(5400);
  });

  it("rounds half comfortably for whole-euro sessions", () => {
    const f = computeFees(4200);
    expect(f.guestTotalCents).toBe(5000);
    expect(f.guestFeeCents).toBe(800);
    expect(f.hostPayoutCents).toBe(4200);
  });

  it("fee equals 16% of the guest total (within rounding)", () => {
    const f = computeFees(10238);
    expect(f.guestFeeCents).toBeCloseTo(f.guestTotalCents * 0.16, -1);
    expect(f.guestTotalCents - f.hostPayoutCents).toBe(f.guestFeeCents);
  });
});