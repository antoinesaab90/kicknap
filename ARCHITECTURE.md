# kicknap — Production Architecture

## The Bubble Principle

Every feature is a **bubble** (independent service). Bubbles communicate through
**lines** (message queue or HTTP). If one bubble crashes, the others keep running.
Users don't notice. We get an alert. We fix it. We move on.

```
                    ┌─────────────────────────────────────────────┐
                    │              LOAD BALANCER                   │
                    │         (routes traffic, health checks)     │
                    └─────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                   │
                    ▼                 ▼                   ▼
            ┌──────────┐      ┌──────────┐        ┌──────────┐
            │ API #1   │      │ API #2   │        │ API #3   │
            │ (all     │      │ (all     │        │ (all     │
            │ services)│      │ services)│        │ services)│
            └────┬─────┘      └────┬─────┘        └────┬─────┘
                 │                  │                    │
                 └──────────────────┼────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │                │
                    ▼               ▼                ▼
            ┌──────────┐   ┌──────────┐     ┌──────────┐
            │  Redis   │   │ Postgres │     │  Stripe  │
            │ (cache + │   │ (primary │     │ (external│
            │  queue)  │   │ + read   │     │  service)│
            └──────────┘   │ replica) │     └──────────┘
                           └──────────┘
```

---

## The 9 Bubbles (Services)

Each bubble is a **logical service**. In Phase 1, they run in one server
(together). In Phase 2+, they can be split into separate containers.

**The rule:** Each bubble must be able to fail independently without crashing others.

---

### Bubble 1: Auth Service
**Responsibility:** User registration, login, JWT tokens, session management.

