import { execSync } from "node:child_process";

const dirs = [
  "services/listings",
  "services/availability",
  "services/bookings",
  "services/identity",
  "services/payments",
  "web",
];

const exec = (cmd) => {
  try {
    return execSync(cmd, { stdio: ["inherit", "pipe", "inherit"], encoding: "utf8" });
  } catch (err) {
    if (err && err.stdout) return err.stdout;
    throw err;
  }
};

let failures = 0;

for (const dir of dirs) {
  process.stdout.write(`\n==> deploying ${dir} (production)\n`);
  let out;
  try {
    out = exec(`vercel deploy --prod --cwd ${dir}`);
  } catch (err) {
    process.stdout.write(`${err && err.message ? err.message : String(err)}\n`);
    process.stdout.write(`attempting via npx...\n`);
    try {
      out = exec(`npx --yes vercel deploy --prod --cwd ${dir}`);
    } catch (err2) {
      failures += 1;
      process.stderr.write(`deploy failed for ${dir}\n`);
      continue;
    }
  }
  const alias = (out ?? "")
    .split("\n")
    .find((line) => line.includes("Aliased"))
    ?.trim()
    .replace(/^\[[0-9;]*m/, "");
  if (alias) process.stdout.write(`${alias}\n`);
}

if (failures > 0) {
  process.stderr.write(`\n${failures} deployment(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nProduction deploy complete.\n");