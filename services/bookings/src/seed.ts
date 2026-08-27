import "dotenv/config";

import { and, eq, gt, lt } from "drizzle-orm";
import { bookings } from "./db/schema.js";
import { db } from "./db/index.js";
import { fetchAllSpaces } from "./lib/listings.js";
import { checkAvailability } from "./lib/availability.js";
import { amsDateString } from "./lib/time.js";
import { computePriceCents } from "./lib/price.js";

async function overlapExists(
  spaceId: number,
  fromMs: number,
  toMs: number
): Promise<boolean> {
  const rows = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.spaceId, spaceId),
        eq(bookings.status, "confirmed"),
        lt(bookings.fromTs, new Date(toMs)),
        gt(bookings.toTs, new Date(fromMs))
      )
    )
    .limit(1);
  return rows.length > 0;
}

async function seed() {
  const spaces = await fetchAllSpaces();
  const space = spaces[0];
  if (!space) {
    throw new Error("listings service returned no spaces — is it running on port 3001?");
  }
  const spaceId = space.id;

  // Book tomorrow 08:00–10:00Z (10:00–12:00 Amsterdam in summer) — only if genuinely open.
  const date = amsDateString(1);
  const from = `${date}T08:00:00Z`;
  const to = `${date}T10:00:00Z`;

  const check = await checkAvailability(spaceId, from, to);
  if (!check.available) {
    console.log(`Demo booking skipped — slot ${from}→${to} is not open (${check.reason}).`);
    return;
  }

  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);

  if (await overlapExists(spaceId, fromMs, toMs)) {
    console.log("Demo booking skipped — slot already booked.");
    return;
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      spaceId,
      guestEmail: "guest+demo@kicknap.com",
      guestName: "Demo Guest",
      fromTs: new Date(fromMs),
      toTs: new Date(toMs),
      durationMinutes: (toMs - fromMs) / 60000,
      priceCents: computePriceCents(fromMs, toMs, space.hourlyPriceCents),
    })
    .returning();

  console.log(
    `Demo booking created: space ${spaceId}, ${from} → ${to}, €${(booking.priceCents / 100).toFixed(2)}.`
  );
}

seed().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);