| Component | Details |
|-----------|---------|
| Endpoints | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh` |
| Database | `users` table |
| Dependencies | None (isolated) |
| If it crashes | Users can't log in. Browsing works. Bookings work if user is already authenticated. |
| Recovery | Restart service. Users re-login if session expired. |

---

### Bubble 2: Listing Service
**Responsibility:** CRUD for listings, photos, amenities, availability, safety declarations.

| Component | Details |
|-----------|---------|
| Endpoints | `GET/POST/PATCH/DELETE /listings`, availability, photos, amenities |
| Database | `listings`, `listing_photos`, `listing_amenities`, `listing_availability`, `listing_safety` |
| Dependencies | Auth Service (for host identity) |
| If it crashes | New listings can't be created. Existing listings still visible (cached). |
| Recovery | Restart service. No data loss. |

---

### Bubble 3: Booking Service
**Responsibility:** Bookings, booking requests, check-in/out, cancellation logic.

| Component | Details |
|-----------|---------|
| Endpoints | `POST /bookings`, `POST /booking-requests`, check-in/out, cancellation |
| Database | `bookings`, `booking_requests` |
| Dependencies | Auth Service, Listing Service (for availability check), Payment Service (for charging) |
| If it crashes | Existing bookings unaffected. New bookings fail gracefully (guest sees error, retries). |
| Recovery | Restart service. Pending requests auto-decline after timeout. |

---

### Bubble 4: Payment Service
**Responsibility:** Stripe Connect integration, charging guests, paying hosts, security deposits, refunds.

| Component | Details |
|-----------|---------|
| Endpoints | Payment processing (internal), payout triggers, refund processing |
| Database | `payments` table |
| Dependencies | Stripe API (external) |
| If it crashes | Existing bookings unaffected. New payments fail (guest sees error). Host payouts delayed. |
| Recovery | Restart service. Stripe retries failed webhooks. No money lost. |

**Critical rule:** This bubble NEVER crashes the booking bubble. If payment fails,
booking stays in "pending" state. Guest retries payment. No data corruption.

---

### Bubble 5: Pricing Service
**Responsibility:** Pricing engine, suggested prices, pricing advisor, Airbnb scraper.

| Component | Details |
|-----------|---------|
| Endpoints | `POST /pricing/advise`, `POST /pricing/tiers`, background scraping |
| Database | `pricing_history` table |
| Dependencies | None (standalone) |
| If it crashes | Hosts set prices manually. No pricing suggestions. Everything else works. |
| Recovery | Restart service. Scraping resumes. Suggested prices recalculated. |

---

### Bubble 6: Notification Service
**Responsibility:** Email notifications, push notifications, notification preferences.

| Component | Details |
|-----------|---------|
| Endpoints | `GET/PATCH /users/me/notifications/preferences` |
| Database | `notification_preferences` table |
| Dependencies | Email provider (Zoho/SendGrid), push provider (Firebase) |
| If it crashes | Emails delayed. Push notifications fail. Everything else works. |
| Recovery | Restart service. Queued notifications send in order. |

**Critical rule:** Notifications are **async**. They go into a queue. If the
notification bubble is down, messages wait in queue. When it comes back, they
all send. No notification is ever lost.

---

### Bubble 7: Search Service
**Responsibility:** Listing search, filters, autocomplete, geolocation.

| Component | Details |
|-----------|---------|
| Endpoints | `GET /search`, `GET /search/suggestions` |
| Database | Read from `listings` table (read replica or cache) |
| Dependencies | Redis (for caching search results) |
| If it crashes | Search fails. Direct listing URLs still work. |
| Recovery | Restart service. Cache rebuilds on first query. |

---

### Bubble 8: Review Service
**Responsibility:** Reviews, ratings, double-blind mechanics.

| Component | Details |
|-----------|---------|
| Endpoints | `POST /reviews`, `GET /reviews`, rating updates |
| Database | `reviews` table |
| Dependencies | Auth Service, Booking Service (for booking verification) |
| If it crashes | Reviews can't be submitted. Existing reviews visible. |
| Recovery | Restart service. No data loss. |

---

### Bubble 9: Admin Service
**Responsibility:** Admin dashboard, user management, listing moderation, revenue reporting.

| Component | Details |
|-----------|---------|
| Endpoints | Admin-only endpoints (internal, protected) |
| Database | Reads from all tables |
| Dependencies | All other services (read-only) |
| If it crashes | Admin can't access dashboard. All user-facing features work. |
| Recovery | Restart service. No impact on users. |

---

## Bubble Communication Rules

### Rule 1: Async by Default
Bubbles communicate through **message queue** (Redis/BullMQ) whenever possible.
This means if one bubble is down, messages wait in queue.

```
Booking Bubble → [Message Queue] → Payment Bubble
                                    (waits if Payment is down)
```

### Rule 2: Sync Only When Necessary
Some operations need immediate response (e.g., checking availability before booking).
These use **HTTP calls** with **timeout + fallback**.

```
Booking Bubble → [HTTP] → Listing Bubble (check availability)
                           Timeout: 3 seconds
                           Fallback: "Unable to check availability. Please try again."
```

### Rule 3: Never Block the User
If a bubble is slow or down, the user sees a **graceful error**, not a crash.

```javascript
// BAD: Blocks everything
const listing = await listingService.get(id); // hangs for 30 seconds

// GOOD: Timeout + fallback
const listing = await Promise.race([
    listingService.get(id),
    timeout(3000, null)  // fallback to null after 3 seconds
]);
if (!listing) {
    return res.status(503).json({ error: "Service temporarily unavailable" });
}
```

### Rule 4: Circuit Breaker Pattern
If a bubble fails 5 times in a row, **stop calling it** for 30 seconds.
This prevents cascade failures.

```
Booking Bubble calls Payment Bubble
    → Payment fails 5 times
    → Circuit breaker OPENS (stops calling Payment)
    → After 30 seconds, circuit breaker HALF-OPEN (tries one request)
    → If success, circuit breaker CLOSES (resume normal calls)
    → If failure, circuit breaker OPENS again
