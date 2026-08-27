import "dotenv/config";

import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:kicknap@localhost:5432/kicknap";

const client = postgres(connectionString, { max: 1 });

const SQL = `
CREATE SCHEMA IF NOT EXISTS availability;

CREATE TABLE IF NOT EXISTS availability.opening_hours (
  id serial PRIMARY KEY,
  space_id integer NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_minute integer NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute integer NOT NULL CHECK (end_minute BETWEEN 1 AND 1440)
);

CREATE INDEX IF NOT EXISTS availability_opening_hours_space_idx
  ON availability.opening_hours (space_id);
CREATE UNIQUE INDEX IF NOT EXISTS availability_opening_hours_day_idx
  ON availability.opening_hours (space_id, day_of_week);
`;

await client.unsafe(SQL);
await client.end();

console.log("availability schema + tables ready.");