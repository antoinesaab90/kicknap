import { db } from "./index.js";

let ensured: Promise<void> | null = null;

const SQL = `
CREATE TABLE IF NOT EXISTS payments.host_accounts (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  account_id text NOT NULL,
  details_submitted boolean NOT NULL DEFAULT false,
  charges_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;

// Idempotent bootstrap: self-heals missing schema on first use per warm instance.
export function ensureHostAccounts(): Promise<void> {
  if (!ensured) {
    ensured = db.execute(SQL).then(() => undefined).catch(() => undefined);
  }
  return ensured;
}