```

---

## Database Isolation

Each bubble owns its tables. No bubble can directly query another bubble's tables.

```
Auth Service     → users table
Listing Service  → listings, listing_photos, listing_amenities, listing_availability, listing_safety
Booking Service  → bookings, booking_requests
Payment Service  → payments
Pricing Service  → pricing_history
Notification Service → notification_preferences
Review Service   → reviews
```

**Cross-bubble data access:** Through API calls or message queue, never direct SQL.

---

## Health Checks

Every bubble exposes a health check endpoint:

```
GET /health/auth     → { "status": "ok", "latency": "12ms" }
GET /health/listing  → { "status": "ok", "latency": "8ms" }
GET /health/booking  → { "status": "ok", "latency": "15ms" }
GET /health/payment  → { "status": "ok", "latency": "22ms" }
GET /health/pricing  → { "status": "ok", "latency": "5ms" }
GET /health/notification → { "status": "ok", "latency": "3ms" }
GET /health/search   → { "status": "ok", "latency": "10ms" }
GET /health/review   → { "status": "ok", "latency": "7ms" }
GET /health/admin    → { "status": "ok", "latency": "4ms" }
```

Load balancer checks health every 10 seconds. If a bubble is down, traffic
routes to healthy servers only.

---

## What Happens When Each Bubble Crashes

| Bubble Crashes | User Impact | Severity | Recovery Time |
|----------------|-------------|----------|---------------|
| Auth | Can't log in. Existing sessions work. | High | 1-2 minutes |
| Listing | Can't create/edit listings. Browsing works. | Medium | 1-2 minutes |
| Booking | Can't make new bookings. Existing bookings safe. | High | 1-2 minutes |
| Payment | Can't process payments. Bookings pending. | Critical | 1-2 minutes |
| Pricing | No pricing suggestions. Manual pricing works. | Low | 1-2 minutes |
| Notification | Emails/push delayed. Everything else works. | Low | 1-2 minutes |
| Search | Search fails. Direct URLs work. | Medium | 1-2 minutes |
| Review | Can't submit reviews. Existing reviews visible. | Low | 1-2 minutes |
| Admin | Admin dashboard down. Users unaffected. | Low | 1-2 minutes |

**Key insight:** No single bubble crash takes down the whole platform.
The worst case (Payment crash) only affects new bookings — existing bookings
and all other features continue working.

---

## Failure Scenarios — Full Walkthrough

### Scenario 1: Stripe is down
```
Guest tries to book → Booking Service creates pending booking
    → Payment Service tries to charge → Stripe returns error
    → Payment Service logs error, sends alert
    → Guest sees: "Payment temporarily unavailable. Please try again in a few minutes."
    → Booking stays in "pending" state
    → When Stripe comes back, guest retries → success
    → No data lost. No crash.
```

### Scenario 2: Database is slow (high load)
```
Guest searches listings → Search Service checks Redis cache
    → Cache HIT → returns cached results (fast)
    → Cache MISS → queries read replica (not primary)
    → Primary handles only writes (booking confirmations, payment updates)
    → If read replica is slow → Search Service returns "Search is slow. Showing cached results."
    → Users see slightly stale data but site works.
```

### Scenario 3: Notification Service crashes during booking
```
Guest books → Booking Service confirms → Payment Service charges
    → Notification Service is DOWN
    → Booking confirmation email goes to MESSAGE QUEUE
    → When Notification Service restarts, email sends automatically
    → Guest eventually gets confirmation email (delayed by minutes)
    → Booking itself was never at risk.
```

### Scenario 4: Pricing Service crashes while host is setting price
```
Host opens listing form → Pricing Advisor is DOWN
    → Frontend shows: "Pricing suggestions unavailable. Set your own price."
    → Host types price manually → saves listing
    → When Pricing Service restarts, suggested prices recalculate
    → Host can update price later if they want.
