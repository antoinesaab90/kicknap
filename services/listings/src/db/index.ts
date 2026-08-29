import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set — add it to .env (see .env.example)");
}

const client = postgres(connectionString, { max: 10, prepare: false });

export const db = drizzle(client, { schema });

export async function ensureReviewsTable(): Promise<void> {
  await client.unsafe(`
CREATE TABLE IF NOT EXISTS listings.reviews (
  id serial PRIMARY KEY,
  space_id integer NOT NULL REFERENCES listings.spaces(id),
  guest_email text NOT NULL,
  guest_name text,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_space_guest_idx ON listings.reviews (space_id, guest_email);
CREATE INDEX IF NOT EXISTS reviews_space_idx ON listings.reviews (space_id);
`);
}

export async function ensureCapacityColumns(): Promise<void> {
  await client.unsafe(`
ALTER TABLE listings.spaces ADD COLUMN IF NOT EXISTS max_adults integer NOT NULL DEFAULT 4;
ALTER TABLE listings.spaces ADD COLUMN IF NOT EXISTS max_children integer NOT NULL DEFAULT 2;
ALTER TABLE listings.spaces ADD COLUMN IF NOT EXISTS pets_allowed boolean NOT NULL DEFAULT true;
`);
}

export type Space = typeof schema.spaces.$inferSelect;
export type NewSpace = typeof schema.spaces.$inferInsert;