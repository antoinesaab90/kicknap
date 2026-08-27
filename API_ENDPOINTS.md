# kicknap API Endpoints
> REST API design for all backend routes.

---

## Authentication
All endpoints prefixed with `/api/v1`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Login (returns JWT) |
| POST | `/auth/refresh` | No | Refresh JWT token |
| POST | `/auth/logout` | Yes | Invalidate token |
| POST | `/auth/forgot-password` | No | Send reset email |
| POST | `/auth/reset-password` | No | Reset with token |
| POST | `/auth/verify-email` | No | Confirm email address |
| POST | `/auth/verify-phone` | No | Send SMS code |
| POST | `/auth/verify-phone/confirm` | Yes | Confirm SMS code |

---

## Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me` | Yes | Get current user profile |
| PATCH | `/users/me` | Yes | Update own profile |
| POST | `/users/me/avatar` | Yes | Upload profile photo |
| GET | `/users/:id` | Yes | Get public user profile |
| PATCH | `/users/me/password` | Yes | Change password |
| DELETE | `/users/me` | Yes | Delete own account (soft) |

### Identity Verification
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/me/verify` | Yes | Submit ID document |
| GET | `/users/me/verify` | Yes | Check verification status |

### Stripe Onboarding
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/me/stripe/connect` | Yes | Create Stripe Connect onboarding link |
| GET | `/users/me/stripe/status` | Yes | Check Stripe onboarding status |
| POST | `/users/me/stripe/payout` | Yes | Manual payout request |

---

## Listings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listings` | No | Search listings (with filters) |
| GET | `/listings/:id` | No | Get listing details |
| POST | `/listings` | Host | Create new listing |
| PATCH | `/listings/:id` | Host | Update listing |
| DELETE | `/listings/:id` | Host | Soft-delete listing |
| PATCH | `/listings/:id/status` | Host | Publish/pause listing |

### Search Filters
| Filter | Type | Description |
|--------|------|-------------|
| `booking_mode` | string | `instant`, `request`, or `all` (default) |
| `min_hours` | number | Minimum booking duration |
| `max_price` | number | Max price per hour |
| `neighborhood` | string | Amsterdam neighborhood |
| `space_type` | string | bedroom, office, studio, apartment |

**Example:** `GET /listings?booking_mode=instant&neighborhood=Centrum&max_price=20`

### Listing Media
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/listings/:id/photos` | Host | Upload photo |
| DELETE | `/listings/:id/photos/:photoId` | Host | Remove photo |
| PATCH | `/listings/:id/photos/reorder` | Host | Reorder photos |

### Listing Amenities
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/listings/:id/amenities` | Host | Replace all amenities |
| GET | `/listings/:id/amenities` | No | Get listing amenities |

### Listing Safety Declarations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/listings/:id/safety` | Host | Replace safety declarations |
| GET | `/listings/:id/safety` | No | Get safety declarations |

### Listing Availability
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listings/:id/availability` | No | Get available time slots |
| PUT | `/listings/:id/availability` | Host | Set recurring availability |
| POST | `/listings/:id/availability/block` | Host | Block specific dates |
| DELETE | `/listings/:id/availability/block/:blockId` | Host | Remove date block |

### Listing Booking Settings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listings/:id/booking-settings` | Host | Get booking mode, min hours, gap blocking |
| PATCH | `/listings/:id/booking-settings` | Host | Update booking mode, min hours, response window, gap blocking |

**Request body for PATCH:**
```json
{
    "booking_mode": "instant",
    "min_hours": 2,
    "response_window_minutes": 120,
    "gap_blocking": "auto"
}
```

**Response:**
```json
{
    "booking_mode": "instant",
    "min_hours": 2,
    "max_hours": 24,
    "response_window_minutes": 120,
    "gap_blocking": "auto"
}
```

