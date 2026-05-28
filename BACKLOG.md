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

---

## Day 4 — End of session (May 26, late)

### What broke / what's owed tomorrow

- **Profile sync is broken across signin.** Profile lives only in AsyncStorage on device. Signing in on fresh state means useProfile returns DEFAULT_PROFILE (onboarded: false) → user gets sent through onboarding again. Real fix is server-side profile storage: update UserProfile schema to match mobile shape, add /api/profile GET/PATCH, signin returns profile, useProfile hydrates from server.
- **Explore UI has visual breakage** (Samuel noted — investigate tomorrow).
- **useProfile patched tonight to react to user.id changes.** That patch caused the onboarding loop. Already attempted a useRef guard. Tomorrow: revert useProfile reactivity AND fix the root cause (server-side profile sync) in one pass instead of patching.

### Honest accounting

- One month of work (April 27 → May 26), 8 sessions.
- Strategic scope locked at PRODUCT_v5 only recently — earlier sessions had drift.
- Pattern: too many "quick fixes" instead of redesigns when bugs surface architectural issues.
- Going forward: scope FIRST. If a "quick fix" reveals a deeper problem, stop and redesign, don't patch.

---

## Day 5 — May 27 morning

### Shipped — profile sync done properly

- UserProfile schema migrated to match mobile shape exactly (primaryActivity, activities, facilityTypes, lifestyle, priorities, monthlyBudget, travelDailyBudget, maxDistanceMinutes, trainingPattern, themePreference, onboarded)
- New `/api/profile` endpoints (GET + PATCH)
- Signup creates default profile row in same transaction
- Signin returns profile alongside user
- UserProvider caches profile to AsyncStorage on signup/signin
- **useProfile rewritten as ProfileProvider + useProfile hook** (was the real bug — two components calling useProfile got separate state, causing onboarding loop)
- Welcome → signup → onboarding → main flow works
- Signout → welcome flow works
- Signin restores profile fully (onboarded users skip onboarding)

### Lesson logged

Two patches on the same bug = redesign needed. Hours wasted today patching symptoms of a hook-instance-isolation problem when the right move was to convert useProfile to a Provider/context pattern from the first failure. Going forward: if a bug returns after a patch, redesign.

### Remaining for v1

- Magic codes for auth (next session priority — current email-only is pre-launch blocker)
- AI concierge (4-5 sessions, confirmed for v1)
- Visit confirmation flow ("did you go?")
- Drop UK-only restriction (global registration)
- Location search accuracy for UK postcodes
- Visual polish pass
- Pre-TestFlight cleanup
- TestFlight setup

### Diagnostic

Left the `[Gate]` console.log in `app/_layout.tsx` — useful for debugging routing during further development. Remove in Phase 5 (pre-TestFlight cleanup).

---

## STRATEGIC PIVOT — May 27 (Day 5 PM)

### The decision

FitRoam v1 is repositioned as **AI-first travel-fitness assistant for 3 launch cities: London, New York, Miami.**

### What changes

**Home screen becomes the AI prompt.** Not a FAB, not a tab. The primary action when you open the app is "tell the AI what you need." Existing Home (greeting, training, top match) becomes secondary.

**3 cities only at launch.** Anywhere outside London / NYC / Miami → "coming soon, get notified" screen. Locks down for data quality.

**Manual verification of top ~100 gyms per city (~300 total).** Day pass yes/no, price, equipment tags, vibe, direct deep-link to day-pass URL. Builds the moat.

