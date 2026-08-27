import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set — add it to .env (see .env.example)");
}

const client = postgres(connectionString, { max: 10, prepare: false });

export const db = drizzle(client, { schema });

export type Space = typeof schema.spaces.$inferSelect;
export type NewSpace = typeof schema.spaces.$inferInsert;