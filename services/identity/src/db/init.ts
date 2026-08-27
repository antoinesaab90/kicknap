import "dotenv/config";

import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:kicknap@localhost:5432/kicknap";

const client = postgres(connectionString, { max: 1 });

const SQL = `
CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE IF NOT EXISTS identity.users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS identity_users_email_idx
  ON identity.users (email);
`;

await client.unsafe(SQL);
await client.end();

console.log("identity schema + tables ready.");