import { Hono } from "hono";
import type { Context } from "hono";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
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

async function fetchBooking(bookingId: number): Promise<{ booking: BookingLike } | null> {
  const bookingsUrl = process.env.SERVICE_BOOKINGS_URL ?? "http://localhost:3003";
  try {
    const res = await fetch(`${bookingsUrl}/api/v1/bookings/${bookingId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as { booking: BookingLike };
  } catch {
    return null;
  }
}

// POST /api/v1/payments/checkout { bookingId, hostAccountId?, successUrl, cancelUrl }
// Creates a Stripe Checkout Session (hosted page) for a confirmed booking.
v1.post("/payments/checkout", async (c) => {
  const blocked = requireStripe(c);
  if (blocked) return blocked;

  const body = (await c.req.json().catch(() => null)) as {
    bookingId?: unknown;
    hostAccountId?: unknown;
    successUrl?: unknown;
    cancelUrl?: unknown;
  } | null;
  const bookingId = Number(body?.bookingId);
  const successUrl = typeof body?.successUrl === "string" ? body.successUrl : "";
  const cancelUrl = typeof body?.cancelUrl === "string" ? body.cancelUrl : "";
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return c.json({ error: "invalid_bookingId" }, 400);
  }
  if (!successUrl || !cancelUrl) {
    return c.json({ error: "missing_urls" }, 400);
  }

  const booking = await fetchBooking(bookingId);
  if (!booking) return c.json({ error: "booking_not_found", bookingId }, 404);

  const b = booking.booking;
  const fees = computeFees(b.priceCents);
  const { getStripe } = await import("../lib/stripe.js");
  const stripe = getStripe();

  const hostAccountId =
    typeof body?.hostAccountId === "string" && body.hostAccountId.trim()
      ? body.hostAccountId.trim()
      : "";

  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData = {
    description: `kicknap booking #${bookingId}`,
    metadata: { booking_id: String(bookingId), space_id: String(b.spaceId) },
  };
  if (hostAccountId) {
    paymentIntentData.transfer_data = { destination: hostAccountId };
    paymentIntentData.application_fee_amount = fees.guestFeeCents + fees.hostFeeCents;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "eur",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: fees.guestTotalCents,
            product_data: { name: `kicknap booking #${bookingId}` },
          },
        },
      ],
      payment_intent_data: paymentIntentData,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return c.json({ checkoutSessionId: session.id, url: session.url }, 201);
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

// POST /api/v1/payments/webhook  (Stripe event delivery)
// Records the payment row once Stripe confirms/cancels a payment.
v1.post("/payments/webhook", async (c) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !isStripeConfigured()) {
    return c.json({ error: "stripe_webhook_not_configured" }, 503);
  }
  const signature = c.req.header("stripe-signature");
  if (!signature) return c.json({ error: "missing_signature" }, 400);

  const body = await c.req.text();
  const { getStripe } = await import("../lib/stripe.js");
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return c.json({ error: "invalid_signature" }, 400);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const bookingId = Number(pi.metadata?.booking_id);
      if (Number.isInteger(bookingId) && bookingId > 0) {
        const booking = await fetchBooking(bookingId);
        const fees = booking ? computeFees(booking.booking.priceCents) : null;
        const existing = await db
          .select({ id: payments.id })
          .from(payments)
          .where(eq(payments.bookingId, bookingId))
          .limit(1);
        if (existing.length) {
          await db
            .update(payments)
            .set({ status: "succeeded", updatedAt: new Date() })
            .where(eq(payments.id, existing[0].id));
        } else if (fees) {
          await db.insert(payments).values({
            bookingId,
            stripePaymentIntentId: pi.id,
            amountCents: fees.guestTotalCents,
            guestFeeCents: fees.guestFeeCents,
            hostFeeCents: fees.hostFeeCents,
            hostPayoutCents: fees.hostPayoutCents,
            status: "succeeded",
          });
        }
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await db
        .update(payments)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(payments.stripePaymentIntentId, pi.id));
      break;
    }
  }

  return c.json({ received: true });
});

export default v1;