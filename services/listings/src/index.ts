import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { ensureReviewsTable } from "./db/index.js";

const port = Number(process.env.PORT ?? 3001);

await ensureReviewsTable();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[listings] ready on http://localhost:${info.port}`);
});