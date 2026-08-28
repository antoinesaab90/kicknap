# kicknap — Master Reference Document
> Single source of truth. Read this first in every new conversation.

---

## Brand
- **Name:** kicknap (kick back + nap)
- **Slogan:** "Call it home."
- **Message:** "A base between destinations"
- **What it is:** Hourly space rental platform. Airbnb but by the hour, not by the night. Primarily rest/sleep spaces. Workspace is secondary.
- **Logo:** `kicknap logo.jpg` — Primary Dark Navy #1D263B, Accent Parchment Gold #EADAB0
- **Favicon:** `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png` (from logo)
- **Social handles:** @kicknapnl (Instagram), @kicknapcom (TikTok, Twitter/X)
- **Domain:** kicknap.com (buying today), kicknap.nl later

## Company
- **Legal entity:** Learnix (eenmanszaak/ZZP)
- **KvK:** 42119992
- **Vestigingsnummer:** 000066237793
- **Address:** Kraijenhoffstraat 137 A, 1018RG Amsterdam
- **Future:** Will spin off into kicknap B.V. when revenue justifies (~€500-1000)
- **Note:** KvK activity description is IT services (mismatch with kicknap). Address transparently in Host Partner doc.

## Business Model
- **Pilot:** Amsterdam only. Schiphol + Centraal Station corridor.
- **Host model:** Hosts don't leave home. List during work hours (8-5). Zero lifestyle change.
- **Guest use cases:** Layovers, missed trains, early/late arrivals, exhausted tourists, between homes, parents needing a break.
- **Payment model (split fee, same as Airbnb):**
  - Guest pays 5-10% service fee
  - Host pays 3% service fee (deducted from payout)
  - Guest pays upfront → Stripe escrow → Host paid end of business day after check-in
- **Security deposit:** €50-100 pre-auth, released after 7 days if no damage
- **Host Damage Protection:** Not insurance. Contractual guarantee. Covers guest-caused damage to host's property only. Does NOT cover fire with undetermined cause, neighboring property damage, bodily injury, or damage exceeding deposit.
- **Insurance:** Hosts REQUIRED to maintain their own property + liability insurance covering commercial rental use.

## Financial Projections
- ~€385K Year 1 gross revenue
- Break-even Month 3-4
- 500 spaces by Month 12