**Existing pages get repurposed, not deleted:**
- Explore → AI Results page (where the AI's curated picks land)
- Trips → AI itinerary storage (passive, AI fills it)
- Profile → Fitness identity (the AI's context)
- Match engine v2 → AI's ranking algorithm under the hood

**Subscription priced higher than initial £5.** Target £8-12/month for what this becomes.

### What gets dropped from v1

- Manual gym search as primary flow (still accessible as secondary)
- Magic codes (deferred — current email auth fine for closed beta)
- Location search accuracy improvements (no longer relevant with 3-city constraint)
- Drop UK-only restriction (no longer relevant — actively scoping to UK + 2 US cities)
- Heavy visual polish pass (minimal — focus on AI screen + results)

### Why this pivot now

User's original product vision was AI-driven temporary-access. Every drift over the past month (routes, community, full search UI) came from anxiety about whether the AI product was "enough." It is. Path forward: build the AI product properly, ship to 3 cities, beta with 20-50 users.

### Realistic timeline

3-4 weeks to TestFlight closed beta. App Store launch after beta feedback.

### v1 build sequence

1. **City constraint** (1 session) — DB allowlist, "coming soon" outside scope
2. **Home → AI prompt** (1 session) — reposition existing screens
3. **Onboarding simplification** (0.5 session) — only collect AI-relevant fields
4. **Admin gym verification tool** (0.5 session) — internal-only screen for batch tagging
5. **Manual verification of 300 gyms** (User does — weekend of work, not a session)
6. **AI concierge build** (4-5 sessions) — backend endpoint, tools, UI, action layer
7. **TestFlight closed beta setup** (1 session)

Total: ~7-8 sessions of build, plus the user's weekend verification work.

### What stays

- Backend: Express + Prisma + Supabase (no stack change)
- Mobile: Expo + React Native (no stack change)
- Match engine v2 (becomes AI's ranker)
- Profile, trips, passport (repurposed)
- Visit confirmation flow (just built, stays)
- Auth foundation (signup/signin, fine for closed beta)

---

## STRATEGIC PIVOT — May 27 (Day 5 PM)

### The decision

FitRoam v1 is repositioned as **AI-first travel-fitness assistant for 3 launch cities: London, New York, Miami.**

### What changes

**Home screen becomes the AI prompt.** Not a FAB, not a tab. The primary action when you open the app is "tell the AI what you need." Existing Home (greeting, training, top match) becomes secondary.

**3 cities only at launch.** Anywhere outside London / NYC / Miami → "coming soon, get notified" screen. Locks down for data quality.

**Manual verification of top ~100 gyms per city (~300 total).** Day pass yes/no, price, equipment tags, vibe, direct deep-link to day-pass URL. Builds the moat.

**Existing pages get repurposed, not deleted:**
- Explore → AI Results page (where the AI's curated picks land)
- Trips → AI itinerary storage (passive, AI fills it)
- Profile → Fitness identity (the AI's context)
- Match engine v2 → AI's ranking algorithm under the hood

**Subscription priced higher than initial £5.** Target £8-12/month for what this becomes.

### What gets dropped from v1

- Manual gym search as primary flow (still accessible as secondary)
- Magic codes (deferred — current email auth fine for closed beta)
- Location search accuracy improvements (no longer relevant with 3-city constraint)
- Drop UK-only restriction (no longer relevant — actively scoping to UK + 2 US cities)
- Heavy visual polish pass (minimal — focus on AI screen + results)

### Why this pivot now

User's original product vision was AI-driven temporary-access. Every drift over the past month (routes, community, full search UI) came from anxiety about whether the AI product was "enough." It is. Path forward: build the AI product properly, ship to 3 cities, beta with 20-50 users.

### Realistic timeline

3-4 weeks to TestFlight closed beta. App Store launch after beta feedback.

### v1 build sequence

1. **City constraint** (1 session) — DB allowlist, "coming soon" outside scope
2. **Home → AI prompt** (1 session) — reposition existing screens
3. **Onboarding simplification** (0.5 session) — only collect AI-relevant fields
4. **Admin gym verification tool** (0.5 session) — internal-only screen for batch tagging
5. **Manual verification of 300 gyms** (User does — weekend of work, not a session)
6. **AI concierge build** (4-5 sessions) — backend endpoint, tools, UI, action layer
7. **TestFlight closed beta setup** (1 session)

Total: ~7-8 sessions of build, plus the user's weekend verification work.

### What stays

- Backend: Express + Prisma + Supabase (no stack change)
- Mobile: Expo + React Native (no stack change)
- Match engine v2 (becomes AI's ranker)
- Profile, trips, passport (repurposed)
- Visit confirmation flow (just built, stays)
- Auth foundation (signup/signin, fine for closed beta)

---

## Founder docs to write (when triggered)

- **LESSONS.md** — when 5+ lessons have accumulated worth writing down. Will backfill: Provider pattern (today), dual source of truth (today), lazy user creation (yesterday), patching vs redesigning (today). Trigger: hitting another architectural mistake worth recording.

- **USER_INTERVIEWS.md** — when TestFlight beta starts. Template + question bank from "The Mom Test." Trigger: first user signs up.

- **PRICING_ANALYSIS.md** — pre-launch, before committing to a public price. Competitor scan, willingness-to-pay research, subscription model justification. Trigger: 2 weeks before App Store.

---

## CURRENT STATE — end of May 27, 2026

### Just done (Day 5)
- Profile sync done properly via ProfileProvider context pattern
- Visit confirmation flow (Home card + inline Passport editing)
- Auth lookup fixes (clerkId → id)
- Strategic pivot locked: AI-first, 3 cities (London/NYC/Miami)
- Tab structure dropped from 4 to 3 (Home/Trips/Profile)
- Explore screen moved from /(tabs)/index.tsx to /results.tsx
- Founder docs written (Architecture, Tech Cheatsheet, Talking Points)

### Pending — structural rebuild (next session)
- Rebuild Home with AI prompt as centerpiece
- City constraint (DB allowlist + onboarding city picker)
- Trim onboarding 5 steps → 3
- Trim Profile (drop pattern, facilities, separate budgets)
- Admin gym verification tool

### Pending — manual work (founder's weekend)
- Verify top ~100 gyms per city (~300 total) — day pass yes/no, price, equipment tags, vibe, deep-link URL

### Pending — AI concierge (4-5 sessions)
- /api/concierge backend endpoint with Claude + tools
- Tool definitions (searchGyms, getUserProfile, saveAsTrip)
- Streaming status text during query
- Results screen wired to AI output

### Pending — launch
- TestFlight setup (Apple Dev Program, signing, build)
- Closed beta with 20-50 users in 3 cities

### Diagnostics still in code (remove before TestFlight)
- [Gate] console.log in app/_layout.tsx

---

## Day 6 — May 28 (City constraint + day-pass schema foundation)

### Shipped — backend
- `src/config/cities.ts` — single source of truth for launch cities. Convention `{city}-{country}` lowercase (matches existing `gym_access` data): `london-gb`, `newyork-us`, `miami-us`. Exports `CITIES`, `CITY_SLUGS`, `isValidCitySlug()`.
- `Gym` schema — six new columns (applied via direct SQL to dodge Prisma drift-reset, NOT in migration history): `citySlug` (nullable, verification/analytics tag), `dayPass` (bool), `dayPassPence` (int?), `dayPassUrl` (string?), `verified` (bool default false), `verifiedAt` (timestamptz?). 290 existing rows intact.
- `UserProfile` schema — `citySlug` (nullable, no default — a defaulted city is a silent wrong answer).
- `/api/profile` PATCH — validates `citySlug` against allowlist, 400s on invalid with `allowed` list, writes valid ones. Serializer returns `citySlug`. Verified end-to-end: `paris-fr` rejected, `london-gb` writes.

### Decisions locked
- Day-pass fact lives on `Gym`, not `PriceReport`. Canonical one-per-gym truth (what weekend verification fills, what AI quotes). `PriceReport` stays as the price-history/observation log for later.
- Match route flips to DB-first with radius filtering — DEFERRED to its own session. Current `/api/gyms` reads live Google Places via `fetchNearbyGyms`, not the DB. Plan: PostGIS `ST_DWithin` against existing lat/lng (no stored geography column at 300-gym scale), verified gyms ranked first, Google as tagged-unverified fallback for thin areas.
- Concierge/auto-book model — PARKED pending demand data. Schema supports it; do not build. When ready: test via FAKE DOOR ("sort it for me" -> waitlist, zero money, zero legal surface), measure intent rate. Only if intent >~20%: UK solicitor, Stripe Connect, agent-of-record ToS (buy in USER's name w/ consent, never FitRoam's; never hold raw card data; liability capped not excluded). Rejected outright: charging more then buying cheaper pass (misrepresentation), self-drafted "zero liability" waivers (void under UCTA), typing users' raw cards into gym sites (PCI breach).

### Pre-existing issues found (log, don't chase)
- Prisma drift: Supabase ships postgis/pgcrypto/pg_stat_statements/supabase_vault not in migration history -> `migrate dev` wants a destructive reset. Real fix: `prisma migrate resolve` to baseline. Until then, schema changes go via direct SQL + `prisma generate`.
- `tsconfig.json` line 2: `moduleResolution: bundler` incompatible with current `module` -> `tsc --noEmit` can't run as CI check. Runtime fine (tsx ignores it).
- Prisma 5.22 -> 7 upgrade available. Do NOT do mid-build.
- `[Gate]` console.log still in `app/_layout.tsx` (remove Phase 5).

### Next session
- Onboarding city-picker step (mobile) — only user-facing piece of city constraint left. Adds screen writing `citySlug` via `useProfile().save()`. Match existing onboarding pattern. Wire into `app/onboarding/_layout.tsx`. Note: onboarding still OLD 5-step flow, not post-pivot 3-step — trim is separate.
- Backfill `citySlug` on 290 gyms — weekend verification work. London -> `london-gb` etc. Nottingham rows (pre-pivot leftovers) -> null or delete.

### Day 6 — afternoon addendum (mobile onboarding + pivot bug fixes)

Shipped:
- 3-step onboarding live: city -> activity (style.tsx) -> priorities. `city.tsx` writes citySlug (london-gb/newyork-us/miami-us). priorities.tsx now finishes onboarding (sets onboarded:true, routes to home). lifestyle/budget/training left on disk unreferenced (delete in Phase 5).
- Verified end-to-end on device: welcome -> signup -> city -> activity -> priorities -> Home, clean.

Latent pivot bugs found + fixed (all from Day 5 `mv` file moves that didn't update imports/routes):
- `results.tsx` imports were `../../src` (two-level) but file is now one level deep -> `../src`. 7 paths fixed.
- `(tabs)/` had NO index route — pivot moved (tabs)/index.tsx to results.tsx, so navigating to bare /(tabs) hit unmatched-route. Added (tabs)/index.tsx redirecting to home; also navigate to /(tabs)/home explicitly.
- Added app/index.tsx root redirect (no root route -> unmatched on boot).

Real runtime bugs found + fixed:
- ProfileProvider: `lastUserIdRef` initialized to null; on first run null===null made the guard skip before setting loading:false -> profileLoading stuck true forever -> AuthGate never ran. Fixed: init ref to undefined sentinel.
- welcome.tsx had its own useEffect + onComplete navigation racing the AuthGate -> three navigations in one tick -> unmatched route on signup. Stripped welcome's navigation; AuthGate is now sole router.

Lesson: AuthGate must be the single source of routing truth — no screen should navigate on auth/onboard state, only the gate. And `mv` during the pivot left a trail of broken import paths / missing routes that surface one-at-a-time when the bundler reaches each file.

Still in code (remove Phase 5): original [Gate] console.log in _layout.tsx (predates today).

### Home rebuild — final direction (build next session)

LOCKED:
- Two-screen push (NOT a bottom sheet). Top-right icon pushes /dashboard. Standard expo-router push, back gesture returns to prompt. Faster build, no sheet lib, no gesture conflicts.
- Prompt screen = standard chat-app layout for user familiarity. Input bottom-anchored, mic, green Ask button, conversational placeholder showing example query syntax ("London 3 days, Miami 2, upper body, under £70"). Reference shape closer to Perplexity than ChatGPT: chat-feel input, structured results output.
- Each query is FRESH — no conversation thread/history on the prompt screen in v1. Like a search bar. Tap Ask -> push to /results -> back returns to empty prompt. Simpler state, no multi-turn context to manage. Threading is a v1.x feature if users ask.
- Placeholder + brand framing make purpose unmistakable: this is "find gyms when you travel," not a general chatbot. Avoids training users to expect open-ended chat.
- Dashboard screen = current Home cards (training, top match, passport, etc.) almost as-is. Reached via top-right ti-layout-dashboard icon. Standard back to return.
- Open question for build: does the greeting ("Hey Dan") stay on prompt or move to dashboard? Lean toward keeping on prompt — warm anchor, doesn't compete with input.
