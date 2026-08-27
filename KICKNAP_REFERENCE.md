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
- **Web:** React / Next.js
- **App later:** React Native
- **API:** Node.js or Python
- **Database:** PostgreSQL
- **Payments:** Stripe Connect
- **Hosting:** Railway / Vercel
- **CDN:** Cloudflare
- **Email:** Zoho Mail (free tier, pending setup)

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

---
*Last updated: August 2026*
