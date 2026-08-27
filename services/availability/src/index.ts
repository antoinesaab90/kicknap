import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import v1 from "./routes/availability.js";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, service: "availability" }));

app.use("/api/v1/*", cors());

app.route("/api/v1", v1);

const port = Number(process.env.PORT ?? 3002);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[availability] ready on http://localhost:${info.port}`);
});