import { pgSchema, boolean, doublePrecision, index, integer, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const ls = pgSchema("listings");

export const users = ls.table("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const spaces = ls.table(
  "spaces",
  {
    id: serial("id").primaryKey(),
    hostId: integer("host_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    description: text("description"),
    address: text("address"),
    neighborhood: text("neighborhood").notNull(),
    city: text("city").notNull().default("Amsterdam"),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    hourlyPriceCents: integer("hourly_price_cents").notNull(),
    minHours: integer("min_hours").notNull().default(1),
    maxHours: integer("max_hours").notNull().default(12),
    rating: doublePrecision("rating").notNull().default(0),
    timesRated: integer("times_rated").notNull().default(0),
    photoUrl: text("photo_url"),
    isDemo: boolean("is_demo").notNull().default(false),
    published: boolean("published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("listings_spaces_neighborhood_idx").on(table.neighborhood),
    index("listings_spaces_price_idx").on(table.hourlyPriceCents),
    index("listings_spaces_city_idx").on(table.city),
  ]
);

export const reviews = ls.table(
  "reviews",
  {
    id: serial("id").primaryKey(),
    spaceId: integer("space_id")
      .notNull()
      .references(() => spaces.id),
    guestEmail: text("guest_email").notNull(),
    guestName: text("guest_name"),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("reviews_space_guest_idx").on(table.spaceId, table.guestEmail),
    index("reviews_space_idx").on(table.spaceId),
  ]
);