import { describe, expect, it } from "vitest";
import {
  CANCELLATION_DEADLINE_HOURS,
  CANCELLATION_DEADLINE_MS,
  bookingReference,
  cancellationReference,
  guestCanCancel,
} from "./policy.js";

const HOUR_MS = 60 * 60 * 1000;

describe("cancellation policy", () => {
  const startMs = Date.parse("2026-09-01T08:00:00Z");

  it("allows a guest to cancel more than 24h before start", () => {
    expect(guestCanCancel(startMs, startMs - 25 * HOUR_MS)).toBe(true);
  });

  it("blocks a guest from cancelling within 24h of start", () => {
    expect(guestCanCancel(startMs, startMs - 23 * HOUR_MS)).toBe(false);
  });

  it("treats the exact 24h mark as past the deadline", () => {
    expect(guestCanCancel(startMs, startMs - CANCELLATION_DEADLINE_MS)).toBe(false);
  });

  it("exposes the deadline constant used by the endpoint", () => {
    expect(CANCELLATION_DEADLINE_HOURS).toBe(24);
    expect(CANCELLATION_DEADLINE_MS).toBe(24 * HOUR_MS);
  });
});

describe("references", () => {
  it("zero-pads the booking reference", () => {
    expect(bookingReference(42)).toBe("KN-000042");
  });

  it("embeds the booking id in the cancellation reference", () => {
    expect(cancellationReference(42, 0)).toMatch(/^CN-000042-/);
  });

  it("produces distinct cancellation references over time", () => {
    expect(cancellationReference(42, 1000)).not.toBe(cancellationReference(42, 2000));
  });
});