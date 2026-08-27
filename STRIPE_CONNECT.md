# kicknap — Stripe Connect Integration
> How money flows through the platform.

---

## Overview

kicknap uses **Stripe Connect** to handle all payments. We never hold guest money directly — Stripe acts as the escrow and payment processor.

**Account type:** Connect with Express accounts (hosts create Stripe Express accounts)

---

## Money Flow

### Guest Books a Space (3-hour session)

```
Guest pays €45.00
    │
    ▼
┌─────────────────────────────────┐
│  Stripe (escrow)                │
│                                 │
│  €45.00 total                   │
│  ├── €40.00 → Host (after 3% fee)│
│  ├── €4.50  → kicknap (guest fee)│
│  └── €0.50  → kicknap (host fee) │
│                                 │
│  Security deposit: €75 pre-auth  │
│  (released after 7 days)        │
└─────────────────────────────────┘
    │
    ▼ (end of business day after check-in)
Host receives €40.00 to their bank account
```

### Fee Breakdown Example

| Item | Amount | Who pays |
|------|--------|----------|
| Listing price (3h × €13.33/h) | €40.00 | — |
| Guest service fee (10%) | €4.50 | Guest |
| Host service fee (3%) | €1.20 | Host (deducted from payout) |
| **Guest total** | **€44.50** | Guest |
| **Host payout** | **€38.80** | Host receives |
| **kicknap revenue** | **€5.70** | Guest fee + Host fee |

---

## Host Onboarding (Stripe Connect)

### Step 1: Host signs up on kicknap
- Creates account (email, phone, name)
- Profile created in `users` table

### Step 2: Host creates first listing
- Can create listing without Stripe (stays in "draft" status)

### Step 3: Host connects Stripe
- Host clicks "Start earning" or "Set up payouts"
- kicknap creates a Stripe Connect account for the host
- Host is redirected to Stripe Express onboarding
- Stripe collects: bank account, tax info (name, address, KvK for Dutch hosts)
- Host returns to kicknap
- `stripe_connect_account_id` saved to `users` table

### Step 4: Listing goes live
- Once Stripe onboarding is complete, listing can be set to "active"
- Bookings can now be accepted

### API Calls
```javascript
// Create Connect account
const account = await stripe.accounts.create({
  type: 'express',
  country: 'NL',
  email: user.email,
  capabilities: {
    transfers: { requested: true },
  },
  metadata: {
    user_id: user.id,
  },
});

// Create onboarding link
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: 'https://kicknap.com/host/dashboard',
  return_url: 'https://kicknap.com/host/onboarding/complete',
  type: 'account_onboarding',
});
```

---

## Guest Booking Flow

### Step 1: Guest selects time slot
- Guest picks listing, date, start time, end time
- Frontend calls `POST /listings/:id/check-availability`
- API checks availability in `listing_availability` table
- API returns price breakdown

### Step 2: Guest confirms booking
- Guest clicks "Book now"
- Frontend calls `POST /bookings`

### Step 3: API creates booking + payment
```javascript
// 1. Create booking record
const booking = await db.bookings.create({
  guest_id: guest.id,
  host_id: listing.host_id,
  listing_id: listing.id,
  start_time: startTime,
  end_time: endTime,
  duration_hours: hours,
  price_per_hour: listing.price_per_hour,
  subtotal: subtotal,
  guest_fee: guestFee,
  host_fee: hostFee,
  total_price: totalPrice,
  host_payout: hostPayout,
  security_deposit: depositAmount,
  status: 'pending',
});

// 2. Create Stripe PaymentIntent
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(totalPrice * 100), // cents
  currency: 'eur',
  customer: guest.stripe_customer_id,
  transfer_data: {
    destination: host.stripe_connect_account_id,
  },
  application_fee_amount: Math.round((guestFee + hostFee) * 100),
  metadata: {
    booking_id: booking.id,
    guest_id: guest.id,
    host_id: host.id,
  },
});

// 3. Create payment record
await db.payments.create({
  booking_id: booking.id,
  stripe_payment_intent_id: paymentIntent.id,
  amount: totalPrice,
  host_payout_amount: hostPayout,
  kicknap_fee: guestFee + hostFee,
  status: 'pending',
});

// 4. Create security deposit pre-authorization
const deposit = await stripe.paymentIntents.create({
  amount: Math.round(depositAmount * 100),
  currency: 'eur',
  customer: guest.stripe_customer_id,
  capture_method: 'manual', // pre-auth only, not charged yet
  metadata: {
    booking_id: booking.id,
    type: 'security_deposit',
  },
});
```

