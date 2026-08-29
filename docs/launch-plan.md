# kicknap — NL-Wide Launch Plan

## Context

The stack already runs nationwide: the listings service has no geo-gating, search + map return all published spaces, booking, payments and availability all work end-to-end. The constraint is **per-city liquidity** (enough space + enough bookings in one place to make the market useful), not national coverage.

Strategy: **ship the software nationally, seed the market city-by-city.** Density beats footprint for a two-sided marketplace.

## Volume model

Single embedded 16% fee: the host sets what they receive, the guest pays one all-in price (`base ÷ 0.84`), fee = total − base. Contribution = fee minus payment processing (~1.5% + €0.25 per Stripe transaction).

| Price point (host receive / hr) | Guest pays (/ hr) | Fee (/ hr) | Net contribution, 3h session |
| --- | --- | --- | --- |
| €10 / hr | €11.90 | €1.90 | ~€5.10 |
| €12.50 / hr | €14.88 | €2.38 | ~€6.33 |
| €20 / hr | €23.81 | €3.81 | ~€10.20 |

Model targets (assumes ~€12.50/hr average, ~3-4h average booking, ~€6/sec/hour blended):

| Milestone | Paid hours / yr | Bookings / day | What it takes |
| --- | --- | --- | --- |
| €1,000 / month | ~60k | ~45 | One city working (Amsterdam size) |
| €10,000 / month | ~600k | ~450 | 3-5 seeded cities |
| €1M / yr | ~6M | ~450/day sustained | National scale, all five waves live |

These are planning assumptions, not forecasts — sanity-check against real per-booking averages after the first seeded city books 500 sessions.

## First wave: five cities

1. **Amsterdam** — operational now (12 demo/live spaces, heaviest supply).
2. **Rotterdam** — next; business + meeting-room demand, cheaper space.
3. **Utrecht** — high student + remote-worker density, central.
4. **Den Haag** — government + business district demand.
5. **Eindhoven** — tech/offsite demand, second-largest population in the wave.

Skip villages and small towns in the first wave: demand is too thin and travel time per booking is high.

## Per-city playbook

Order matters — supply before demand, so every visitor finds a bookable space.

1. **Supply (recruit + onboard hosts):** get 15-25 published, kept-open spaces per city before pushing guests there. Each host: register → list space (`/host/new`) → set their receive price → publish. Prefer hosts who can keep weekday core hours on their calendar.
2. **Availability coverage:** monitor the open-hours share per published space; coach hosts to keep flexible multi-hour windows open on core days so guests can actually book.
3. **Demand:** once supply is dense enough, drive booking volume per city (local outreach, communities, referral). Measure per-city conversion before scaling the next city.
4. **Measure per city:** published spaces, open-hours/wk, 4-week bookings, booking value, repeat guests, city contribution.

## Product gaps to unlock the orderly launch (tracked, not blocking)

- Per-city landing/copy and search segment toggle (cosmetic; national search still works today).
- Host onboarding automation + referral loop (nice-to-have for scale).
- Search radius/segment to bias a city without hard-gating (remove once density is national).

## Sequence & milestones

| Phase | What | Define | Exit |
| --- | --- | --- | --- |
| 0 | Product live, 16% pricing verified end-to-end | done — smoke 17/17 | — |
| 1 | Amsterdam seed + host dashboard clarity | done | Amsterdam books its first real (non-demo) sessions |
| 2 | Rotterdam + Utrecht + Den Haag supply | in progress | 15+ published per city |
| 3 | Eindhoven + nationwide demand push | next | first city reaches liquidity checkpoint |
| 4 | NL-wide promote | after liquidity checkpoint | present to broader NL audience |

**Pre-scaling unlocks (before Phase 3):** booking confirmation emails (needs Zoho SMTP credentials) and Stripe live mode (needs live keys + webhook). These block everything that touches guest trust and real payouts.