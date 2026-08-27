import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = Number(process.env.PORT ?? 3003);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[bookings] ready on http://localhost:${info.port}`);
});