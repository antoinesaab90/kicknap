import { Hono } from "hono";
import type { Context } from "hono";
import { eq, inArray } from "drizzle-orm";
import type Stripe from "stripe";
import { payments, hostAccounts } from "../db/schema.js";
import { db } from "../db/index.js";
import { ensureHostAccounts } from "../db/bootstrap.js";
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

// Creates a connected account via the Accounts v2 API ("connected accounts" for
// a marketplace where the platform is the merchant of record and hosts receive
// transfers). Expressed accounts get the Stripe-hosted Express onboarding flow.
const STRIPE_V2_ACCOUNTS_URL = "https://api.stripe.com/v2/core/accounts";

async function createConnectAccount(
  stripe: Stripe,
  email: string
): Promise<{ id: string; details_submitted?: boolean | null }> {
  const secret = process.env.STRIPE_SECRET_KEY;
  const res = await fetch(STRIPE_V2_ACCOUNTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      "Stripe-Version": "2026-08-26.dahlia",
    },
    body: JSON.stringify({
      contact_email: email.replace(/\+[^@]*@/, "@"),
      display_name: email.split("@")[0].replace(/[._+-]+/g, " ").trim() || "Host",
      identity: { country: "nl", entity_type: "individual" },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: { stripe_transfers: { requested: true } },
          },
        },
      },
      defaults: {
        currency: "eur",
        responsibilities: { fees_collector: "application", losses_collector: "application" },
        locales: ["nl-NL"],
      },
      dashboard: "express",
      include: ["configuration.recipient", "identity", "defaults"],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`stripe v2 account create failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { id: string };
  return { id: data.id };
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

  const [existingPayment] = await db
    .select({ id: payments.id, status: payments.status })
    .from(payments)
    .where(eq(payments.bookingId, bookingId))
    .limit(1);
  if (existingPayment && existingPayment.status === "succeeded") {
    return c.json({ error: "already_paid", bookingId }, 409);
  }

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

// POST /api/v1/payments/refund { bookingId }
// Refunds a succeeded payment for a booking (called when a booking is cancelled).
// Marks the payment row "refunded" once Stripe confirms the refund.
v1.post("/payments/refund", async (c) => {
  const body = (await c.req.json().catch(() => null)) as { bookingId?: unknown } | null;
  const bookingId = Number(body?.bookingId);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return c.json({ error: "invalid_bookingId" }, 400);
  }

  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.bookingId, bookingId))
    .limit(1);
  if (!row) return c.json({ payment: null, refunded: false, reason: "no_payment" });
  if (row.status !== "succeeded") {
    return c.json({ payment: row, refunded: false, reason: "not_succeeded" });
  }
  if (!row.stripePaymentIntentId) {
    return c.json({ payment: row, refunded: false, reason: "no_payment_intent" });
  }

  const blocked = requireStripe(c);
  if (blocked) return blocked;

  try {
    const { getStripe } = await import("../lib/stripe.js");
    const refund = await getStripe().refunds.create({
      payment_intent: row.stripePaymentIntentId,
    });
    await db
      .update(payments)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(payments.id, row.id));
    return c.json({
      payment: { ...row, status: "refunded" },
      refunded: true,
      refundId: refund.id,
    });
  } catch {
    return c.json({ error: "stripe_error" }, 500);
  }
});

// GET /api/v1/payments/by-bookings?ids=1,2,3  (server-to-server: payment rows for a set of bookings)
v1.get("/payments/by-bookings", async (c) => {
  const ids = String(c.req.query("ids") ?? "")
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
  if (!ids.length) return c.json({ payments: [] });
  const rows = await db
    .select()
    .from(payments)
    .where(inArray(payments.bookingId, ids));
  return c.json({ payments: rows });
});

// GET /api/v1/payments/accounts/:email — onboarded status of a host's Connect account
v1.get("/payments/accounts/:email", async (c) => {
  const blocked = requireStripe(c);
  if (blocked) return blocked;

  const email = decodeURIComponent(c.req.param("email")).trim().toLowerCase();
  if (!email) return c.json({ error: "invalid_email" }, 400);

  const { getStripe } = await import("../lib/stripe.js");
  const stripe = getStripe();
  await ensureHostAccounts();

  let row: typeof hostAccounts.$inferSelect | undefined;
  try {
    [row] = await db.select().from(hostAccounts).where(eq(hostAccounts.email, email)).limit(1);
  } catch {
    return c.json({ account: null });
  }
  if (!row) return c.json({ account: null });

  try {
    const account = await stripe.accounts.retrieve(row.accountId);
    const raw = account as unknown as {
      stripe_balance?: { payouts?: { status?: string } };
    };
    const payoutsState = raw.stripe_balance?.payouts ?? null;
    const detailsSubmitted = account.details_submitted === true || payoutsState?.status === "active";
    const payoutsEnabled = account.payouts_enabled === true || payoutsState?.status === "active";
    const chargesEnabled = account.charges_enabled === true;
    if (row.detailsSubmitted !== detailsSubmitted ||
      row.chargesEnabled !== chargesEnabled ||
      row.payoutsEnabled !== payoutsEnabled) {
      try {
        await db
          .update(hostAccounts)
          .set({ detailsSubmitted, chargesEnabled, payoutsEnabled, updatedAt: new Date() })
          .where(eq(hostAccounts.id, row.id));
      } catch {
        // ignore persistence errors; status is still returned from Stripe
      }
    }
    return c.json({
      account: {
        accountId: row.accountId,
        detailsSubmitted,
        chargesEnabled,
        payoutsEnabled,
        onboardingComplete: detailsSubmitted && payoutsEnabled,
      },
    });
  } catch {
    return c.json({ error: "stripe_error" }, 500);
  }
});

// POST /api/v1/payments/accounts { email, returnUrl, refreshUrl }
// Starts Stripe Connect onboarding for a host (Express accounts).
// Creates the account once, reusing the stored accountId for repeat sessions.
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
  await ensureHostAccounts();

  try {
    const normalizedEmail = email.trim().toLowerCase();
    let existing: (typeof hostAccounts.$inferSelect) | undefined;
    try {
      [existing] = await db
        .select()
        .from(hostAccounts)
        .where(eq(hostAccounts.email, normalizedEmail))
        .limit(1);
    } catch {
      existing = undefined;
    }
    const account =
      existing && existing.accountId
        ? await stripe.accounts.retrieve(existing.accountId)
        : await createConnectAccount(stripe, normalizedEmail);

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    try {
      if (!existing) {
        await db.insert(hostAccounts).values({
          email: normalizedEmail,
          accountId: account.id,
        });
      } else {
        await db
          .update(hostAccounts)
          .set({ email: normalizedEmail, accountId: account.id, updatedAt: new Date() })
          .where(eq(hostAccounts.id, existing.id));
      }
    } catch {
      // persistence best-effort; onboarding continues regardless
    }

    return c.json(
      { accountId: account.id, onboardingUrl: accountLink.url, onboarded: account.details_submitted === true },
      201
    );
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
          await db
            .insert(payments)
            .values({
              bookingId,
              stripePaymentIntentId: pi.id,
              amountCents: fees.guestTotalCents,
              guestFeeCents: fees.guestFeeCents,
              hostFeeCents: fees.hostFeeCents,
              hostPayoutCents: fees.hostPayoutCents,
              status: "succeeded",
            })
            .onConflictDoNothing({ target: payments.bookingId });
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