import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import v1 from "./routes/auth.js";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, service: "identity" }));

app.use("/api/v1/*", cors());

app.route("/api/v1", v1);

const port = Number(process.env.PORT ?? 3004);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[identity] ready on http://localhost:${info.port}`);
});