### Listing Reviews
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listings/:id/reviews` | No | Get reviews for listing |

---

## Bookings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/bookings` | Guest | Create booking (validates availability, creates payment intent) |
| GET | `/bookings/:id` | Guest/Host | Get booking details |
| PATCH | `/bookings/:id/cancel` | Guest/Host | Cancel booking |
| POST | `/bookings/:id/check-in` | Guest | Mark as checked in |
| POST | `/bookings/:id/check-out` | Guest | Mark as checked out |

### Guest Bookings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/bookings/guest` | Guest | List own bookings (upcoming, past) |
| GET | `/bookings/guest/upcoming` | Guest | Upcoming bookings |
| GET | `/bookings/guest/past` | Guest | Past bookings |

### Host Bookings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/bookings/host` | Host | List bookings for own listings |
| GET | `/bookings/host/upcoming` | Host | Upcoming bookings |
| GET | `/bookings/host/past` | Host | Past bookings |
| GET | `/bookings/host/pending` | Host | Pending bookings awaiting response |

### Booking Requests (Request to Book mode)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/booking-requests` | Guest | Send booking request to host |
| GET | `/booking-requests/:id` | Guest/Host | Get request details |
| PATCH | `/booking-requests/:id/accept` | Host | Accept request (creates booking + charges guest) |
| PATCH | `/booking-requests/:id/decline` | Host | Decline request (guest not charged) |
| GET | `/booking-requests/guest` | Guest | List own requests (pending, accepted, declined) |
| GET | `/booking-requests/host` | Host | List requests for own listings |
| GET | `/booking-requests/host/pending` | Host | Pending requests awaiting response |

### Availability Check (before booking)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/listings/:id/check-availability` | No | Check if time slot is available, return price breakdown |

---

## Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/payments/:bookingId` | Guest/Host | Get payment details for booking |
| POST | `/payments/:bookingId/refund` | Host/Guest | Request refund |
| GET | `/payments/earnings` | Host | Get earnings summary |
| GET | `/payments/earnings/history` | Host | Payout history |
| GET | `/payments/history` | Guest | Payment history |

---

## Reviews
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/reviews` | Guest/Host | Submit review (after booking completes) |
| GET | `/reviews/mine` | Yes | Get own reviews |
| GET | `/reviews/pending` | Yes | Check if review is pending |

---

## Messages
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/messages` | Yes | List conversations |
| GET | `/messages/:userId` | Yes | Get conversation with user |
| POST | `/messages` | Yes | Send message |
| PATCH | `/messages/:id/read` | Yes | Mark as read |
| GET | `/messages/unread/count` | Yes | Get unread count |

---

## Damage Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/damage-reports` | Host | File damage report |
| GET | `/damage-reports/:id` | Guest/Host | Get report details |
| PATCH | `/damage-reports/:id/respond` | Guest | Respond to report |
| PATCH | `/damage-reports/:id/resolve` | Host | Mark as resolved |
| POST | `/damage-reports/:id/photos` | Host | Upload evidence photos |

---

## Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Yes | List notifications |
| GET | `/notifications/unread/count` | Yes | Unread count |
| PATCH | `/notifications/:id/read` | Yes | Mark as read |
| PATCH | `/notifications/read-all` | Yes | Mark all as read |

---

## Cron Jobs (Background Tasks)
| Job | Frequency | Description |
|-----|-----------|-------------|
| `auto-decline-expired-requests` | Every 5 minutes | Decline booking requests where `expires_at` has passed and status is still `pending` |
| `update-pricing` | Every 6 hours | Run pricing engine, update suggested prices, send notifications |
| `release-security-deposits` | Daily | Release security deposits after 7 days if no damage reported |
| `process-payouts` | Daily | Trigger Stripe payouts for completed bookings |
| `send-daily-earnings-summary` | Daily 8am | Send hosts their daily earnings summary email |

---

## Admin (internal, later)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | Admin | List all users |
| GET | `/admin/listings` | Admin | List all listings |
| GET | `/admin/bookings` | Admin | List all bookings |
| GET | `/admin/revenue` | Admin | Revenue dashboard |
| PATCH | `/admin/users/:id/ban` | Admin | Ban user |
| PATCH | `/admin/listings/:id/remove` | Admin | Remove listing |

