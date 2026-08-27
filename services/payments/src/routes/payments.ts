import { Hono } from "hono";
import type { Context } from "hono";
import { and, eq } from "drizzle-orm";
import { payments } from "../db/schema.js";
import { db } from "../db/index.js";
import { isStripeConfigured, StripeNotConfiguredError } from "../lib/stripe.js";
import { computeFees } from "../lib/fees.js";

const v1 = new Hono();

function requireStripe(c: Context): Response | null {
  if (!isStripeConfigured()) {
    return c.json({ error: "stripe_not_configured" }, 503);
  }
  return null;
}

interface BookingLike {
  spaceId: number;
  priceCents: number;
}

// POST /api/v1/payments/intents { bookingId }
// Creates a Stripe PaymentIntent for a confirmed booking (Connect transfer to host).
v1.post("/payments/intents", async (c) => {
  const blocked = requireStripe(c);
  if (blocked) return blocked;

  const body = (await c.req.json().catch(() => null)) as { bookingId?: unknown } | null;
  const bookingId = Number(body?.bookingId);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return c.json({ error: "invalid_bookingId" }, 400);
  }

  const bookingsUrl = process.env.SERVICE_BOOKINGS_URL ?? "http://localhost:3003";
  const existing = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.bookingId, bookingId))
    .limit(1);
  if (existing.length) {
    return c.json(
      { error: "payment_already_exists", bookingId, paymentId: existing[0].id },
      409
    );
  }

  let booking: { booking: BookingLike };
  try {
    const res = await fetch(`${bookingsUrl}/api/v1/bookings/${bookingId}`, { cache: "no-store" });
    if (!res.ok) return c.json({ error: "booking_not_found", bookingId }, 404);
    booking = (await res.json()) as { booking: BookingLike };
  } catch {
    return c.json({ error: "bookings_unreachable" }, 502);
  }

  const b = booking.booking;
  const fees = computeFees(b.priceCents);
  const { getStripe } = await import("../lib/stripe.js");
  const stripe = getStripe();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: fees.guestTotalCents,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      application_fee_amount: fees.guestFeeCents + fees.hostFeeCents,
      metadata: { booking_id: String(bookingId), space_id: String(b.spaceId) },
    });

    const [payment] = await db
      .insert(payments)
      .values({
        bookingId,
        stripePaymentIntentId: paymentIntent.id,
        amountCents: fees.guestTotalCents,
        guestFeeCents: fees.guestFeeCents,
        hostFeeCents: fees.hostFeeCents,
        hostPayoutCents: fees.hostPayoutCents,
        status: "requires_payment",
      })
      .returning();

    return c.json(
      {
        payment,
        clientSecret: paymentIntent.client_secret,
        fees,
      },
      201
    );
  } catch {
    return c.json({ error: "stripe_error" }, 500);
  }
});

// GET /api/v1/payments/bookings/:bookingId
v1.get("/payments/bookings/:bookingId", async (c) => {
  const bookingId = Number(c.req.param("bookingId"));
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return c.json({ error: "invalid_bookingId" }, 400);
  }
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.bookingId, bookingId))
    .limit(1);
  return c.json({ payment: payment ?? null });
});

// POST /api/v1/payments/accounts { email, returnUrl, refreshUrl }
// Starts Stripe Connect onboarding for a host (Express accounts).
v1.post("/payments/accounts", async (c) => {
  const blocked = requireStripe(c);
  if (blocked) return blocked;

  const body = (await c.req.json().catch(() => null)) as {
    email?: unknown;
    returnUrl?: unknown;
    refreshUrl?: unknown;
  } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const returnUrl = typeof body?.returnUrl === "string" ? body.returnUrl : "";
  const refreshUrl = typeof body?.refreshUrl === "string" ? body.refreshUrl : "";
  if (!email || !returnUrl || !refreshUrl) {
    return c.json({ error: "missing_params" }, 400);
  }

  const { getStripe } = await import("../lib/stripe.js");
  const stripe = getStripe();

  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "NL",
      email,
      capabilities: { transfers: { requested: true } },
    });
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
    return c.json({ accountId: account.id, onboardingUrl: accountLink.url }, 201);
  } catch {
    return c.json({ error: "stripe_error" }, 500);
  }
});

export default v1;