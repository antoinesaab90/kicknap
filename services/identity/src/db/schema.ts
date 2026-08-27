import { pgSchema, index, integer, serial, text, timestamp } from "drizzle-orm/pg-core";

const idn = pgSchema("identity");

export const users = idn.table(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("identity_users_email_idx").on(table.email)]
);