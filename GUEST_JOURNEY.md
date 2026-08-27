# kicknap — Guest 3-Step Journey
> Screen-by-screen design for the core booking flow.

---

## Step 1: SEARCH

### Screen 1.1 — Home / Landing
```
┌─────────────────────────────────┐
│  kicknap                        │
│                                 │
│  Where do you need              │
│  a space?                       │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📍 Amsterdam, Netherlands│   │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🕐 When?                │    │
│  │ Today, 2:00 PM – 5:00 PM│   │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 👤 1 guest              │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │      Search spaces       │   │
│  └─────────────────────────┘    │
│                                 │
│  ── Or browse by type ────────  │
│  [🛏 Bedroom] [💼 Office]       │
│  [🛋 Living room] [ other ]     │
│                                 │
└─────────────────────────────────┘
```

### Screen 1.2 — Time Picker (tap "When?")
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  When do you need the space?    │
│                                 │
│  ┌─────────────────────────┐    │
│  │     August 2026          │   │
│  │  Mo Tu We Th Fr Sa Su   │   │
│  │              1  2  3    │   │
│  │  4  5  6  7  8  9 10   │   │
│  │ 11 12 13 14 15 16 17   │   │
│  │ 18 19 20 21 22 23 24   │   │
│  │ 25 [26] 27 28 29 30 31 │   │
│  └─────────────────────────┘    │
│                                 │
│  Start time                     │
│  [08:00] [09:00] [10:00] [11:00]│
│  [12:00] [13:00] [14:00✓] [15:00]│
│                                 │
│  Duration                       │
│  [1h] [2h] [3h✓] [4h] [½ day]  │
│  [Full day]                     │
│                                 │
│  End time: 5:00 PM (calculated) │
│                                 │
│  ┌─────────────────────────┐    │
│  │      Show spaces         │   │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### Screen 1.3 — Search Results (Map View)
```
┌─────────────────────────────────┐
│  ← Back    Amsterdam    🔍 ⚙   │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │    📍  €13/h            │    │
│  │                         │    │
│  │         📍 €11/h        │    │
│  │                         │    │
│  │  📍 €15/h               │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  ── 12 spaces available ──────  │
│                                 │
│  ┌────┬────────────────────┐   │
│  │ 📷 │ Cozy Studio        │   │
│  │    │ ★ 4.8 (23) · 1.2km│   │
│  │    │ €13/h · 3h min     │   │
│  └────┴────────────────────┘   │
│  ┌────┬────────────────────┐   │
│  │ 📷 │ Quiet Bedroom      │   │
│  │    │ ★ 4.9 (41) · 0.8km│   │
│  │    │ €15/h · 2h min     │   │
│  └────┴────────────────────┘   │
│  ┌────┬────────────────────┐   │
│  │ 📷 │ Modern Office      │   │
│  │    │ ★ 4.7 (12) · 2.1km│   │
│  │    │ €11/h · 1h min     │   │
│  └────┴────────────────────┘   │
│                                 │
│  ┌──────────┐ ┌──────────┐     │
│  │ 🗺 Map   │ │ 📋 List  │     │
│  └──────────┘ └──────────┘     │
└─────────────────────────────────┘
```

### Screen 1.4 — Listing Detail (tap a listing)
```
┌─────────────────────────────────┐
│  ← Back                    ♡    │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │      [Primary Photo]    │    │
│  │                         │    │
│  │  ● ○ ○ ○ ○  (5 photos) │    │
│  └─────────────────────────┘    │
│                                 │
│  Cozy Studio near Centraal     │
│  ★ 4.8 (23 reviews)            │
│                                 │
│  Hosted by Maria                │
│  🏠 Superhost · 2 years         │
│                                 │
│  ── What this space offers ────  │
│  📶 Wifi   🚿 Shower            │
│  ☕ Coffee  🛋 Sofa              │
│  🅿 Parking  🔒 Lock             │
│                                 │
│  ── Safety ────────────────────  │
│  🚨 Smoke detector declared     │
│  (Not verified by kicknap)      │
│                                 │
│  ── Reviews ──────────────────  │
│  ★ 4.8 "Perfect for a nap      │
│    during my layover"           │
│  [See all 23 reviews →]         │
│                                 │
│  ── House rules ──────────────  │
│  Check-in: After 2:00 PM       │
│  Check-out: Before 5:00 PM     │
│  No smoking                     │
│  Max 1 guest                    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  €13/h × 3h = €39       │   │
│  │  + €3.90 service fee     │   │
│  │  Total: €42.90           │   │
│  │                          │   │
│  │      Book now             │   │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

---

## Step 2: BOOK

### Screen 2.1 — Confirm & Pay (tap "Book now")
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  Confirm your booking           │
│                                 │
│  ── Space ────────────────────  │
│  📷 Cozy Studio near Centraal  │
│  📅 Today, August 26            │
│  🕐 2:00 PM – 5:00 PM (3h)     │
│                                 │
│  ── Price breakdown ──────────  │
│  €13.00 × 3 hours      €39.00  │
│  Guest service fee (10%) €3.90  │
│  ─────────────────────────      │
│  Total                €42.90    │
│                                 │
│  Security deposit       €75.00  │
│  (pre-authorization, released   │
│   after 7 days if no damage)    │
│                                 │
│  ── Payment ──────────────────  │
│  💳 •••• 4242                   │
│  [Change]                        │
│                                 │
│  ── Message to host (optional)  │
│  ┌─────────────────────────┐    │
│  │ Hi Maria! I need a      │   │
│  │ quiet space for a few   │   │
│  │ hours. Thanks!          │   │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Pay €42.90              │   │
│  └─────────────────────────┘    │
│                                 │
│  By booking, you agree to the   │
│  Guest Terms of Service.        │
│                                 │
└─────────────────────────────────┘
```

