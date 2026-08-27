import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import v1 from "./routes/bookings.js";

export const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, service: "bookings" }));

app.use("/api/v1/*", cors());

app.route("/api/v1", v1);

export default app;