# kicknap — Guest & Host Journey Map

Two-sided flow for the live product (web + iOS/Android app), mapped to the services each step calls. Pricing model: single embedded 16% marketplace fee — the host sets the price they receive (`hourlyPriceCents`), the guest pays one all-in price of `base ÷ 0.84` (fees & taxes included in the displayed total).

## Guest journey

```mermaid
flowchart TD
  G1[Guest opens kicknap] --> G2{Web or app?}
  G2 -->|Web| G3[Search /en/search]
  G2 -->|App| G3
  G3 --> G4[Browse space cards]
  G4 --> G5[Open a space detail]
  G5 --> G6{Listing type}
  G6 -->|Fixed session| G7[One fixed time window shown per free slot]
  G6 -->|Flexible| G8[Pick start + end chips from free windows]
  G7 --> G9[Calendar: available / booked / closed days]
  G8 --> G9
  G9 --> G10{Logged in?}
  G10 -->|No| G11[Log in / register]
  G11 --> G10
  G10 -->|Yes| G12[Book now]
  G12 --> G13{Slot still free?}
  G13 -->|No - 409 slot conflict| G7
  G13 -->|Yes| G14[Booking confirmed instantly]
  G14 --> G15[Pay now - Stripe hosted checkout]
  G15 --> G16[Payment success]
  G16 --> G17[Receipt + booking details /en/bookings]
  G17 --> G18[Check in at the space]
  G18 --> G19[Optional review]
```

Step → API mapping (guest):

| Step | Service call |
| --- | --- |
| Search / browse | `GET /api/v1/spaces` (listings) |
| Space detail | `GET /api/v1/spaces/:id` (listings) |
| Calendar state | `GET /api/v1/spaces/:id/hours` (availability) + `GET /api/v1/bookings?spaceId=&from=&to` (bookings) — proxied from web as `/api/spaces/[id]/hours` and `/api/spaces/[id]/bookings` |
| Booking creation | `POST /api/v1/bookings` (bookings) — server re-checks slot; returns `409 slot_conflict` if taken |
| Auth | identity (register / login / session cookie) |
| Payment | `POST /api/v1/checkout/sessions` (payments) → Stripe hosted checkout → webhook |
| Bookings list | `GET /api/v1/bookings?guestId=` (bookings) |

## Host journey

```mermaid
flowchart TD
  H1[Host registers] --> H2[Host dashboard]
  H2 --> H3[List a space]
  H3 --> H4{Offer type?}
  H4 -->|Fixed session| H5[Set fixed duration + start window]
  H4 -->|Flexible| H6[Set min/max stay + opening hours]
  H5 --> H7[Set hourly price]
  H6 --> H7
  H7 --> H8[Space live on /en/search]
  H8 --> H9[Guest books]
  H9 --> H10[Booking confirmation email]
  H10 --> H11[Host payout - Stripe]
```

Step → API mapping (host):

| Step | Service call |
| --- | --- |
| Register / login | identity |
| List space | `POST /api/v1/spaces` (listing) + rules via availability |
| Availability | `PUT /availability` rules (availability) |
| Pricing | `hourlyPriceCents` on the space + fee model in `computeFees` (payments) |
| Bookings | view in host dashboard via `GET /api/v1/bookings?hostId=` |
| Payout | Stripe host payout (test mode until live keys configured) |

## Payment flow

```mermaid
sequenceDiagram
  participant G as Guest
  participant B as Bookings
  participant P as Payments
  participant S as Stripe
  G->>B: POST /bookings (create, unpaid)
  B-->>G: booking {id, total}
  G->>P: POST /checkout/sessions {bookingId}
  P-->>G: checkout session URL
  G->>S: Stripe hosted checkout (card 4242)
  S-->>P: webhook checkoutevent
  P->>B: mark booking paid
  P-->>G: success redirect /en/bookings
```

## Notes / current limits

- Availability is computed from opening-hour rules only; the whole free window + min/max logic lives in `availability` (POST conflict re-check is the source of truth).
- Booking emails are silent until `EMAIL_SMTP_*` + `EMAIL_FROM` are set; Stripe is test mode until live keys configured.
- Demo spaces: 14 = fixed 3h session 13:00–16:00 (Mon–Fri), 22 = fixed 4h 09:00–13:00 (has a booking → shows strikethrough), 13 = flexible 1–8h.