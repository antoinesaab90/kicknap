# kicknap — working notes for the agent

## Commands (run from repo root unless noted)
- `npm run test` — all unit tests, five suites, one command: web (33), services/availability (22), services/bookings (16), services/payments (3), apps/mobile (46) = 120.
- `npm run check` — architecture lint (depcruise) + web eslint + Next build (all pages green; currently 32 routes incl. API).
- `npm run smoke:prod` — 19 health checks across all five deployed services + web (targets `*-xi.vercel.app` aliases + `www.kicknap.com`).
- `npm run deploy:prod` — deploys services then web (each via `vercel.cmd --prod`).
- Per-service deploy (after touching a service): `& "$env:APPDATA\npm\vercel.cmd" -A vercel.json --prod --yes` from that service dir, then `npm run smoke:prod`.

## Architecture & layout
- Monorepo (npm workspaces: `web` + `services/*`); `apps/mobile` is a **standalone** npm project (own `node_modules`, own lockfile, SDK 54 for Expo Go — do NOT add it to root workspaces; it pins react 19.1.0 while web pins 19.2.8).
- DOT-NOT: no new services; keep modular-monolith split (listings / availability / bookings / identity / payments) with the web front-end proxying all of them.
- Windows quirks: native `.cmd` binaries; prefix `$env:ProgramFiles\nodejs;$env:APPDATA\npm` to `$env:Path`; no `&&` chains in PowerShell (use `cmd1; if ($?) { cmd2 }`); einline `-d` JSON mangles in PowerShell — write body to a file and use `--data-binary "@file"`; rolldown win32 binding lives in `optionalDependencies` of `web` (Vercel/Linux `npm install` fails otherwise).

## Gotchas that cost time (do not regress)
- Availability `windowCovered` (services/availability/src/lib/time.ts) must segment by true Amsterdam calendar days (DST-safe midnight probe). The old fixed-24h stepping produced wrong multi-day availability — there are unit tests pinning this now.
- Mobile tests only work when vitest is resolved from `apps/mobile`'s own `node_modules` (run via the local `test` script, never bare `vitest run` from root).
- `apps/mobile/.env` is gitignored (live URLs only, no secrets) — recreate from `.env.example` if missing.
- Booking emails are silent until `EMAIL_SMTP_*` + `EMAIL_FROM` are set. Stripe stays in test mode until live keys are configured.
- **Prod data scripts:** the services' `.env` files point at a localhost dev DB — any script that must touch production data needs `DATABASE_URL` set explicitly to the Neon URL. That URL is a Vercel *Secret* (un-pullable); get it from the Neon dashboard and pass it inline via env (never write it into a repo file). Template: `services/listings/scripts/vary-capacity.ts` (idempotent: ALTER-IF-NOT-EXISTS + per-space UPDATE, cycles capacity profiles) — safe to run against either DB.
- Listing capacities are intentionally varied (ids 13–25): 1–6 adults, 0–4 children, pets on/off. Re-run `vary-capacity.ts` after re-seeding or the Who/guest filters lose their differentiation.