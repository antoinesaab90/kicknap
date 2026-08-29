# kicknap — working notes for the agent

## Commands (run from repo root unless noted)
- `npm run test` — all unit tests, four suites, one command: web (20), services/availability (17), services/bookings (9), apps/mobile (45) = 91.
- `npm run check` — architecture lint (depcruise) + web eslint + Next build (26/26 pages).
- `npm run smoke:prod` — 15 health checks across all five deployed services + web (targets `*-xi.vercel.app` aliases + `www.kicknap.com`).
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