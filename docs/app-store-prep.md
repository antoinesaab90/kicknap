# kicknap — App Store & Play Store prep

Preparing the Expo SDK 54 app for public store release. Blocks on the two store accounts (user-owned) + marketing assets; everything below is ready to paste once they exist.

## Accounts needed (user)
- Apple Developer Program: $99/yr — https://developer.apple.com/programs
- Google Play Console: $25 once — https://play.google.com/console
  (Both are your personal/business accounts; kicknap is operated by Learnix, KvK 42119992.)

## Prerelease checks
- [ ] All-16%-pricing verified on device (web verified; repeat the €37.50 space-14 flow on the app once more)
- [ ] Stripe live mode wired (store testers + reviewers will book)
- [ ] Booking emails live (confirmation is a store-review criterion on Apple)
- [ ] Terms + Privacy live (done — /en/legal/terms, /en/legal/privacy, linked in footer)
- [ ] Test build passes `npx expo export` / EAS build for both platforms

## Metadata (copy-paste)

- **Name:** kicknap
- **Subtitle (iOS):** Hourly stays for your workday
- **Short description (Play):** Book a quiet space for an hour or a day — in your city, instantly.
- **Long description:**
  kicknap is hourly stays during your workday: photoshoots, focus work, podcasts, offsites and a quiet place to land between meetings. Book any free slot in a minute; pay online with one all-in price. No subscriptions, no memberships.

  - Instant booking for flexible or fixed sessions
  - One all-in price — the 16% service fee is included in the total you see
  - Book from your phone with your location's timezone
  - Free cancellation until your booking starts
- **Keywords (iOS):** workspace,hourly,rental,booking,coworking,meeting
- **Category:** iOS Business / Play Productivity (or Business)
- **Support URL:** https://www.kicknap.com/en/legal/terms
- **Marketing URL:** https://www.kicknap.com
- **Privacy policy URL:** https://www.kicknap.com/en/legal/privacy
- **Age rating:** 4+ / Everyone (no restricted content)

## Assets needed (user)
- **App icon** 1024×1024 (no transparency) — current Expo icon is a placeholder
- **Splash** 1284×2778 (iOS) / 1242×2436 (Android)
- **Screenshots** (6 per platform, 1290×2796 iOS / 1080×2400 Android): search, space detail calendar, checkout, my bookings
- **Feature graphic** (Play, 1024×500)

## Release flow
1. Add icon/splash/screenshots into `apps/mobile` (update `app.json` references).
2. `npx eas init` → `npx eas build --platform all` (production).
3. Submit via EAS Submit to both stores with the metadata above.
4. Internal testing track first → then production rollout (staged %).

Slack: anything that needs an asset is yours; the app config/metadata changes are mine once assets exist.