```

---

## Phase 1 vs Phase 2 Architecture

### Phase 1 (Launch — Amsterdam Pilot)
All bubbles run in **one server** (monolith with logical separation).

```
┌─────────────────────────────────────┐
│         SINGLE SERVER               │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │Auth │ │List │ │Book │ │Pay  │  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │Price│ │Notif│ │Search│ │Review│  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│  ┌─────┐                           │
│  │Admin│                           │
│  └─────┘                           │
└─────────────────────────────────────┘
        │
   ┌────┴────┐
   │PostgreSQL│
   │ + Redis  │
   └─────────┘
```

**Cost:** ~€50-100/month
**Users:** 100-1,000 concurrent
**Failure mode:** Server crash = everything down (but fast recovery)

### Phase 2 (Growth — Multiple Cities)
Each bubble runs in its **own container** (Docker/Kubernetes).

```
┌─────────────────────────────────────────────────┐
│                 LOAD BALANCER                    │
└─────────────────────────────────────────────────┘
        │              │              │
   ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
   │ API #1  │   │ API #2  │   │ API #3  │
   └────┬────┘   └────┬────┘   └────┬────┘
        │              │              │
   ┌────┴──────────────┴──────────────┴────┐
   │            MESSAGE QUEUE               │
   └────┬──────┬──────┬──────┬──────┬──────┘
        │      │      │      │      │
   ┌────┴──┐┌──┴───┐┌─┴────┐┌┴─────┐┌┴──────┐
   │ Auth  ││List  ││Book  ││Pay   ││Notif  │
   │Service││Serv. ││Serv. ││Serv. ││Serv.  │
   └───────┘└──────┘└──────┘└──────┘└───────┘
        │
   ┌────┴────────────────────┐
   │ PostgreSQL (primary +   │
   │ read replica) + Redis   │
   │ cluster                 │
   └─────────────────────────┘
```

**Cost:** ~€200-500/month
**Users:** 1,000-100,000 concurrent
**Failure mode:** Individual bubble crashes don't affect others

### Phase 3 (Scale — National/International)
Full microservice architecture with Kubernetes, auto-scaling, multi-region.

**Cost:** ~€1,000-5,000/month
**Users:** 100,000+ concurrent
**Failure mode:** Any component can fail without user impact

---

## Monitoring & Alerting

### What We Monitor
| Metric | Threshold | Alert |
|--------|-----------|-------|
| API response time | > 2 seconds | Warning |
| API response time | > 5 seconds | Critical |
| Error rate | > 1% of requests | Warning |
| Error rate | > 5% of requests | Critical |
| Database connections | > 80% capacity | Warning |
| Database connections | > 95% capacity | Critical |
| Memory usage | > 80% | Warning |
| Memory usage | > 95% | Critical |
| Disk usage | > 80% | Warning |
| Stripe webhook failures | Any | Critical |
| Queue depth | > 1000 messages | Warning |
| Queue depth | > 10,000 messages | Critical |

### Alert Channels
| Severity | Channel | Response Time |
|----------|---------|---------------|
| Critical | SMS + Email + Slack | Immediate |
| Warning | Email + Slack | Within 1 hour |
| Info | Slack only | Next business day |

### Tools
| Tool | Purpose | Cost |
|------|---------|------|
| Uptime Robot | External uptime monitoring | Free (50 monitors) |
| Sentry | Error tracking & logging | Free tier |
| Prometheus + Grafana | Metrics & dashboards | Free (self-hosted) |
| PagerDuty | On-call alerting | Free tier |

---

## Summary: The 5 Rules of kicknap Architecture

1. **Bubbles are independent.** One crash doesn't cascade.
2. **Async by default.** Messages wait in queue if a service is down.
3. **Graceful degradation.** Users see helpful errors, never crashes.
4. **Health checks everywhere.** Load balancer routes around failures.
5. **Alert fast, fix fast.** We know about problems before users do.
