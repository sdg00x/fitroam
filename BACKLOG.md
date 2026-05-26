# FitRoam — Live Backlog

Single source of truth for what's done, in progress, and pending.
Update at end of every session. Future Claude reads this first.

Last updated: May 26, 2026 (Day 4 — Match Engine v2 + Sprinkle #1)

---

## Locked product framing

**v1 = intelligence/planning product.** Match gyms, plan trips, AI concierge, fitness passport. Subscription model (premium intelligence, ~£5-10/month). Ships in 6-8 weeks.

**v2 = transactional/walk-in access (North Star).** Requires gym partnerships. Built post-launch using v1 traction as leverage.

See `PRODUCT_v5.md` and `BUILD_STATUS_v2.md` for the full reasoning.

---

## Day 4 — Shipped today (May 26)

- **Match engine v2** — Activity-aware scoring with real differentiation (25-85% spread, not 51-69% cluster). 6 activity equipment maps. Priority scoring (yes/no/unknown). Dropped budget scoring (no data). Rating with confidence weighting. Same gyms reshuffle by primaryActivity.
- **API route fix** — `/api/gyms` now reads actual profile params (`primaryActivity`, `activities`, `priorities`, `lifestyle`, `maxDistanceMinutes`) instead of silently defaulting.
- **Mobile Explore param fix** — Was sending old `style`/`budget`/`maxMins` params the backend ignored. Now sends real profile shape.
- **DB cleanup** — Removed 12 non-gym venues (PT studios, wellness, salons, etc).
- **Onboarding cleanup** — Removed `facilities.tsx` step. Style reroutes to lifestyle. Expanded activity options to 6 (added staying_in_shape, powerlifting, bodybuilding).
- **Sprinkle #1: Today's session picker + Explore equipment filter** — Tap training card on Home → bottom sheet picker → 7 options (push/pull/legs/upper/lower/full_body/rest). Persists today's choice (date-stamped AsyncStorage). Card shows label + description + equipment pills. "Find a [session]-friendly gym" CTA passes equipment to Explore. Acid-green filter banner on Explore with × to clear.
- **Backend `requiredEquipment` filter** — `/api/gyms` accepts optional comma-separated equipment param. Filters to gyms matching ANY tag (ALL was too strict for Google Places data).
- **Profile sign-up CTA** — Identity card opens GetAccessForm modal when no user. Bug fixed: wrong prop names corrected.
- **Strategic doc updates** — PRODUCT_v5 + BUILD_STATUS_v2 locked v1/v2 sequencing. Routes deferred to v1.1. Strava/Whoop integrations deferred post-launch. Community/UGC deferred to v1.2.

## Day 4 — Resolved bugs

- Match engine ignored mobile profile shape entirely (defaults overrode everything)
- Filter for personal trainers/wellness venues bypassed by cached DB entries (cleanup script fixed)
- Soft floor in scoring capped all gyms at 51-69%
- Explore "Could not reach API" — naming collision: `params` (URLSearchParams) shadowed `params` (useLocalSearchParams)
- Duplicate `useState` import added by patch
- Lower body session returned 0 gyms (equipment names didn't match Google tag format — normalized to `free_weights`, `barbells`, etc.)
- "Find a rest day-friendly gym" CTA label stale across all sessions (`today.dayLabel` not `displayDayLabel`)

---

## Open backlog — Next session priorities

### Phase 2 — Remaining sprinkles (1 session)

- [ ] **"Good for today" filter chip on Explore** — Possibly already covered by Sprinkle #1's banner. Audit and decide.
- [ ] **Visit memory on gym detail** — When gym detail loads, check if user has logged visit. Surface as "You trained here on Mar 5."

### Phase 3 — AI concierge (4-5 sessions)

- [ ] Backend AI endpoint with Claude integration + tool definitions
- [ ] Assistant UI sheet + voice input (Expo Speech)
- [ ] Floating sparkle FAB on every screen
- [ ] Settings toggle to hide AI assistant
- [ ] Phase 2 actions (create trip, log visit, web-fetch pricing) with confirmation UX
- [ ] Polish + trust patterns

### Phase 4 — Visual polish pass (1 session)

- [ ] Screen-by-screen design review (Home, Explore, Trips, Profile, Gym Detail, Trip Detail)

### Phase 5 — Pre-TestFlight cleanup (1 session)

- [ ] Remove `seed_user_placeholder` fallbacks (auth is solid now)
- [ ] Empty state audit
- [ ] Error state audit
- [ ] Onboarding end-to-end walkthrough
- [ ] ToS + Privacy Policy drafts
- [ ] App Store metadata

### Phase 6 — TestFlight setup (1 session, do early)

- [ ] Apple Developer Program ($99/year)
- [ ] Signing certificates
- [ ] First TestFlight build pushed

---

## v1.1 backlog (post-launch)

- Routes-as-viewing (deferred from v1 — Day 4)
  - 3-5 popular routes per city from OSM
  - View-only, no tracking/creation/social/GPX
  - Display on Trip Detail
  - AI concierge route recommendation tool
- Manual pricing layer for top 50-100 gyms per launch city (contractor work)
- AI concierge price-on-demand via web fetch (Phase 2)

## v1.2 backlog

- Strava integration (passport bridge, AI awareness)
- User-generated content (gym reviews, categories, experiences) — gated on user base
- Pilates / Yoga support (different match logic)

## v2 backlog (North Star)

- Transactional booking layer with partnered gym chains
- Walk-in temporary access (the original product vision)
- Whoop integration (recovery-aware AI)

---

## Known issues / honesty notes

- **No pricing data.** Cannot honestly score budget. "Best price" filter on Explore is misleading. Should be removed in next session.
- **Equipment tags are inferred**, not from Google directly. `placesService.ts:inferEquipmentTags()` makes best guesses from name/type. Heuristic, not data.
- **Priorities `cleanliness`, `quiet`, `community`** return UNKNOWN — Google data can't verify these honestly. Considered removing from onboarding.
- **6 orphan trips in DB** under `seed_user_placeholder` from before auth fix. Not user-visible but should be cleaned in Phase 5.
- **Day N of N counter** removed when user logs a session (we have no real cycle data yet). May add real tracking in v1.x when user-logged sessions accumulate.

---

## Architecture quick reference

### Backend (`~/fitroam/packages/api`)
- `src/services/matchEngine.ts` — v2, activity-aware scoring
- `src/services/placesService.ts` — Google Places integration, `isActualGym` filter
- `src/routes/gyms.ts` — GET /, GET /:id (UUID + Places ID), POST /:id/access
- `src/routes/trips.ts`
- `src/routes/weather.ts`

### Mobile (`~/fitroam-mobile`)
- `src/context/UserProvider.tsx` — single source of truth for auth
- `src/hooks/useTodaySession.ts` — today's logged session
- `src/hooks/useNextTrip.ts`, `useTopMatch.ts`, `useUser.ts`, `useProfile.ts`
- `src/components/TodaySessionPicker.tsx` — bottom sheet picker
- `app/(tabs)/home.tsx` — greeting, training, next trip, top match, passport
- `app/(tabs)/index.tsx` — Explore with sort + filter banner
- `app/(tabs)/trips.tsx`
- `app/(tabs)/profile.tsx` — identity + sections + sign-up CTA
- `app/onboarding/` — style → lifestyle → budget → priorities → training

### Strategic docs (`~/fitroam/`)
- `PRODUCT_v5.md` (active)
- `BUILD_STATUS_v2.md` (active)
- `BACKLOG.md` (this file)
- `CONCIERGE_LAUNCH_PLAN.md` (superseded)
- `PRODUCT_v4.md`, `BUILD_STATUS.md` (history)

---

## Day 4 — Late session (auth foundation)

### Shipped

- Real `/api/auth/signup` endpoint — accepts email/name/phone, creates user
- Real `/api/auth/signin` endpoint — finds user by email, returns full profile
- User schema: added `name` and `phone` columns (Prisma migration applied)
- Backend: killed placeholder lazy-create in trips/gyms/auth (deleted unused gym.ts route file)
- Mobile: `signUp` and `signIn` methods on UserProvider now call the API
- GetAccessForm: new `'signin'` mode with email-only field
- GetAccessForm: "Already have an account? Sign in" + "New here? Create account" toggle
- Profile: shows authMode-based modal (signup or signin)
- DB wiped: 17 placeholder visits + 11 placeholder users + 8 trips removed
- Migration reset all gym data too (will repopulate from Google Places naturally)

### Verified

- Signup with real email → signout → signin with same email → full data restored (name, phone, email)
- Visit memory will now attach to the right user since signin returns the same user ID

### NEXT SESSION — top priority

**PRE-LAUNCH BLOCKER: Email-only signin is insecure.** Anyone with your email can sign in as you. Tagged in `src/routes/auth.ts`. Must replace with magic codes before any public release.

Build sequence for magic codes:
1. Pick provider (Resend recommended — 100/day free)
2. Add code generation + storage table (AuthCode model: code, email, expiresAt)
3. Update signup/signin to send code instead of returning user immediately
4. New `/api/auth/verify` endpoint that takes email + code, returns user
5. Mobile UX: enter email → receive code → enter code → done
6. Add rate limiting + code expiry (10 min default)

Estimated: 1 focused session.
