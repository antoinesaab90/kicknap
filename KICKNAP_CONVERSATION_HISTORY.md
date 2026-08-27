# kicknap — Full Conversation History
> Complete record of all decisions, discussions, and work across all sessions.

---

## SESSION 1: Naming, Logo, Landing Page, Business Model

### Naming Process
- Started with "napnook" — domain taken
- Explored hundreds of alternatives across multiple rounds
- Final 5 candidates: kicknap, naporbit, napdrop, snapnap, kipnap
- **Chose: kicknap** (kick back + nap)
- Embraced the "kidnap" phonetic similarity as a memorability feature
- Slogan: "Call it home." / Message: "A base between destinations"

### Logo
- Generated logo with AI
- Specs: Primary Dark Navy #1D263B, Accent Parchment Gold #EADAB0
- Lowercase geometric sans-serif
- Saved as: `kicknap logo.jpg`

### Domain Research
- Checked 500+ domains across multiple sessions
- kicknap.com was AVAILABLE
- User plans to buy for ~$10

### Landing Page
- Built `index.html` — clean Airbnb-style landing page
- Inter font, responsive, search bar, value proposition sections

### Business Model
- Created `BUSINESS_MODEL.html` (English) and `BUSINESS_MODEL_NL.html` (Dutch)
- **Key differentiator:** Hosts don't leave home. List during work hours (8-5). Zero lifestyle change. Passive income during dead hours.
- **Payment model:** Split fee (guest 5-10%, host 3%) — same as Airbnb
- **Pilot:** Amsterdam only. Schiphol + Centraal corridor.
- **Go-to-market:** Zero budget — flyers, Instagram DMs, Reddit, hostel partnerships
- **Financial projections:** ~€385K Year 1 gross revenue, break-even Month 3-4, 500 spaces by Month 12
- **Tech stack:** React/Next.js web → React Native app. Node.js/Python API. PostgreSQL. Stripe Connect. Railway/Vercel. Cloudflare.

---

## SESSION 2: Legal Documentation + Help Center

### Legal Framework Decision
- User's #1 priority: EU legal compliance
- Used Airbnb EU ToS (EEA/Swiss/UK version) as primary reference
- Company structure: Learnix ZZP (IT services & consultancy). Will spin off into kicknap B.V. when revenue justifies.
- KvK update ~€50, B.V. setup ~€500-1000 later

### Legal Documents Created (27 total)

#### Core Legal (7 files)
1. **TERMS.html** — Master ToS, 24 sections, 72KB. EU Airbnb structure.
2. **TERMS_GUEST.html** — Guest Terms. "limited license to enter, occupy, and use" language.
3. **TERMS_HOST.html** — Host Terms. EU-aligned, DSA complaint handling, 30-day modification notice.
4. **PRIVACY_POLICY.html** — GDPR-compliant, 13 sections, data tables, rights, retention periods.
5. **PAYMENTS_TERMS.html** — Stripe Connect, PSD2 approach.
6. **SERVICE_FEES.html** — Split fee model (guest 5-10%, host 3%).
7. **CANCELLATION_POLICY.html** — 3 tiers adapted for hourly bookings.

#### Platform Policies (8 files)
8. **NONDISCRIMINATION.html** — EU equal treatment directives.
9. **RESOLUTION.html** — Damage Reports, DSA Article 21.
10. **HOST_DAMAGE_PROTECTION.html** — Not insurance. Platform-based resolution. Security deposit system.
11. **COMMUNITY_GUIDELINES.html** — 10 sections covering respect, safety, privacy, legality.
12. **CONTENT_POLICY.html** — DSA Articles 14-17 compliance.
13. **REVIEWS_POLICY.html** — Double-blind, 14-day window, prohibited content.
14. **COOKIE_POLICY.html** — GDPR + ePrivacy, cookie tables.
15. **DSA_NOTICE.html** — DSA Articles 16-22 + EU Regulation 2024/1028.

