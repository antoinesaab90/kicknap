import "dotenv/config";

import { sql } from "drizzle-orm";
import { spaces, users } from "./db/schema.js";
import { db } from "./db/index.js";

const DEMO_HOST = {
  email: "host+demo@kicknap.com",
  name: "Demo Host",
};

const demoSpaces = [
  {
    name: "Studio near Centraal",
    description: "A quiet studio for napping between trains. Blackout curtains, rain shower, 10 minutes from the platforms.",
    address: "Demo — Prins Hendrikkade 90",
    neighborhood: "centrum",
    city: "Amsterdam",
    lat: 52.3791,
    lng: 4.9003,
    hourlyPriceCents: 1200,
    minHours: 1,
    maxHours: 8,
    rating: 4.6,
    timesRated: 12,
    photoUrl: "https://picsum.photos/seed/kicknap01/800/600",
  },
  {
    name: "Lounge by Artis",
    description: "Soft sofas, warm light and a coffee corner. Great meeting point before an evening out.",
    address: "Demo — Plantage Kerklaan 30",
    neighborhood: "centrum",
    city: "Amsterdam",
    lat: 52.363,
    lng: 4.913,
    hourlyPriceCents: 900,
    minHours: 2,
    maxHours: 6,
    rating: 4.4,
    timesRated: 21,
    photoUrl: "https://picsum.photos/seed/kicknap02/800/600",
  },
  {
    name: "Quiet room in Jordaan",
    description: "A calm bedroom in a classic canal house. Earplugs and a proper bed — nothing more.",
    address: "Demo — Rozengracht 46",
    neighborhood: "centrum",
    city: "Amsterdam",
    lat: 52.3702,
    lng: 4.8814,
    hourlyPriceCents: 1000,
    minHours: 1,
    maxHours: 10,
    rating: 4.8,
    timesRated: 33,
    photoUrl: "https://picsum.photos/seed/kicknap03/800/600",
  },
  {
    name: "Power nap pod near Zuidas",
    description: "A dark, silent pod for recharging between meetings. Check in and out via the app.",
    address: "Demo — Gustav Mahlerplein 2",
    neighborhood: "zuid",
    city: "Amsterdam",
    lat: 52.3376,
    lng: 4.873,
    hourlyPriceCents: 1400,
    minHours: 1,
    maxHours: 4,
    rating: 4.2,
    timesRated: 9,
    photoUrl: "https://picsum.photos/seed/kicknap04/800/600",
  },
  {
    name: "Designer desk, P.C. Hooftstraat",
    description: "A standing desk with fast wifi and city views. Coffee and phone booth included.",
    address: "Demo — P.C. Hooftstraat 120",
    neighborhood: "zuid",
    city: "Amsterdam",
    lat: 52.3575,
    lng: 4.887,
    hourlyPriceCents: 1600,
    minHours: 1,
    maxHours: 6,
    rating: 4.7,
    timesRated: 17,
    photoUrl: "https://picsum.photos/seed/kicknap05/800/600",
  },
  {
    name: "Hidden garden studio, Oost",
    description: "White walls, a small garden and total silence. Perfect for a reset, not for calls.",
    address: "Demo — Dapperstraat 8",
    neighborhood: "oost",
    city: "Amsterdam",
    lat: 52.3655,
    lng: 4.918,
    hourlyPriceCents: 1100,
    minHours: 1,
    maxHours: 12,
    rating: 4.9,
    timesRated: 41,
    photoUrl: "https://picsum.photos/seed/kicknap06/800/600",
  },
  {
    name: "Tram-end tranquility, West",
    description: "Tucked away off the Vondelpark, a guest room with a real bed and a city bike.",
    address: "Demo — Overtoom 200",
    neighborhood: "west",
    city: "Amsterdam",
    lat: 52.3575,
    lng: 4.859,
    hourlyPriceCents: 850,
    minHours: 1,
    maxHours: 10,
    rating: 4.5,
    timesRated: 26,
    photoUrl: "https://picsum.photos/seed/kicknap07/800/600",
  },
  {
    name: "Nordic apartment, Noord",
    description: "A light loft across the river with a view of the skyline. Quietest sleep in Amsterdam.",
    address: "Demo — Buikslotermeerplein 12",
    neighborhood: "noord",
    city: "Amsterdam",
    lat: 52.3801,
    lng: 4.9029,
    hourlyPriceCents: 950,
    minHours: 2,
    maxHours: 12,
    rating: 4.3,
    timesRated: 14,
    photoUrl: "https://picsum.photos/seed/kicknap08/800/600",
  },
  {
    name: "Atelier hideaway, Oost",
    description: "A former workshop with high ceilings and narrow beds. Raw, dark, and real.",
    address: "Demo — Zeeburgerdijk 82",
    neighborhood: "oost",
    city: "Amsterdam",
    lat: 52.3646,
    lng: 4.928,
    hourlyPriceCents: 780,
    minHours: 1,
    maxHours: 8,
    rating: 4.1,
    timesRated: 7,
    photoUrl: "https://picsum.photos/seed/kicknap09/800/600",
  },
  {
    name: "Boarding-lounge rest, Schiphol area",
    description: "Ten minutes from the airport. A reclining lounge, a hot shower, and a wake-up call.",
    address: "Demo — Schipholweg 185",
    neighborhood: "schiphol",
    city: "Schiphol",
    lat: 52.336,
    lng: 4.787,
    hourlyPriceCents: 1800,
    minHours: 3,
    maxHours: 12,
    rating: 4.5,
    timesRated: 63,
    photoUrl: "https://picsum.photos/seed/kicknap10/800/600",
  },
  {
    name: "Compact cabin, Schiphol ring",
    description: "A soundproof capsule with a single bed and controlled light. Sleep is the feature.",
    address: "Demo — Schiphol Boulevard 17",
    neighborhood: "schiphol",
    city: "Schiphol",
    lat: 52.3086,
    lng: 4.7639,
    hourlyPriceCents: 1500,
    minHours: 1,
    maxHours: 12,
    rating: 4.0,
    timesRated: 11,
    photoUrl: "https://picsum.photos/seed/kicknap11/800/600",
  },
  {
    name: "Canal-house penthouse, Centrum",
    description: "A bright studio at the top of a canal house with a view over the rooftops.",
    address: "Demo — Herengracht 302",
    neighborhood: "centrum",
    city: "Amsterdam",
    lat: 52.373,
    lng: 4.8926,
    hourlyPriceCents: 2000,
    minHours: 2,
    maxHours: 6,
    rating: 4.8,
    timesRated: 22,
    photoUrl: "https://picsum.photos/seed/kicknap12/800/600",
  },
];

async function seed() {
  console.log("Removing previous demo data...");
  await db.delete(spaces).where(sql`${spaces.isDemo} = true`);
  await db.delete(users).where(sql`${users.email} = ${DEMO_HOST.email}`);

  console.log("Creating demo host...");
  const [host] = await db
    .insert(users)
    .values(DEMO_HOST)
    .returning({ id: users.id });

  console.log(`Inserting ${demoSpaces.length} demo spaces...`);
  await db.insert(spaces).values(
    demoSpaces.map((space) => ({
      ...space,
      hostId: host.id,
      isDemo: true,
      published: true,
    }))
  );

  console.log("Seed complete.");
}

seed().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);