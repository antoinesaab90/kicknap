import { index, integer, pgSchema, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const pmts = pgSchema("payments");

export const payments = pmts.table(
  "payments",
  {
    id: serial("id").primaryKey(),
    bookingId: integer("booking_id").notNull(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    amountCents: integer("amount_cents").notNull(),
    guestFeeCents: integer("guest_fee_cents").notNull().default(0),
    hostFeeCents: integer("host_fee_cents").notNull().default(0),
    hostPayoutCents: integer("host_payout_cents").notNull().default(0),
    currency: text("currency").notNull().default("EUR"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("payments_booking_idx").on(table.bookingId),
    index("payments_status_idx").on(table.status),
  ]
);