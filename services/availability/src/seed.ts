import "dotenv/config";

import { openingHours } from "./db/schema.js";
import { db } from "./db/index.js";
import { fetchAllSpaces } from "./lib/listings.js";

const WEEKDAYS = [480, 1320]; // 08:00–22:00 for Monday to Friday
const WEEKEND = [600, 1200]; // 10:00–20:00 for Saturday and Sunday

async function seed() {
  const spaces = await fetchAllSpaces();
  if (!spaces.length) {
    throw new Error("No spaces returned by the listings service — is it running on port 3001?");
  }

  console.log(`Seeding opening hours for ${spaces.length} spaces from the listings service...`);

  await db.delete(openingHours);

  const rows = [];
  for (const space of spaces) {
    for (const day of [1, 2, 3, 4, 5]) {
      rows.push({
        spaceId: space.id,
        dayOfWeek: day,
        startMinute: WEEKDAYS[0],
        endMinute: WEEKDAYS[1],
      });
    }
    for (const day of [0, 6]) {
      rows.push({
        spaceId: space.id,
        dayOfWeek: day,
        startMinute: WEEKEND[0],
        endMinute: WEEKEND[1],
      });
    }
  }

  await db.insert(openingHours).values(rows as never);
  console.log(`Inserted ${rows.length} opening-hour rows. Seed complete.`);
}

seed().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);