---

## Search
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/search` | No | Full-text search (listings + users) |
| GET | `/search/suggestions` | No | Autocomplete suggestions |

### Search Query Parameters
```
GET /api/v1/listings?city=Amsterdam&space_type=bedroom&min_price=10&max_price=30&amenities=wifi,shower&start_time=2026-08-26T10:00:00Z&end_time=2026-08-26T14:00:00Z&max_guests=2&sort=price_asc&page=1&limit=20
```

---

## Response Formats

### Success
```json
{
  "status": "success",
  "data": { ... }
}
```

### Paginated
```json
{
  "status": "success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "total_pages": 8
  }
}
```

### Error
```json
{
  "status": "error",
  "error": {
    "code": "LISTING_NOT_AVAILABLE",
    "message": "This time slot is not available",
    "details": { ... }
  }
}
```

---

## Rate Limits
| Tier | Requests/min | Description |
|------|-------------|-------------|
| Anonymous | 60 | Unauthenticated users |
| Authenticated | 120 | Logged-in users |
| Host | 200 | Host actions (listing management) |
| Admin | 500 | Internal operations |

---

---

## Implemented (microservices, one database `neondb`, one schema per service)
> The design above is the roadmap. These endpoints are live across the running services.

| Service | Live URL | Health | Endpoints |
|---------|----------|--------|-----------|
| `listings` | `https://listings-hazel.vercel.app` | `GET /health` | `GET /api/v1/spaces` (`?area&max&sort`), `GET /api/v1/spaces/:id` |
| `availability` | `https://availability-xi.vercel.app` | `GET /health` | `GET /api/v1/check?spaceId&from&to`, `GET /api/v1/spaces/:id/day?date` |
| `bookings` | `https://bookings-sable-nine.vercel.app` | `GET /health` | `POST /api/v1/bookings`, `GET /api/v1/bookings` (`?spaceId&from&to&guestEmail`), `GET /api/v1/bookings/:id` |
| `identity` | `https://identity-wheat-ten.vercel.app` | `GET /health` | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me` (Bearer) |
| `payments` | `https://payments-olive.vercel.app` | `GET /health` (reports `stripeConfigured`) | `POST /api/v1/payments/intents` (503 `stripe_not_configured` until keys set), `GET /api/v1/payments/bookings/:bookingId`, `POST /api/v1/payments/accounts` |
| `web` | `https://www.kicknap.com` | — | Frontend + BFF route handlers under `/api/*` |

### Web BFF endpoints (implemented)
| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Proxies identity login, sets httpOnly `kn_session` + `kn_user` cookies |
| `GET /api/auth/me` | Returns session user from cookie (validates via identity) |
| `GET/POST /api/auth/logout` | Clears session cookies (GET redirects to `?next=`) |
| `GET /api/availability?spaceId&from&to` | Proxies availability check to the availability service |
| `GET/POST /api/bookings` | Requires session; POSTs booking with the guest's identity, GET lists the session user's bookings (guestEmail filter) |

### Bookings service contract (implemented)
- `POST /api/v1/bookings` body: `{ spaceId, from, to, guestEmail?, guestName? }` (ISO 8601 UTC).
  Validates via listings (exists, min/max hours) then availability (opening hours) then own slot-conflict check.
- Errors (HTTP): `400 invalid_spaceId | missing_from_or_to | invalid_range | invalid_body`, `404 space_not_found | booking_not_found`, `409 slot_conflict | shorter_than_min | longer_than_max | outside_opening_hours | no_opening_hours | availability_service_error_<n>`.
- `priceCents` = `round(durationMinutes / 60 × hourlyPriceCents)`; currency `EUR`.
- Boundary rule: `availability` stays pure opening-hours; collision detection lives in `bookings` (its own table).
- Demo data: one honest seed booking per `db:seed` — tomorrow 08:00–10:00Z on the first space, only if the availability check says open.

*Last updated: August 2026*
