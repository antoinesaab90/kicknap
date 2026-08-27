import { pgSchema, index, integer, serial, text, timestamp } from "drizzle-orm/pg-core";

const bks = pgSchema("bookings");

export const bookings = bks.table(
  "bookings",
  {
    id: serial("id").primaryKey(),
    spaceId: integer("space_id").notNull(),
    guestEmail: text("guest_email"),
    guestName: text("guest_name"),
    fromTs: timestamp("from_ts", { withTimezone: true }).notNull(),
    toTs: timestamp("to_ts", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").notNull().default("EUR"),
    status: text("status").notNull().default("confirmed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("bookings_space_from_idx").on(table.spaceId, table.fromTs),
    index("bookings_status_idx").on(table.status),
  ]
);