#### Help Center (9 files)
16. **help.html** — Index with 8 card links + FAQ section.
17. **help-how-guests.html** — Guest help guide.
18. **help-how-hosts.html** — Host help guide + "Check Your Local Rules" section.
19. **help-safety.html** — Safety guide + fire safety + insurance warning.
20. **help-trust.html** — Trust & verification mechanisms.
21. **help-accessibility.html** — Accessibility guide.
22. **help-payments.html** — Payments guide.
23. **help-cancellations.html** — Cancellations guide.
24. **help-contact.html** — Contact support.

#### Business (3 files)
25. **BUSINESS_MODEL.html** — Full business model EN.
26. **BUSINESS_MODEL_NL.html** — Full business model NL.
27. **index.html** — Landing page.

### Key Legal Decisions
- **"Leave in same condition"** — kept as Airbnb exact wording. Guests NOT expected to clean but must not leave extraordinary mess.
- **Check-in/check-out times** — specific per listing, set by host.
- **Local regulations:** Airbnb-style — push all compliance to Hosts, strong disclaimors, no city-specific legal obligations on kicknap.

---

## SESSION 3: Legal Audit + Safety Language Fixes + Fire Scenario

### Legal Audit (6 issues found)
Full audit conducted across all 10 core legal documents using subagent.

| Issue | Description | Status |
|-------|-------------|--------|
| A | Price transparency — missing itemized breakdown, no drip pricing prohibition | FIXED |
| B | Data minimisation — missing GDPR Article 5(1)(c) statement | FIXED |
| C | Nondiscrimination — no investigation timeline, no appeal, no anti-retaliation | FIXED |
| D | Safety disclaimer — no explicit "we don't inspect/verify safety" language | FIXED |
| E | DSA_NOTICE — missing EU Regulation 2024/1028 (short-term rental data sharing) | FIXED |
| H | ID verification — no minimisation language in ToS | FIXED |

### Audit Fixes Implemented

**Fix B: Data Minimisation (PRIVACY_POLICY.html)**
- Added data minimisation principle (GDPR Art 5(1)(c))
- Updated ID verification row with proportionality assessment language
- Clarified retention of verification metadata

**Fix C: Nondiscrimination (NONDISCRIMINATION.html)**
- Complete rewrite of reporting/enforcement sections
- Added investigation process: 2-day ack, 5-day response, 14-day determination
- Interim measures during investigation
- Progressive discipline: warning → suspension → termination
- 30-day appeal right
- Anti-retaliation protection

**Fix A: Price Transparency (TERMS_GUEST.html)**
- Added itemized breakdown on checkout screen before confirmation
- Explicit drip pricing prohibition

**Fix D: Safety Disclaimer (TERMS.html)**
- Added §19.3: "No Safety Verification" — explicit "we don't inspect/verify safety"
- Added §19.4: "No Guest Screening or Background Checks"
- Added §19.5: "Host Safety Declarations" — safety checklists are Host declarations only
- Updated consumer rights language (EU Consumer Rights Directive Art 16(e))

**Fix E: EU Regulation 2024/1028 (DSA_NOTICE.html)**
- Added §10: "EU Short-Term Rental Regulation"
- Host registration numbers, data sharing with authorities, listing requirements

**Fix H: ID Verification Minimisation (TERMS.html, TERMS_GUEST.html)**
- Added data minimisation language to identity verification sections
- Explicit statement: "kicknap does not conduct criminal background checks or security screenings"

### Critical Safety Language Fixes

**Problem:** "How we keep you safe on kicknap" and "kicknap builds safety into our platform" — exactly the language that got Airbnb sued in B.W. v. Airbnb (2025).

**Fixed in:**
- `help-safety.html` — Changed header to "Safety on kicknap" + added explicit disclaimer
- `help.html` — Changed card text to "Important safety information for Hosts and Guests"
- `help-trust.html` — Changed "How we build trust" to "Trust mechanisms on the kicknap platform"

