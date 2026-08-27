import "dotenv/config";

import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:kicknap@localhost:5432/kicknap";

const client = postgres(connectionString, { max: 1 });

const SQL = `
CREATE SCHEMA IF NOT EXISTS payments;

CREATE TABLE IF NOT EXISTS payments.payments (
  id serial PRIMARY KEY,
  booking_id integer NOT NULL UNIQUE,
  stripe_payment_intent_id text UNIQUE,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  guest_fee_cents integer NOT NULL DEFAULT 0,
  host_fee_cents integer NOT NULL DEFAULT 0,
  host_payout_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'requires_payment', 'succeeded', 'failed', 'refunded', 'paid_out')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_status_idx
  ON payments.payments (status);
`;

await client.unsafe(SQL);
await client.end();

console.log("payments schema + tables ready.");