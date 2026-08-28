import { describe, expect, it } from "vitest";
import { amsDateString, amsDayMinute, intervalsOverlap } from "./time.js";

describe("amsDayMinute", () => {
  it("returns the Amsterdam wall-clock minute of an instant", () => {
    expect(amsDayMinute("2026-07-15T08:30:00Z").minute).toBe(10 * 60 + 30); // CEST
    expect(amsDayMinute("2026-01-15T09:00:00Z").minute).toBe(10 * 60); // CET
  });
});

describe("amsDateString", () => {
  it("produces YYYY-MM-DD in the Amsterdam timezone for today", () => {
    const today = amsDateString(0);
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("shifts by whole days", () => {
    const today = amsDateString(0);
    const tomorrow = amsDateString(1);
    const base = Date.parse(`${today}T00:00:00Z`);
    const next = Date.parse(`${tomorrow}T00:00:00Z`);
    expect(next - base).toBe(24 * 60 * 60 * 1000);
  });
});

describe("intervalsOverlap", () => {
  it("detects overlapping half-open intervals", () => {
    expect(intervalsOverlap({ fromMs: 0, toMs: 100 }, { fromMs: 50, toMs: 150 })).toBe(true);
    expect(intervalsOverlap({ fromMs: 0, toMs: 100 }, { fromMs: 100, toMs: 200 })).toBe(false);
    expect(intervalsOverlap({ fromMs: 0, toMs: 100 }, { fromMs: -10, toMs: 0 })).toBe(false);
  });
});