import "dotenv/config";

import { users } from "./db/schema.js";
import { db } from "./db/index.js";
import { hashPassword } from "./lib/password.js";

const DEMO_USERS = [
  {
    email: "host+demo@kicknap.com",
    name: "Demo Host",
    password: "demo12345",
  },
  {
    email: "guest+demo@kicknap.com",
    name: "Demo Guest",
    password: "demo12345",
  },
];

async function seed() {
  for (const demo of DEMO_USERS) {
    const { salt, hash } = hashPassword(demo.password);
    const rows = await db
      .insert(users)
      .values({
        email: demo.email,
        name: demo.name,
        passwordHash: hash,
        passwordSalt: salt,
      })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id });

    if (rows.length) {
      console.log(`Created demo account: ${demo.email} (password: ${demo.password})`);
    } else {
      console.log(`Skipped existing demo account: ${demo.email}`);
    }
  }
  console.log("Seed complete.");
}

seed().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);