### Screen 2.2 — Processing
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│           ┌─────┐               │
│           │ ✓   │               │
│           └─────┘               │
│                                 │
│      Booking confirmed!         │
│                                 │
│      Sending to Maria...        │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### Screen 2.3 — Booking Confirmed
```
┌─────────────────────────────────┐
│                                 │
│           ┌─────┐               │
│           │ ✓   │               │
│           └─────┘               │
│                                 │
│      You're all set!            │
│                                 │
│  ── Booking details ──────────  │
│  📅 Today, August 26            │
│  🕐 2:00 PM – 5:00 PM          │
│  📍 Kraijenhoffstraat 137A     │
│      Amsterdam                  │
│                                 │
│  ── Check-in instructions ────  │
│  Door code: #4582               │
│  Ring bell 2B                   │
│  Lift to 2nd floor              │
│                                 │
│  ── What to do ───────────────  │
│  1. Arrive at the space         │
│  2. Use door code to enter      │
│  3. Make yourself comfortable   │
│  4. Check out before 5:00 PM   │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Get directions 📍       │   │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Message Maria 💬        │   │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## Step 3: GO

### Screen 3.1 — Active Booking (during stay)
```
┌─────────────────────────────────┐
│  kicknap                        │
│                                 │
│  ── Active booking ───────────  │
│  📷 Cozy Studio near Centraal  │
│                                 │
│  ⏱ Time remaining: 1h 42m      │
│  ━━━━━━━━━━━━━━━░░░░░░ 57%      │
│                                 │
│  🕐 2:00 PM → 5:00 PM          │
│                                 │
│  ── Quick actions ────────────  │
│  [💬 Message Maria]             │
│  [📍 Get directions]            │
│  [🆘 Get help]                  │
│                                 │
│  ── Need more time? ──────────  │
│  [Extend booking]               │
│  (If space is available)        │
│                                 │
└─────────────────────────────────┘
```

### Screen 3.2 — Check-out Reminder (30 min before)
```
┌─────────────────────────────────┐
│                                 │
│  ⏰ Check-out in 30 minutes     │
│                                 │
│  Please vacate the space by    │
│  5:00 PM.                      │
│                                 │
│  ── Check-out checklist ──────  │
│  ☐ Return key to lockbox        │
│  ☐ Turn off lights              │
│  ☐ Close windows                │
│  ☐ Take your belongings         │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Check out now           │   │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

### Screen 3.3 — Post-Stay (after check-out)
```
┌─────────────────────────────────┐
│                                 │
│  Thanks for staying!            │
│                                 │
│  How was your experience?       │
│                                 │
│  ⭐ ⭐ ⭐ ⭐ ⭐                  │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Tell us about your stay │   │
│  │ (optional)              │   │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │      Submit review       │   │
│  └─────────────────────────┘    │
│                                 │
│  ── Or skip for now ──────────  │
│  [Maybe later]                  │
│                                 │
└─────────────────────────────────┘
```

---

## Key Design Principles

1. **No account creation before first booking** — Guest can search and book as a guest. Account created automatically after payment.
2. **One screen per decision** — Never show 3 things at once. Search → Results → Detail → Book → Done.
3. **Price always visible** — Every screen shows the price. No surprises at checkout.
4. **Security deposit shown clearly** — Guest sees it's a pre-auth, not a charge.
5. **Check-in instructions immediate** — After booking, door code + directions are front and center.
6. **Timer during stay** — Guest sees time remaining. Reduces anxiety about overstaying.
7. **Check-out reminder** — 30 min warning. Prevents disputes.
8. **Review prompt after stay** — But never forced. "Maybe later" is always an option.

---

*Last updated: August 2026*
