import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import spacesRouter from "./routes/spaces.js";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, service: "listings" }));

app.use("/api/v1/*", cors());

app.route("/api/v1", spacesRouter);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[listings] ready on http://localhost:${info.port}`);
});