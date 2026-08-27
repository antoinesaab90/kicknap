import "dotenv/config";

import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:kicknap@localhost:5432/kicknap";

const client = postgres(connectionString, { max: 1 });

const SQL = `
CREATE SCHEMA IF NOT EXISTS bookings;

CREATE TABLE IF NOT EXISTS bookings.bookings (
  id serial PRIMARY KEY,
  space_id integer NOT NULL,
  guest_email text,
  guest_name text,
  from_ts timestamptz NOT NULL,
  to_ts timestamptz NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes >= 30),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (to_ts > from_ts)
);

CREATE INDEX IF NOT EXISTS bookings_space_from_idx
  ON bookings.bookings (space_id, from_ts);
CREATE INDEX IF NOT EXISTS bookings_status_idx
  ON bookings.bookings (status);
`;

await client.unsafe(SQL);
await client.end();

console.log("bookings schema + tables ready.");