### Fire Scenario Analysis & Protections

**Scenario:** Guest burns down house, damages neighboring properties.

**Chain of Liability:**
1. Guest → PERSONALLY LIABLE (Art. 6:162 BW tort law)
2. Host → LIABLE TO NEIGHBORS (Art. 6:173 BW — things in one's care)
3. kicknap → NOT LIABLE (DSA Art. 6 immunity — IF we stay passive)

**Protections Added:**

**TERMS_HOST.html §5.5 — Insurance Requirement:**
- Hosts MUST maintain adequate insurance covering commercial rental use
- Must cover: property damage, third-party liability, common area damage
- Standard Dutch home insurance (opstalverzekering) excludes rental use
- Lists Dutch insurers: Nationale-Nederlanden, a.s.r., Aegon, Centraal Beheer
- kicknap's protection is NOT insurance

**TERMS.html §21.1 — Expanded Indemnification:**
- Host indemnifies kicknap for: guest property damage, neighboring property damage, bodily injury/death, fire/flood, failure to maintain insurance
- Survives termination of account

**HOST_DAMAGE_PROTECTION.html — Fire Limitations:**
- Fire with undetermined cause → NOT covered
- Damage to neighboring properties → NOT covered
- Bodily injury/death → NOT covered
- Damage exceeding deposit → NOT covered
- Explicit "This is not insurance" language

**help-safety.html — Fire Safety Section:**
- Host fire safety checklist (smoke detectors, extinguishers, exits, electrical)
- Guest fire safety rules
- Step-by-step "What Happens If a Fire Occurs" guide
- Insurance warning prominently displayed

### Airbnb Case Law Research (Key Findings)

| Case | Year | Outcome | Lesson for kicknap |
|------|------|---------|-------------------|
| B.W. v. Airbnb | 2025 | Airbnb LOST — promised safety measures it didn't enforce | Never promise safety you don't verify |
| Australia $15M fine | 2023 | Misleading price display | Price must be 100% transparent |
| Irish DPC reprimand | 2023 | Asked for ID copy to process data deletion | Only collect ID when strictly necessary |
| California DFEH | 2017 | Racial discrimination by hosts | Enforce nondiscrimination with clear process |
| Spain €64M fine | 2025 | Fake registration numbers | Validate registration numbers |
| Dutch class action | - | 50,000+ consumers sued over double fees | Our split fee model is the same |
| Hlad v. Hirsch | 2025 | Airbnb WON — didn't control the property | Maintain passive platform role |

### Dutch Legal Framework
- **Art. 6:162 BW** — Tort law (guest liability)
- **Art. 6:173 BW** — Liability for things in one's care (host liability to neighbors)
- **Art. 6:196c BW** — Platform liability immunity (e-Commerce/DSA)
- **Art. 7:401 BW** — Duty of care (zorgplicht) for service providers
- **Amsterdam rules:** Vakantieverhuur 30 nights/year (15 from April 2026). Hourly likely falls outside this.

---

## SESSION 4: Domain Prep, Favicons, KvK, Social Media

### Social Media Handles Reserved
- **Instagram:** @kicknap.nl (primary — signals Amsterdam-first)
- **TikTok:** @kicknapcom
- **Twitter/X:** @kicknapcom
- **Strategy:** @kicknap.nl on Instagram for local signal, @kicknapcom everywhere else for consistency

### Domain Plan
- Buy kicknap.com today (~$10)
- Buy kicknap.nl later
- Deploy landing page + all legal docs to live site

### KvK Number Added
- KvK 42119992 (Learnix, eenmanszaak)
- Vestigingsnummer: 000066237793
- Address: Kraijenhoffstraat 137 A, 1018RG Amsterdam
- Added to footer of ALL 27 HTML files
- Note: KvK activity description is IT services (mismatch with kicknap). Will be addressed transparently in Host Partner document.

### "Learnix ZZP" → "Learnix"
- User requested removing "ZZP" from all references
- Updated across all 27 files

### Favicon Created
- Source: `C:\Users\antoi\Downloads\favicon.jpg` (user's logo)
- Created: `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`
- Wired up in index.html with proper link tags

### SEO Meta Tags Added (index.html)
- Title: "kicknap — A base between destinations"
- Meta description for search engines
- Open Graph tags (LinkedIn, WhatsApp, Facebook preview cards)
- Twitter Card tags
- Theme color: #1D263B
- Canonical URL: https://kicknap.com

### Trust & Legitimacy Discussion
**What hosts will ask:**
- "Who are you?" → Learnix, KvK 42119992, Amsterdam
- "Is this a scam?" → Registered Dutch business, host agreement, Stripe payments
- "How do I get paid?" → Stripe Connect, daily payout
- "What if a guest damages my space?" → Security deposit + Host Damage Protection
- "What if I get fined?" → You're responsible for your own compliance
- "Do I need insurance?" → Yes, standard Dutch home insurance doesn't cover rental
- "What does kicknap take?" → 3% host service fee, no upfront costs

**Still needed:**
- Host Partner one-pager document
- Professional email (Zoho Mail, free)
- LinkedIn company page

### Personal Note
- User went through a breakup during this session
- Lost access to girlfriend's apartment (potential first listing) and her social network
- Reframed: project is still intact, 27 legal files + landing page + brand all built
- Need to find first listing independently

---

## Marketing Strategy (Zero Budget)

### Target Audience (Primary: Rest/Sleep, NOT Workspace)
- Schiphol layovers (6-hour layover, nowhere to sleep)
- Early arrivals / late departures (flight lands 6am, check-in 3pm)
- Missed the last train (1am, no train home)
- Exhausted tourists (sightseeing all day, need a nap)
- Between homes (moving, renovating)
- Parents needing a break (3 hours of quiet)
- Night shift workers (need daytime sleep)

### Marketing Channels (Ranked)
1. Instagram DMs to Airbnb hosts in Amsterdam
2. Reddit (r/Amsterdam, r/travel, r/solotravel)
3. TikTok "What €X Gets You in Amsterdam" series
4. Schiphol arrival hall flyers
5. Hostel partnerships near Centraal Station
6. Google Maps listing
7. LinkedIn founder story
8. Telegram/WhatsApp expat groups
9. Amsterdam tourism Instagram pages

### Launch Requirements
- Minimum 20-30 active listings before marketing to guests
- Focus on 2 clusters: Schiphol (10-15 hosts) + Centraal corridor (10-15 hosts)
- Don't spread thin — density matters more than quantity

---

## Pending Tasks

### Immediate
- [ ] Buy kicknap.com domain
- [ ] Deploy landing page + legal docs to live site
- [ ] Set up Zoho Mail (support@kicknap.com, info@kicknap.com)
- [ ] Create LinkedIn company page
- [ ] Draft Host Partner one-pager document

### Before Guest Marketing
- [ ] Secure 20-30 hosts (Instagram DMs to Airbnb hosts)
- [ ] Create Instagram DM template
- [ ] Design Schiphol flyer
- [ ] TikTok content plan

### Before App Launch
- [x] Design PostgreSQL database schema (21 tables, 11 enums, 7 views, 57+ indexes)
- [x] Map REST API endpoints (70+ endpoints)
- [x] Design Stripe Connect integration
- [x] Tech stack documentation
- [x] Production architecture (9 bubble microservice design)
- [x] Scaling strategy (4 tiers: launch → growth → scale → enterprise)
- [x] Environment strategy (local → development → staging → production)
- [x] CI/CD pipeline (5 stages: validate → build → test → deploy → monitor)
- [x] Booking variations (Instant Book vs Request to Book, min hours, gap blocking)

### Later
- [ ] Legal review by Dutch lawyer (Juridisch Loket or KVK as free alternatives)
- [ ] Buy kicknap.nl domain
- [ ] Spin off into kicknap B.V.

---

## SESSION 5: Production Architecture & Resilience

### Architecture Discussion
- User asked: "Can this handle millions of transactions without crashing?"
- Honest assessment: Foundation is good, but missing critical components
- Missing: Redis caching, message queue, load balancing, rate limiting, monitoring, backups

### The Bubble Architecture (9 Services)
- **Key decision:** Each feature is an independent "bubble" (service)
- Bubbles communicate via message queue (async) or HTTP (sync with timeout)
- If one bubble crashes, others keep running
- Users don't notice. We get alerts. We fix it. We move on.

### The 9 Bubbles
1. **Auth Service** — Registration, login, JWT tokens
2. **Listing Service** — CRUD, photos, amenities, availability
3. **Booking Service** — Bookings, requests, check-in/out
4. **Payment Service** — Stripe Connect, payouts, refunds
5. **Pricing Service** — Pricing engine, suggestions, scraper
6. **Notification Service** — Emails, push, preferences
7. **Search Service** — Search, filters, autocomplete
8. **Review Service** — Reviews, ratings, double-blind
9. **Admin Service** — Dashboard, moderation, reporting

### Scaling Strategy (4 Tiers)
- **Tier 1 (Launch):** Single server, ~€80/month, 500 concurrent users
- **Tier 2 (Growth):** Load balancer + 2 API servers, ~€300/month, 3,000 concurrent
- **Tier 3 (Scale):** Kubernetes, ~€1,500/month, 30,000 concurrent
- **Tier 4 (Enterprise):** Multi-region, ~€5,000-10,000/month, 100,000+ concurrent

### Environment Strategy
- **Local:** Your laptop, SQLite, test keys
- **Development:** Shared dev DB, auto-deploy on push
- **Staging:** Copy of production, manual deploy, must match production exactly
- **Production:** Real DB, real Stripe keys, manual deploy with approval

### CI/CD Pipeline (5 Stages)
1. **Validate:** Lint, type check, unit tests, security scan (2-3 min)
2. **Build:** Compile TypeScript, bundle frontend, Docker images (2-3 min)
3. **Test:** Integration, API, E2E, performance (5-10 min)
4. **Deploy:** Deploy to target, run migrations, health checks (3-5 min)
5. **Monitor:** Error rate, performance, user behavior (ongoing)

### Fault Tolerance
- No single bubble crash takes down the whole platform
- Worst case: Payment crash only affects new bookings
- All other features continue working
- Recovery time: 1-2 minutes for any bubble

### Booking Variations
- **Instant Book (default):** Guest pays immediately, no host approval
- **Request to Book:** Guest sends request, host has 2 hours to accept/decline
- **Post-check-in rule:** Once guest checks in, nobody can cancel
- **Minimum hours:** Host sets per listing (1-8 hours), no forced minimums
- **Gap blocking:** Auto (block gaps < 1 hour) or Manual

### Database Updates
- Added `booking_requests` table for Request to Book flow
- Added `booking_mode`, `response_window_minutes`, `gap_blocking` to listings
- Added `service_health` table for monitoring
- Added `deployment_log` table for rollback and audit
- Total: 21 tables, 11 enums, 7 views, 57+ indexes

### Documentation Created
- `ARCHITECTURE.md` — Bubble design, communication rules, failure scenarios
- `SCALING.md` — 4-tier scaling strategy, database scaling, caching, rate limiting
- `ENVIRONMENTS.md` — Local/development/staging/production setup
- `CI_CD.md` — 5-stage pipeline, deployment process, rollback strategies

### Key Architectural Decisions
1. **Async by default** — Messages wait in queue if service is down
2. **Circuit breaker pattern** — Stop calling failing services after 5 failures
3. **Graceful degradation** — Users see helpful errors, never crashes
4. **Health checks everywhere** — Load balancer routes around failures
5. **Database isolation** — Each bubble owns its tables, no cross-bubble SQL
6. **Rate limiting** — Protect against abuse and accidental overload
7. **Backup strategy** — PostgreSQL every 6 hours, Redis every hour, S3 for uploads

---

## SESSION 6: Payment Flow, Full Todo List, Deployment Reality

### Payment Flow (Stripe Connect)
- Guest pays → Stripe takes 7% guest fee → holds host share in escrow → Host checks in → Stripe pays host (minus 3% host fee) → kicknap keeps ~10% total
- Host creates Stripe Connect account (one-time, 5 minutes)
- Guest never sees kicknap handling money (Stripe does everything)
- Security deposit: €50-100 pre-auth, released after 7 days

### What User Must Do Manually (I Can't Do)
- Create Stripe account (requires ID, bank account)
- Buy kicknap.com domain (~€10/year)
- Set up Zoho Mail (free)
- Create Instagram, TikTok, LinkedIn accounts
- Buy hosting (Railway/Vercel, ~€20/month)
- Set up Cloudflare (free)
- Deploy the website
- Approve production deploys
- Contact Dutch lawyer (later)
- Approve first 30 hosts manually
- File KvK taxes quarterly

### What Still Needs To Be Coded
**Frontend (25-35 days):** Search page, listing detail, booking flow, guest dashboard, host dashboard, listing creation form, authentication, profile pages, reviews, help center, notifications, mobile responsive
**Backend (20-28 days):** Auth service, listing service, booking service, payment service (Stripe Connect), pricing service wiring, notification service, search service, review service, admin service, rate limiting, health checks, error handling
**Infrastructure (5-7 days):** PostgreSQL setup, Redis setup, CI/CD pipeline, monitoring, SSL, Cloudflare, backups, load balancer
**Testing (16-19 days):** Unit tests, integration tests, E2E tests, performance testing, security testing, mobile testing
**Total: 66-89 days (~3 months full-time)**

### Deployment Workflow
- User creates accounts (Stripe, Railway, GitHub, domain)
- I write all the code
- User copies files, pushes to GitHub
- CI/CD auto-deploys
- When something breaks: User tells me error → I write fix → User replaces file → Push → Fixed
- User doesn't need to understand code, just replace files and push

### Honest Assessment
- What we've built so far: Complete business model, legal docs (27 files), architecture, schema, API design, pricing engine
- What's missing: Actual code (the website itself), user setting up accounts
- Timeline: 6-8 weeks for full website if we start coding now

---

## SESSIONS 7–11: Platform Build & Deployment (summary)

Between planning (Session 6) and today, the platform was actually coded and shipped. Key points:

- **Session 7 — Monorepo scaffold:** `kicknap/` monorepo (web + `services/`), Hono + Drizzle + Neon locked; Phase 1 endpoints for listings & availability.
- **Session 8 — Data layer:** per-service schema + seed script (node, not SQL), 12 demo spaces (ids 13–24), 84 opening-hour rows, demo booking (space 21, 2026-08-28 08:00–10:00Z, €15.60), bookings + identity services built, local full-stack verified.
- **Session 9 — Web app:** "Sector" landing page, EN/NL i18n via app router, search view + space cards, CORS enforcement, SEO + `/sitemap.xml` with `/[lang]` meta.
- **Session 10 — Migration + first prod deploy:** Next.js 16.3.3 port (breaking `lang()`/`cookies()`/`params` async APIs, `proxy.ts` middleware), all 4 original services + web deployed to Vercel production, kicknap.com domain attached.
- **Session 11 — Booking flow + payments + infra:** space detail page + booking widget (availability, price estimate, instant book), login/logout with httpOnly `kn_session`, My bookings (bookings service `guestEmail` filter), payments service scaffold (Stripe Connect intents/accounts, fee math 10%/3%, lazy guard), `scripts/deploy-prod.mjs` + `scripts/smoke-prod.mjs`, `API_ENDPOINTS.md` live URLs, drizzle-orm patched 0.44.0 → 0.45.2 across all 5 services (SQL-injection advisory).

---

## SESSION 12: Final Production Gates + Self-Service Registration

### Context
User returned wanting progress. The booking flow + payments scaffold + infra tooling were done but nothing was committed, production still ran the old drizzle, and registration didn't exist yet.

### Full check gate passed
- `npm run check` (root): dependency-cruiser 134 modules / 191 deps no violations; eslint clean; `next build` green with 16 routes + Proxy intact.

### Production deploy — two caught bugs
1. **UTF-8 BOM breakage:** the drizzle-orm bump had been written with PowerShell `Set-Content`, injecting a BOM into all 5 service `package.json`s → Vercel CLI failed every service deploy (`Unexpected token '﻿'`). Fixed with `[IO.File]::WriteAllText` + `UTF8Encoding($false)`; all 5 JSON re-validated; drizzle `^0.45.2` confirmed in each.
2. Redeployed listings → availability → bookings → identity → payments → web. All aliases live, web shows 19 routes (register included after).

### Smoke + audit
- `npm run smoke:prod` → **15 passed, 0 failed** (services health, 12 spaces, availability true, 1 booking, 401 unauthenticated, payments `stripeConfigured:false`, web page checks).
- `npm audit` → **0 vulnerabilities** post patch.

### Commit + push (first time for this code)
- `git` not on PATH → used `C:\Program Files\Git\cmd`. Staged everything; verified `.env.local`/`.vercel` correctly ignored in `services/payments` (its `.gitignore`).
- Commit `2d6f80c` "Booking flow end-to-end on web + payments service scaffold" (45 files, +2119/−246). Pushed `a4bdce4..2d6f80c` to `main`.

### Self-service registration (new feature)
- `web/src/app/api/auth/register/route.ts` — BFF POST → identity `/auth/register`, sets `kn_session` on 201.
- `web/src/components/register-form.tsx` — client form with inline error mapping (`invalid_email`, `weak_password`, `email_taken`, `missing_name`).
- `web/src/app/[lang]/register/page.tsx` + cross-links on login page (both directions) — login page now shows "No account yet? Create one", register shows "Already have an account? Log in".
- EN + NL dictionaries extended with 13 auth keys.
- Build green (19 routes incl. `/register` + `/api/auth/register`).

### Live verification (production)
Used the PowerShell curl **body-file** workaround (PS mangles inline JSON):
- Register `probe+register@kicknap.com` → **201** + `{user:{id:5}}`, session cookie set
- `/api/auth/me` → 200 with the new user
- Duplicate register → **409** `email_taken`
- Register page HTML → 200, "Create your account" + login cross-link present
- Probe cleanup → login 401 `invalid_credentials` after delete

### Database lesson surfaced
Services' local `.env` files point at a **localhost Postgres (dev only)** — the deployed services use the Neon `DATABASE_URL` from Vercel envs. My first cleanup attempt connected to localhost and deleted 0 rows; reran against the canonical Neon URL (`ep-purple-frog-b15k5ftd...neondb?sslmode=require`) → probe id 5 deleted, 2 demo users remain. **Any local script touching prod data must set `DATABASE_URL` explicitly to Neon.**

### Second commit + a fix
- A leftover temp file (`services/identity/.tmp-register-cleanup.mjs`) was accidentally staged → removed via `git rm --cached` + working-file deletion, then **amended** the unpublished commit.
- Commit `020c6fe` "Add self-service registration (guest accounts)" (6 files, +274/−2). Pushed `2d6f80c..020c6fe`.

### End state
- **Live:** register, login, space detail + booking widget, my bookings, search — all on www.kicknap.com, 15/15 smoke green, 0 vulnerabilities.
- **Parked for tomorrow:** payments on-ramp (needs user's Stripe keys in `payments` Vercel project), host path (Connect onboarding + dashboard + listing creation), search depth (availability-aware + hero search). Optional: git auto-deploy via dashboard.

---

*Last updated: August 2026*
