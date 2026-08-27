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
- **App later:** React Native
- **API:** Hono (TypeScript) microservices — **live**
- **Database:** PostgreSQL on Neon (`neondb`, eu-central-1), Drizzle ORM 0.45.2 + postgres-js — **live**
- **Payments:** Stripe Connect (scaffold built, keys needed)
- **Hosting:** Vercel (web iad1, services fra1) — **live**
- **Repo:** https://github.com/antoinesaab90/kicknap (public, branch `main`) — **live**
- **Local dev:** Next.js 16.3.3 docs ONLY at `web\node_modules\next\dist\docs\` (breaking changes vs. older Next — `lang()`/`cookies()` async, `params` Promises, `proxy.ts` middleware). `proxy.ts` matcher excludes `/api/*`.

## Architecture Principles
1. **Modular/microservice** — If one service fails, the whole platform doesn't crash
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
- Route handlers (BFF): `GET /api/auth/me`, `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `GET /api/availability`, `GET+POST /api/bookings`
- Auth = httpOnly cookie `kn_session` (+ display cookie `kn_user`). Register/login auto-login. Logout redirects via `?next=`.
- Server services expose `/api/v1/...`; each has `/health` → `{ok:true,service}`.

### Database (single Neon `neondb`, eu-central-1)
- One Postgres, per-service schemas (drizzle `pgSchema`): `identity.*` (users), `listings.*` (spaces, opening_hours), `availability.*`, `bookings.*` (bookings), `payments.*` (payments table)
- Reaching prod DB from a local script: **pass `DATABASE_URL` explicitly** (e.g. `env:DATABASE_URL = "postgresql://neondb_owner:***@ep-purple-frog-b15k5ftd.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require"`) — the services' own `.env` files point at a **localhost Postgres (dev only)** and silently hit the wrong DB.
- Seed state: 12 demo spaces (ids 13–24), 84 opening-hour rows, 1 demo booking (space 21, 2026-08-28 08:00–10:00Z, €15.60, id 2), 2 demo users. Demo accounts: `guest+demo@kicknap.com` / `host+demo@kicknap.com`, password `demo12345` (public demo creds — shown on the login page).

### Key flows (verified live)
1. Register / Login → `kn_session` cookie → `/api/auth/me`
2. Space detail → availability check (`available` | `outside_opening_hours` | `no_opening_hours` | `shorter_than_min` | `longer_than_max` | `space_not_found`) → ≈price (10% guest / 3% host fees)
3. Instant booking → 201; overlapping slot → 409 `slot_conflict`; "My bookings" via `?guestEmail=` filter
4. Payments scaffold: `POST /api/v1/payments/intents` → 503 `stripe_not_configured` until Stripe keys set (guarded, correct behavior)

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
- **Payments live:** add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID` to the `payments` Vercel project envs (production). Then: wire Stripe Elements into the booking widget, `payment_intent.succeeded` webhook → confirm booking, refunds/deposits.
- **Git auto-deploy (optional):** user accepts GitHub↔Vercel integration per project (dashboard → Settings → Git → Connect). All 6 projects are separate.

### Autonomous next steps
1. Hosts: Connect onboarding (`/payments/accounts`), host dashboard, listing creation UI (needs listings service CRUD write path)
2. Search depth: availability-aware search (hide booked slots) + wire home hero search box
3. Registration polish: email verification (later), profile page
4. (Optional) Notification service (bubble 6) — email confirmations

---
*Last updated: August 2026*
