import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL to the PRODUCTION Neon URL before running.");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

await sql.unsafe(`
ALTER TABLE listings.spaces ADD COLUMN IF NOT EXISTS max_adults integer NOT NULL DEFAULT 4;
ALTER TABLE listings.spaces ADD COLUMN IF NOT EXISTS max_children integer NOT NULL DEFAULT 2;
ALTER TABLE listings.spaces ADD COLUMN IF NOT EXISTS pets_allowed boolean NOT NULL DEFAULT true;
`);

const spaces = (await sql`
  SELECT id, name FROM listings.spaces WHERE published = true ORDER BY id
`) as { id: number; name: string }[];

console.log("Spaces in scope (published):", spaces.length);

const profiles: Array<[number, number, boolean]> = [
  [4, 2, true],   // default — couples + kids + pets
  [2, 0, false],  // intimate couple, no kids/pets
  [1, 0, true],   // solo focus space, pets ok
  [6, 4, true],   // big crew
  [3, 1, false],  // small group, no pets
  [5, 3, true],   // family plus
  [4, 0, true],   // adults only, pets ok
  [2, 2, true],   // small family
];

let i = 0;
for (const s of spaces) {
  const [adults, children, pets] = profiles[i % profiles.length];
  i += 1;
  await sql`
    UPDATE listings.spaces
    SET max_adults = ${adults}, max_children = ${children}, pets_allowed = ${pets}
    WHERE id = ${s.id}
  `;
  console.log(`  #${s.id} ${s.name} -> adults ${adults}, children ${children}, pets ${pets}`);
}

const check = (await sql`
  SELECT id, name, max_adults, max_children, pets_allowed
  FROM listings.spaces WHERE published = true ORDER BY id
`) as unknown as Array<Record<string, unknown>>;
console.table(check);
await sql.end();