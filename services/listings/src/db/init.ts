import "dotenv/config";

import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:kicknap@localhost:5432/kicknap";

const client = postgres(connectionString, { max: 1 });

const SQL = `
CREATE SCHEMA IF NOT EXISTS listings;

CREATE TABLE IF NOT EXISTS listings.users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings.spaces (
  id serial PRIMARY KEY,
  host_id integer NOT NULL REFERENCES listings.users(id),
  name text NOT NULL,
  description text,
  address text,
  neighborhood text NOT NULL,
  city text NOT NULL DEFAULT 'Amsterdam',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  hourly_price_cents integer NOT NULL,
  min_hours integer NOT NULL DEFAULT 1,
  max_hours integer NOT NULL DEFAULT 12,
  max_adults integer NOT NULL DEFAULT 4,
  max_children integer NOT NULL DEFAULT 2,
  pets_allowed boolean NOT NULL DEFAULT true,
  rating double precision NOT NULL DEFAULT 0,
  times_rated integer NOT NULL DEFAULT 0,
  photo_url text,
  is_demo boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_spaces_neighborhood_idx ON listings.spaces (neighborhood);
CREATE INDEX IF NOT EXISTS listings_spaces_price_idx ON listings.spaces (hourly_price_cents);
CREATE INDEX IF NOT EXISTS listings_spaces_city_idx ON listings.spaces (city);

-- Idempotent migrations for existing databases
ALTER TABLE listings.spaces ADD COLUMN IF NOT EXISTS max_adults integer NOT NULL DEFAULT 4;
ALTER TABLE listings.spaces ADD COLUMN IF NOT EXISTS max_children integer NOT NULL DEFAULT 2;
ALTER TABLE listings.spaces ADD COLUMN IF NOT EXISTS pets_allowed boolean NOT NULL DEFAULT true;

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
`;

await client.unsafe(SQL);
await client.end();

console.log("listings schema + tables ready.");