### Step 4: Guest completes payment
- Guest enters card details on Stripe Elements (iframe)
- Stripe processes payment
- PaymentIntent status changes to `succeeded`
- Booking status changes to `confirmed`
- Host receives notification

### Step 5: Check-in
- Guest arrives, checks in via app
- `POST /bookings/:id/check-in`
- Booking status: `checked_in`

### Step 6: Check-out
- Guest checks out
- `POST /bookings/:id/check-out`
- Booking status: `completed`

### Step 7: Payout
- End of business day after check-in, Stripe transfers funds to host's bank account
- Host receives `host_payout` amount
- Payment record updated: status = `paid_out`

### Step 8: Security deposit release
- 7 days after check-out, if no damage report filed:
  - Deposit pre-authorization is released
  - `deposit_status` = `released`
- If damage report filed:
  - Deposit capture is initiated
  - Amount goes to host (via Resolution Center)

---

## Cancellation Flow

### Guest cancels (before check-in)
| Timing | Refund |
|--------|--------|
| >24h before start | Full refund (100%) |
| 12-24h before start | 50% refund |
| <12h before start | No refund |
| No-show | No refund |

### Host cancels
- Host always gets 0% (penalized)
- Guest always gets 100% refund
- kicknap fee is refunded to guest

### API Flow
```javascript
// Cancel booking
await stripe.paymentIntents.cancel(paymentIntent.id);
// or
await stripe.refunds.create({
  payment_intent: paymentIntent.id,
  amount: refundAmount, // partial if needed
});
```

---

## Refund Flow

### Guest requests refund
1. Guest contacts support or uses Resolution Center
2. kicknap reviews (within 72h)
3. If approved: `POST /payments/:bookingId/refund`
4. API calls `stripe.refunds.create()`
5. Guest receives refund in 5-10 business days

### Host requests refund (damage claim)
1. Host files damage report
2. Guest has 72h to respond
3. kicknap reviews evidence
4. If resolved in host's favor:
   - Security deposit is captured
   - Amount transferred to host
   - Guest charged remaining balance if deposit insufficient

---

## Webhooks (Critical)

Stripe sends webhooks to confirm events. **Never trust client-side status alone.**

| Webhook Event | What Happens |
|---------------|-------------|
| `payment_intent.succeeded` | Mark payment as captured, confirm booking |
| `payment_intent.payment_failed` | Mark booking as failed, notify guest |
| `charge.dispute.created` | Notify admin, pause host payout |
| `charge.refunded` | Update payment record, notify both parties |
| `account.updated` | Check host onboarding status |
| `payout.paid` | Update host payout record |
| `payout.failed` | Notify host, retry payout |

### Webhook Handler
```javascript
// Express.js webhook endpoint
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'payment_intent.succeeded':
      handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      handlePaymentFailure(event.data.object);
      break;
    // ... other events
  }

  res.json({ received: true });
});
```

---

## Security Rules

1. **Never store card details** — Stripe Elements handles all card data (PCI compliance)
2. **Never trust client-side payment status** — always verify via webhooks
3. **Use idempotency keys** — prevent duplicate charges
4. **Verify webhook signatures** — prevent spoofed webhooks
5. **Use test mode first** — Stripe test cards for development
6. **Environment variables** — never hardcode Stripe keys
7. **All amounts in cents** — Stripe uses smallest currency unit

---

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```

---

## Test Cards

| Card | Behavior |
|------|----------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 9995` | Insufficient funds |

---

*Last updated: August 2026*