## Tech Stack
- **Web:** React / Next.js 16.3.3 (App Router + Turbopack, React 19) — **live**
- **App later:** React Native — **in progress**: Expo SDK 54 app scaffolded at `apps/mobile` (see §1d)
- **API:** Hono (TypeScript) microservices — **live**
- **Database:** PostgreSQL on Neon (`neondb`, eu-central-1), Drizzle ORM 0.45.2 + postgres-js — **live**
- **Payments:** Stripe Payments + Connect via Stripe Checkout + webhook — **live in test mode** (keys + webhook destination set)
- **Hosting:** Vercel (web iad1, services fra1) — **live**
- **Repo:** https://github.com/antoinesaab90/kicknap (public, branch `main`) — **live**
- **Local dev:** Next.js 16.3.3 docs ONLY at `web\node_modules\next\dist\docs\` (breaking changes vs. older Next — `lang()`/`cookies()` async, `params` Promises, `proxy.ts` middleware). `proxy.ts` matcher excludes `/api/*`.

## Architecture Principles
1. **Modular monolith, deployed as serverless functions** — One repo, one shared Postgres, clean domain modules (listings / availability / bookings / identity / payments) split across Vercel deploys. This is NOT classic microservices (no per-service DBs, queues, orchestration, multi-repo). Decision of Aug 2026: **keep as-is; no new services.** New features go inside an existing domain or the web app. If a new boundary ever proves necessary, it can be split out later — the seams already exist.
2. **Everything async where possible** — Don't block the user
3. **Fail gracefully** — Show friendly errors, never crash the UI
4. **Security first** — Never store secrets in code, always use env vars
5. **Stripe Connect handles money** — We never hold funds directly
6. **GDPR compliant from day one** — Data minimisation, right to deletion, consent

## Production Architecture (9 Bubbles)
- **Auth Service** — Registration, login, JWT tokens
- **Listing Service** — CRUD, photos, amenities, availability
- **Booking Service** — Bookings, requests, check-in/out
- **Payment Service** — Stripe Connect, payouts, refunds
- **Pricing Service** — Pricing engine, suggestions, scraper
- **Notification Service** — Emails, push, preferences
- **Search Service** — Search, filters, autocomplete
- **Review Service** — Reviews, ratings, double-blind
- **Admin Service** — Dashboard, moderation, reporting

Each bubble:
- Owns its database tables
- Communicates via message queue (async) or HTTP (sync with timeout)
- Has health check endpoint
- Can fail independently without affecting others
- Gets monitored with alerts

See `ARCHITECTURE.md`, `SCALING.md`, `ENVIRONMENTS.md`, `CI_CD.md` for full details.

## Booking Variations
- **Two modes:** Instant Book (default) and Request to Book
- **Instant Book:** Guest pays immediately, no host approval. Booking is locked after payment.
- **Request to Book:** Guest sends request, host has 2 hours to accept/decline. Auto-decline if no response.
- **Post-check-in rule:** Once guest checks in, nobody can cancel. Booking is binding contract.
- **Minimum hours:** Host sets per listing (1-8 hours). No forced minimums. Pricing advisor suggests optimal.
- **Gap blocking:** Auto (block gaps < 1 hour) or Manual (host manages all gaps).
- **Search filter:** Guests can filter by Instant Book only, Request to Book, or All.

## Legal Documentation (27 files)

### Core Legal
| File | Description |
|------|-------------|
| `TERMS.html` | Master ToS — EU Airbnb structure, 24 sections, 77KB |
| `TERMS_GUEST.html` | Guest Terms — "limited license" language, split fee |
| `TERMS_HOST.html` | Host Terms — EU-aligned, DSA, insurance required |
| `PRIVACY_POLICY.html` | GDPR privacy policy — 13 sections, data tables |
| `PAYMENTS_TERMS.html` | Stripe Connect, PSD2 approach |
| `SERVICE_FEES.html` | Split fee model (guest 5-10%, host 3%) |
| `CANCELLATION_POLICY.html` | 3 tiers adapted for hourly bookings |

### Platform Policies
| File | Description |
|------|-------------|
| `NONDISCRIMINATION.html` | EU equal treatment, investigation process, appeal |
| `RESOLUTION.html` | Damage Reports, DSA Article 21 |
| `HOST_DAMAGE_PROTECTION.html` | Not insurance, fire limitations, deposit-based |
| `COMMUNITY_GUIDELINES.html` | 10 sections, local compliance language |
| `CONTENT_POLICY.html` | DSA Articles 14-17 compliance |
| `REVIEWS_POLICY.html` | Double-blind, 14-day window |
| `COOKIE_POLICY.html` | GDPR + ePrivacy, cookie tables |
| `DSA_NOTICE.html` | DSA Articles 16-22 + EU Regulation 2024/1028 |

### Help Center
| File | Description |
|------|-------------|
| `help.html` | Index — 8 card links + FAQ |
| `help-how-guests.html` | Guest guide |
| `help-how-hosts.html` | Host guide + "Check Your Local Rules" section |
| `help-safety.html` | Safety guide + fire safety + insurance warning |
| `help-trust.html` | Trust & verification mechanisms |
| `help-accessibility.html` | Accessibility guide |
| `help-payments.html` | Payments guide |
| `help-cancellations.html` | Cancellations guide |
| `help-contact.html` | Contact support |

### Business
| File | Description |
|------|-------------|
| `BUSINESS_MODEL.html` | Full business model EN |
| `BUSINESS_MODEL_NL.html` | Full business model NL |
| `index.html` | Landing page |

## Key Legal Protections (Lessons from Case Law)
1. **B.W. v. Airbnb (2025):** Never promise safety we don't enforce. Safety checklists = Host DECLARATIONS only.
2. **No screening disclaimer:** We don't do criminal background checks on anyone.
3. **Platform immunity (DSA/e-Commerce):** Stay passive. Don't control, inspect, or verify properties.
4. **Indemnification:** Hosts indemnify kicknap for fire, third-party claims, neighboring damage.
5. **Insurance required:** Hosts must maintain their own property + liability insurance.
6. **Price transparency:** No drip pricing. Full itemized breakdown before checkout.
7. **Data minimisation:** Only collect ID when strictly necessary and proportionate.

## Local Compliance Approach
- **Airbnb-style:** Push all compliance to Hosts. Strong disclaimers. No city-specific legal obligations on kicknap.
- **Amsterdam rules:** "Vakantieverhuur" (30 nights/year, 15 from April 2026) likely doesn't apply to hourly model. But hosts must check.
- **Registration numbers:** Collect from hosts for EU Regulation 2024/1028 compliance when platform builds.

## Go-to-Market (Zero Budget)
1. Instagram DMs to Airbnb hosts in Amsterdam
2. Reddit (r/Amsterdam, r/travel, r/solotravel)
3. TikTok "What €X Gets You in Amsterdam" series
4. Schiphol arrival hall flyers
5. Hostel partnerships near Centraal Station
6. Google Maps listing as coworking/space
7. LinkedIn founder story
8. Telegram/WhatsApp expat groups
9. Amsterdam tourism Instagram pages

## Marketing Content Needed
- Host Partner one-pager document
- Instagram DM template for Airbnb hosts
- Schiphol flyer design
- TikTok content plan (first 10 videos)
- LinkedIn founder story post

## Files Location
All files at: `C:\Users\antoi\Documents\Default Project\kicknap\`

## Session History
- **Session 1:** Naming, logo, landing page, business model
- **Session 2:** Legal documentation suite (27 files), help center
- **Session 3:** Legal audit (6 issues found, all fixed), safety language fixes, fire scenario protections
- **Session 4:** KvK number added to all footers, favicon created, social media handles reserved, SEO meta tags added
- **Session 5:** Pricing engine (scraper, calculation, advisor, notifications), booking variations (Instant Book vs Request to Book), notification preferences, database schema (21 tables), API endpoints (70+)
- **Session 6:** Production architecture (9 bubble microservices), scaling strategy (4 tiers), environment strategy (local/dev/staging/production), CI/CD pipeline (5 stages), fault tolerance design
- **Session 7:** Monorepo scaffold + Phase 1 microservices (Hono, Drizzle, Neon). Stack decisions locked.
- **Session 8:** Per-service schema + seed scripts (12 demo spaces, opening hours, demo booking), bookings + identity services, local full-stack verification
- **Session 9:** Web app: "Sector" landing, EN/NL i18n, search view + space cards, CORS enforcement, SEO/sitemap.xml
- **Session 10:** Next.js 16.3.3 migration; deployed web + listings/availability/bookings/identity to Vercel production; kicknap.com domain attached
- **Session 11:** Booking flow end-to-end (space detail + booking widget, availability + price, auth login/logout), payments service scaffold (Stripe), infra tooling (`deploy:prod`, `smoke:prod`), drizzle-orm 0.44→0.45.2 security patch
- **Session 12:** Final checks, redeploy of all 6 apps (drizzle 0.45.2), smoke 15/15, `git commit 2d6f80c` + push, **self-service registration** (`/register`, BFF route), live verification, `git commit 020c6fe` + push
- **Session 13:** **Payments live end-to-end (test mode)**: Stripe account (Learnix, Payments + Connect) set up by user with guidance; test keys + Connect client ID + webhook secret added to `payments` Vercel env; payments service `POST /payments/checkout` (Stripe Checkout hosted page, iDeal + cards), `POST /payments/webhook` (v1 snapshot events, signature verify); web `/api/checkout` BFF + "Pay now" step in booking widget (redirect flow). Verified live: booking → Checkout → successful payment → webhook → payments row `succeeded` (€17.16). doc + `git commit b+` pushed.
- **Session 14 (cont. Aug 28):** availability-aware search (**Part A**), double-payment guard (**Part B**), host earnings ledger (**Part C**) — all live (see §1c), commits `30c284a` + `b000927` pushed. **Native app scaffolded:** Expo SDK 57 in `apps/mobile`, then **downgraded to SDK 54** to match App Store Expo Go (see §1d).

## Production Architecture
- **9 services (bubbles):** Auth, Listing, Booking, Payment, Pricing, Notification, Search, Review, Admin
- **Each service:** Owns its tables, communicates via queue/HTTP, has health checks, fails independently
- **Scaling:** Tier 1 (€80/mo, 500 users) → Tier 2 (€300/mo, 3K users) → Tier 3 (€1,500/mo, 30K users) → Tier 4 (€5,000/mo, 100K+ users)
- **Environments:** Local → Development (auto-deploy) → Staging (manual, must match production) → Production (manual, with approval)
- **CI/CD:** Validate → Build → Test → Deploy → Monitor (5 stages)
- **Key patterns:** Async by default, circuit breaker, graceful degradation, health checks, rate limiting

## Booking Variations
- **Two modes:** Instant Book (default) and Request to Book
- **Instant Book:** Guest pays immediately, no host approval. Booking is locked after payment.
- **Request to Book:** Guest sends request, host has 2 hours to accept/decline. Auto-decline if no response.
- **Post-check-in rule:** Once guest checks in, nobody can cancel. Booking is binding contract.
- **Minimum hours:** Host sets per listing (1-8 hours). No forced minimums. Pricing advisor suggests optimal.
- **Gap blocking:** Auto (block gaps < 1 hour) or Manual (host manages all gaps).
- **Search filter:** Guests can filter by Instant Book only, Request to Book, or All.

## Database Schema
- **21 tables, 11 enums, 7 views, 57+ indexes**
- Key tables: users, listings, bookings, booking_requests, payments, reviews, pricing_history, notification_preferences, service_health, deployment_log
- See `schema.sql` for full schema

## Pricing Engine
- **Airbnb scraper:** Scrapes public Amsterdam data (hourly converted from nightly)
- **Pricing calculator:** Multipliers for day, time, amenities, demand
- **Pricing advisor:** Real-time feedback when host enters price (probability %, earnings estimates, recommendations)
- **Notification system:** Price change alerts, weekly earnings summaries (email)
- **Notification preferences:** Hosts can enable/disable each notification type
- See `pricing-engine/` directory for all code

## API Design
- **70+ REST endpoints** across 13 resource groups
- Key groups: Auth, Users, Listings, Bookings, Booking Requests, Payments, Pricing, Search, Reviews, Notifications, Admin
- Health check endpoints for each service
- Rate limiting configured per endpoint
- See `API_ENDPOINTS.md` for full API design

## 1c. Session: availability-aware search, double-payment guard, host earnings ledger (Aug 28)
- **Availability-aware search live**: new `GET /api/v1/check-many?from&to` on availability (single-call availability across all published spaces; same semantics as `/check`). Search page gains date/time/duration filters (URL params `date`,`time`,`hours`, GET form) that filter cards to free spaces and show "N of M spaces free at …" note; dedicated empty states. Home hero search bar is now a **real GET form** to `/search` (area/date/duration). Amsterdam-zone helpers `amsZonedIso`/`amsTimeLabel`/`localDateString` in `web/src/lib/format.ts` (DST-safe).
- **Double-payment guard**: `POST /payments/checkout` returns `409 already_paid` if a `succeeded` payment row already exists for the booking; webhook insert uses `onConflictDoNothing` for race safety. (Verified live: booking 6 → 409, unpaid booking 7 → session issued.)
- **Host earnings ledger**: `GET /api/v1/bookings/by-space?spaceIds=` (bookings, confirmed or not) + `GET /api/v1/payments/by-bookings?ids=` (payment rows); web BFF `/api/host/earnings` joins them (space names, per-booking payout amount, totals paid/earnedCents — `hostPayoutCents`). Host dashboard gains a Bookings & earnings card: totals + table (space, datetime, guest, amount, paid/pending/failed chip) and per-space "Public page ↗" links. Route order gotcha: `/bookings/by-space` must be registered **before** `/bookings/:id`.
- Host earnings E2E live: demo host sees 2 bookings, paid 1, earned €15.13 on the "Atelier hideaway" booking.

## 1b. Session: host dashboard, payouts, emails, polish (Aug 28)
- **Host space management live** (commit `90fe63b`): `[lang]/host` dashboard (login-gated, spaces list + status badges), `[lang]/host/new` + `[lang]/host/spaces/[id]` create/edit (ownership-checked via `?host=`), weekly-hours editor, publishing. BFF: `web/src/app/api/host/spaces[/[id]][/publish]` (requireHost, JWT). Header host link routes signed-in users to `/host`, guests to `/#host`. Public listings hide drafts (`published===true` gating on `GET /spaces` and `GET /spaces/:id`); internal `GET /api/v1/internal/host-spaces/:id?hostEmail=` returns any state with ownership check (backs availability `fetchOwnedSpace`).
- **Stripe Connect payouts**: Accounts **v2** (`POST https://api.stripe.com/v2/core/accounts`, header `Stripe-Version: 2026-08-26.dahlia`) via raw fetch — installed `stripe@17.7.0` has `v2.core` but not `v2.core.accounts`. Onboarding link via v1 `accountLinks.create`. **Self-healing schema**: `services/payments/src/db/bootstrap.ts` `ensureHostAccounts()` runs idempotent `CREATE TABLE IF NOT EXISTS payments.host_accounts` once per warm instance. `POST /payments/accounts` idempotent-reuses; status GET reads `stripe_balance.payouts.status==="active"` as payoutsEnabled (cast via unknown). Web BFF `api/host/payouts` (GET status / POST→303 onboardingUrl); dashboard payouts card; dict `host.payouts*` en+nl; origin from `request.url`.
- **Booking emails, SMTP-ready** (`services/bookings/src/lib/mail.ts` + `nodemailer@6.9.14`): `notifyBookingCreated` on booking create — guest confirmation + host new-booking notifications; lazy transporter; no-op unless SMTP env set; HTML-escaped templates. Listings `GET /spaces/:id` now returns `hostEmail` (leftJoin users).
- **Home polish**: live featured-spaces strip (first 6 published, `SpaceCard`, `dict.featured.*` en+nl) between How-it-works and Testimonial; hero subtitle updated ("Live in Amsterdam").
- E2E fully green end-to-end (search/detail/day/check/book/pay/login/web pages) on prod.

## 1d. Session: native app scaffold (Aug 28)
- **Expo SDK 54 app** at `apps/mobile` (create-expo-app template then **downgraded 57 → 54**): SDK 54 was scaffolded as 57, but App Store Expo Go supports only **SDK 54** → "Project is incompatible with this version of Expo Go" on scan. Fixed via `expo install expo@^54.0.0` + `expo install --fix`, then `.npmrc` `legacy-peer-deps=true` (expo-router@6 peerOptional react-server-dom-webpack auto-resolves to 19.2.8 vs react 19.1.0 → ERESOLVE). Final: expo ~54.0.37, expo-router ~6.0.24, RN 0.81.5, React 19.1.0, TS ~5.9.2, eslint-config-expo ~10.0.0. `expo install --check` = "Dependencies are up to date"; tsc + ESLint clean. App name/slug/scheme `kicknap`; `experiments`: typedRoutes false, reactCompiler true; paths `@/*` → `./src/*`. Mobile `AGENTS.md` now points at v54 docs and warns against SDK bumps ahead of Expo Go.
- **Foundation written:** `src/lib/theme.ts` (navy/gold, spacing, radius), `src/lib/types.ts`, `src/lib/api.ts` (ENV-driven base URLs via `EXPO_PUBLIC_LISTINGS/AVAILABILITY/BOOKINGS/IDENTITY/PAYMENTS_URL`; listSpaces/checkMany/fetchSpace/login/register/me/createBooking/createCheckout/paymentStatus/myBookings), `src/lib/format.ts` (**DST-safe** amsOffsetMinutes — last Sun Mar/Oct EU rule, manual — amsZonedIso, formatEuro `\u20ac`, formatAmsterdam/amsTimeLabel), `src/lib/auth.tsx` (AuthProvider; SecureStore `kn_token`/`kn_email`), `src/components/ui.tsx` (Screen/Card/Button/Pill/StatusChip/Field/Input).
- **Screens:** `_layout.tsx` (Stack + AuthProvider), `index.tsx` (hero + featured list), `search.tsx` (area pills + date/time/hours + **check-many** filter), `spaces/[id].tsx` (booking pane → createBooking → Checkout Session → `WebBrowser.openBrowserAsync` + poll paymentStatus up to 90s → `/bookings`; deep link `kicknap://booking-result`/`kicknap://search`), `login.tsx`, `register.tsx`, `bookings.tsx` (guestEmail-filtered list + status chips + sign out).
- **Verified:** `npx tsc --noEmit` clean; ESLint (eslint-config-expo) clean.
- Booking flow constant: mobile book → Stripe **hosted Checkout** (no PaymentSheet) → poll — no server changes required.
- Run: double-click `start-kicknap.cmd` in `apps/mobile` (opens expo start QR), scan with iPhone camera/Expo Go. Base URLs from `.env` (`apps/mobile/.env.example`). User's phone: Expo Go from App Store = SDK 54.

## 1. Implemented Production System (LIVE)

> What actually runs today. All deployed to Vercel, branch `main`. Verified by `npm run smoke:prod` (15/15 pass).

### Live URLs
| App | Production URL | Alias | Notes |
|-----|----------------|-------|-------|
| web | `web-*-kicknap.vercel.app` | **www.kicknap.com** | Next.js 16.3.3, iad1 |
| listings | `listings-*-kicknap.vercel.app` | `listings-hazel.vercel.app` | Hono, fra1 |
| availability | `availability-*-kicknap.vercel.app` | `availability-xi.vercel.app` | Hono, fra1 |
| bookings | `bookings-*-kicknap.vercel.app` | `bookings-sable-nine.vercel.app` | Hono, fra1 |
| identity | `identity-*-kicknap.vercel.app` | `identity-wheat-ten.vercel.app` | Hono, fra1 |
| payments | `payments-*-kicknap.vercel.app` | `payments-olive.vercel.app` | Hono, fra1; `/health` reports `stripeConfigured` |

### Web routes
- Pages (BFF-proxied, `/[lang]` = `en`/`nl`): `/` (landing), `/[lang]` — `search`, `spaces/[id]`, `login`, `register`, `bookings`; `/sitemap.xml`
- Route handlers (BFF): `GET /api/auth/me`, `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `GET /api/availability`, `GET+POST /api/bookings`, `POST /api/checkout` (Stripe hosted Checkout for a confirmed booking)
- Auth = httpOnly cookie `kn_session` (+ display cookie `kn_user`). Register/login auto-login. Logout redirects via `?next=`.
- Server services expose `/api/v1/...`; each has `/health` → `{ok:true,service}`.

### Database (single Neon `neondb`, eu-central-1)
- One Postgres, per-service schemas (drizzle `pgSchema`): `identity.*` (users), `listings.*` (spaces, opening_hours), `availability.*`, `bookings.*` (bookings), `payments.*` (payments table)
- Reaching prod DB from a local script: **pass `DATABASE_URL` explicitly** (e.g. `env:DATABASE_URL = "postgresql://neondb_owner:***@ep-purple-frog-b15k5ftd.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require"`) — the services' own `.env` files point at a **localhost Postgres (dev only)** and silently hit the wrong DB.
- Seed state: 12 demo spaces (ids 13–24), 84 opening-hour rows, bookings id 2 (space 21, 2026-08-28, €15.60) and id 6 (space 21, 2026-08-29, paid €17.16 → payments row id 1 `succeeded`), 2 demo users. Demo accounts: `guest+demo@kicknap.com` / `host+demo@kicknap.com`, password `demo12345` (public demo creds — shown on the login page).

### Key flows (verified live)
1. Register / Login → `kn_session` cookie → `/api/auth/me`
2. Space detail → availability check (`available` | `outside_opening_hours` | `no_opening_hours` | `shorter_than_min` | `longer_than_max` | `space_not_found`) → ≈price (10% guest / 3% host fees)
3. Instant booking → 201; overlapping slot → 409 `slot_conflict`; "My bookings" via `?guestEmail=` filter
4. **Payment (test mode)** → booking success card shows **Pay now** → `POST /api/checkout` (web BFF) → `POST /api/v1/payments/checkout` creates Stripe **Checkout Session** (hosted page; `payment_intent_data.transfer_data` + `application_fee_amount` ONLY when a `hostAccountId` is supplied) → user pays (4242) → `payment_intent.succeeded` → webhook verifies `Stripe-Signature` → payments row `succeeded`. Verified: booking 6, €17.16 (guest 17.16 / host payout 15.13 / platform 2.03).
   - Payments destination (test env): created via **Stripe v2 API** `POST /api.stripe.com/v2/core/event_destinations` (`event_payload: snapshot`, `events_from: @self`, enabled `payment_intent.succeeded` + `payment_intent.payment_failed`), id `we_1U9Uq2...`, URL = `https://payments-olive.vercel.app/api/v1/payments/webhook`. Signing secret held in Vercel env `STRIPE_WEBHOOK_SECRET` (never commit).
   - ⚠️ The dashboard "Create an event destination" flow put the user's destination in the WRONG environment (delivered 0 events to test mode). Use the v2 API to create destinations, not the dashboard.

### Operations
- Dev: `npm run dev` (root — all 5 services + web). Env: `npm run db:init`, `npm run db:seed`
- Checks: `npm run check` (root) = dependency-cruiser + `eslint` + `next build` (gate before commit)
- Deploy all: `npm run deploy:prod` → `node scripts/deploy-prod.mjs` (listings → availability → bookings → identity → payments → web)
- Verify all: `npm run smoke:prod` → `node scripts/smoke-prod.mjs` (15 HTTP checks, ENDPOINTS map at top)
- `vercel.cmd deploy --prod --cwd <dir>` for one-off deploys
- Gateway of deploys: dependency-cruiser (`npm run lint:arch`), currently ~114 modules / 200+ deps, no violations

### Windows PowerShell 5.1 gotchas (read before running anything)
- Prepend PATH: `$env:Path = "$env:ProgramFiles\nodejs;$env:APPDATA\npm;$env:Path"`; use `npm.cmd`/`npx.cmd`/`vercel.cmd`
- ALWAYS set the bash tool `workdir` to the repo root `C:\Users\antoi\Documents\Default Project\kicknap` (or subdir); `--cwd services/...` fails ENOENT without it
- `curl.exe -d '{"json"}'` **mangles inline JSON** (double quotes stripped → services return `invalid_body`): write the body to a temp file and send `--data-binary "@body.json"`
- `Set-Content` writes a **UTF-8 BOM** → breaks `package.json` for Vercel CLI (`Unexpected token in JSON`). Use `[IO.File]::WriteAllText` with `UTF8Encoding($false)` for JSON files
- `git.exe` lives at `C:\Program Files\Git\cmd` (not on PATH)
- Temp scratch dir: `C:\Users\antoi\AppData\Local\Temp\opencode`

### Vercel quirks
- Linking + env: `vercel.cmd link --yes --cwd services/<x>` FIRST, then `'value' | vercel.cmd env add <NAME> production --cwd services/<x> --force`
- `vercel project add` creates Framework Preset = **Other** → Hono zero-config not wired (404). Fix: `vercel project update <name> --framework hono --yes`, redeploy. (Original 4 services were auto-detected on first deploy.)
- All services `vercel.json`: `{"regions":["fra1"]}`

## 2. Pending Work (next sessions)

### Blocked on user (do first, they unlock me)
- **Booking emails:** SMTP module is built (`services/bookings/src/lib/mail.ts`, no-op until configured) — user needs to provide Zoho Mail SMTP creds (`EMAIL_SMTP_HOST/PORT/USER/PASS` + `EMAIL_FROM` env on bookings-sable-nine) and confirm SPF/DKIM DNS records for the sending domain. Then live sends happen automatically.
- **Stripe:** delete the stray dashboard webhook destination (Workbench → Webhooks) in the wrong environment; later "Activate payouts" test with a fake host; go-live requires live-mode keys + verification (real money).
- **Git auto-deploy (optional):** user accepts GitHub↔Vercel integration per project (dashboard → Settings → Git → Connect). All 6 projects are separate.

### Autonomous next steps
1. ✅ Availability-aware search (live) + home hero search box wired
2. ✅ Double-payment guard (409 `already_paid`) — payment per booking enforced
3. Profile page + (later) email verification
4. ✅ Host earnings ledger (live) — by-space + by-bookings + web BFF; host cash-out math next (payouts.webhook for host_accounts updates, v2 accounts)
5. Native iOS/Android app — **in progress**: scaffold + core screens done, need on-device testing
6. Vitest unit tests for price/date-time logic (mobile `format.ts` + services)

---
*Last updated: August 2026*
