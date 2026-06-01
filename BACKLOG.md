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

### Home rebuild — visual locked

Prompt screen layout:
- Top: "FitRoam" wordmark left of dashboard icon (ti-layout-dashboard, top-right). Single tap pushes /dashboard.
- Middle: greeting ("Where are you training, [name]?") + one-line purpose statement + 2-3 "TRY" example prompts (tappable, auto-fill the input).
- Bottom-anchored: pill-shaped input with mic icon left, "Message FitRoam…" placeholder, circular green send button (ti-arrow-up) right. Matches ChatGPT/Claude/Perplexity convention for instant familiarity.
- No tab bar on this screen — prompt owns the full viewport.

Dashboard screen layout:
- Top: back chevron left, "Your stuff" title center, empty right slot.
- Cards stack: today's training, next trip, top match, passport (current Home cards, minus the weather widget).
- Standard expo-router back returns to prompt.

Not included in v1:
- Conversation thread / history (each query fresh)
- Weather widget (drop unless it earns its place later)
- Voice input wiring (mic icon present, Expo Speech integration deferred — text input works)

---

## Day 6 — May 28, 2026 (CONSOLIDATED — supersedes scattered Day 6 entries above)

Long session. Three things happened: backend city constraint shipped, mobile onboarding trimmed and working, three latent pivot bugs cleared. Plus the Home rebuild direction is now locked to a buildable spec.

### Backend — city constraint (DONE, tested end-to-end)
- `src/config/cities.ts` — single source of truth for launch cities. Convention `{city}-{country}` lowercase (matches existing `gym_access.city_slug` data): `london-gb`, `newyork-us`, `miami-us`. Exports `CITIES`, `CITY_SLUGS`, `isValidCitySlug()`.
- `Gym` schema — six new columns (applied via direct SQL to dodge Prisma drift-reset, NOT in migration history): `citySlug` (nullable, verification/analytics tag), `dayPass` (bool), `dayPassPence` (int?), `dayPassUrl` (string?), `verified` (bool default false), `verifiedAt` (timestamptz?). 290 existing rows intact.
- `UserProfile` schema — `citySlug` (nullable, no default — a defaulted city is a silent wrong answer).
- `/api/profile` PATCH — validates `citySlug` against allowlist, 400s on invalid with `allowed` list, writes valid ones. Serializer returns `citySlug`. Verified end-to-end: `paris-fr` rejected, `london-gb` writes.

### Mobile — 3-step onboarding (DONE, walked on device)
- New `app/onboarding/city.tsx` (step 1 of 3) — three city buttons, writes `citySlug`.
- `style.tsx` repurposed as activity step (step 2 of 3) — content unchanged, renumbered.
- `priorities.tsx` is now the finish step (step 3 of 3) — sets `onboarded: true`, routes to `/(tabs)/home`.
- `_layout.tsx` rewired: city -> style -> priorities only.
- `lifestyle/budget/training` left on disk, unreferenced. Delete in Phase 5.
- Flow verified on device: welcome -> signup -> city -> activity -> priorities -> Home, clean.

### Latent pivot bugs found + fixed (all from Day 5 `mv` file moves)
- `results.tsx` imports were `../../src/...` (two-level) but file is now one level deep. 7 paths fixed to `../src/...`.
- `(tabs)/` had NO index route — the pivot moved `(tabs)/index.tsx` to `results.tsx`, so navigating to bare `/(tabs)` hit the unmatched-route fallback. Added `(tabs)/index.tsx` redirecting to home; also navigate to `/(tabs)/home` explicitly from priorities + AuthGate.
- Added `app/index.tsx` root redirect (no root route -> unmatched on boot).

### Real runtime bugs found + fixed
- `ProfileProvider`: `lastUserIdRef` initialised to `null`. On first run, `null === null` made the guard skip before `setLoading(false)` -> profileLoading stuck true forever -> AuthGate never ran. Fixed: init ref to `undefined` sentinel.
- `welcome.tsx` had its own useEffect + onComplete navigation racing the AuthGate. Three navigations in one tick on signup -> unmatched route. Stripped welcome's navigation. AuthGate is now the sole router.

### Decisions locked
- Day-pass canonical fact lives on `Gym`, not `PriceReport`. `PriceReport` stays as price-history/observation log for later.
- Match route flip to DB-first with radius filtering DEFERRED to its own session. Plan: PostGIS `ST_DWithin` against existing lat/lng (no stored geography column at 300-gym scale), verified gyms ranked first, Google as tagged-unverified fallback for thin areas.
- Concierge/auto-book PARKED pending demand data. When ready: FAKE DOOR ("sort it for me" -> waitlist, zero money, zero legal surface) measures intent rate. Only if intent >~20%: UK solicitor + Stripe Connect + agent-of-record ToS (buy in USER's name with consent, never FitRoam's; never hold raw card data; liability capped not excluded). Rejected outright: charging more then buying cheaper pass (misrepresentation), self-drafted "zero liability" waivers (void under UCTA), typing users' raw cards into gym sites (PCI breach).

### Home rebuild — direction FULLY LOCKED (build next session)
- Prompt is Home. Dashboard is a separate screen pushed via top-right `ti-layout-dashboard` icon. Two-screen push (NOT a bottom sheet) — faster build, no sheet lib, no gesture conflicts.
- Prompt screen layout: top wordmark + dashboard icon; middle greeting ("Where are you training, [name]?") + purpose line + 2-3 tappable "TRY" example prompts (auto-fill input on tap); bottom-anchored pill input with mic, "Message FitRoam…" placeholder, circular green send button (ti-arrow-up). Matches ChatGPT/Claude/Perplexity conventions for instant familiarity.
- Each query is FRESH — no conversation thread on prompt screen in v1. Tap Ask -> push to `/results` -> back returns to empty prompt. Threading is a v1.x feature if users ask.
- Dashboard screen = current Home cards (training, next trip, top match, passport) almost as-is, minus the weather widget. Left chevron back returns to prompt.
- No tab bar on the prompt screen — prompt owns the full viewport.
- Mic icon present, Expo Speech wiring deferred — text input works for v1.

### Lessons logged
- AuthGate must be the single source of routing truth — no screen should navigate on auth/onboard state, only the gate.
- `mv` during the pivot left a trail of broken import paths and missing routes that surfaced one-at-a-time when the bundler reached each file. Pattern: file moves require import-path audit AND route-resolution audit, not just the move.
- Held the concierge legal line under sustained pressure from external "growth coach" sources that repeatedly reintroduced conceded risks in new forms (virtual cards -> typing user's real card; "zero liability" waivers; "charge £60 buy £40"). The constraints are real; the workarounds keep trying to route around them. Evaluate against FitRoam's actual constraints, not source confidence.

### Pre-existing issues found (log, don't chase)
- Prisma drift: Supabase ships `postgis`/`pgcrypto`/`pg_stat_statements`/`supabase_vault` not in migration history -> `migrate dev` wants a destructive reset. Real fix: `prisma migrate resolve` to baseline. Until then, schema changes go via direct SQL + `prisma generate`.
- `tsconfig.json` line 2: `moduleResolution: bundler` incompatible with current `module` -> `tsc --noEmit` can't run as CI check. Runtime fine (tsx ignores it).
- Prisma 5.22 -> 7 upgrade available. Do NOT do mid-build.
- Original `[Gate]` console.log in `_layout.tsx` (predates today, slated for Phase 5).
- "Set your training pattern" card on Home references `trainingPattern`, which the trimmed onboarding no longer collects. Decide on Home rebuild: optional nudge or cut.

---

## What's next (priority order)

### Next session (pick one to start)
1. **Home rebuild** — build the prompt screen + dashboard screen per locked spec above. Highest-visibility piece, defines the AI-first product.
2. **Match route DB-first flip** — PostGIS radius query, verified gyms ranked first, Google as fallback. Unblocks the verification work meaning something at runtime.

### Founder weekend work (no Claude session needed)
- Backfill `citySlug` on 290 gyms. London gyms -> `london-gb`, etc. Nottingham rows (pre-pivot leftovers) -> null or delete.
- Begin manual verification of top ~100 gyms per launch city (~300 total): day pass yes/no, price (`dayPassPence`), deep-link URL (`dayPassUrl`), equipment tags, set `verified: true` + `verifiedAt`.

### Sessions after Home rebuild
3. **AI concierge build** (4-5 sessions) — `/api/concierge` endpoint with Claude + tools (`searchGyms`, `getUserProfile`, `saveAsTrip`), streaming status, wired to `/results` screen. Match engine v2 becomes the AI's ranker.
4. **Fake door for concierge auto-book** — measure intent rate, no money, no legal surface.
5. **Pre-TestFlight cleanup** — remove diagnostic `[Gate]` log, empty/error state audit, ToS + Privacy drafts, App Store metadata, delete onboarding files `lifestyle/budget/training`.
6. **TestFlight setup** — Apple Developer Program, signing, first build, closed beta with 20-50 users across 3 cities.

### v1.1+ (post-launch, deferred)
- Magic codes for auth (current email-only is closed-beta-only).
- Routes-as-viewing.
- Strava/Whoop integrations.
- User-generated content (gym reviews).
- Pilates/Yoga support.
- 4th city.

---

## Day 7 — May 29, 2026 (Home rebuild — AI-first prompt screen)

### Shipped — Home is now the AI prompt

- `app/(tabs)/home.tsx` fully rewritten. Single job: AI prompt input. Old greeting/training/top-match/passport/next-trip cards removed (still accessible via Trips and Profile tabs — nothing deleted from the system, just unbundled from Home).
- Layout: top-center brand row (waveform icon + "FitRoam" wordmark), centered greeting ("GOOD MORNING/AFTERNOON/EVENING" eyebrow + "Where are you training, {name}?" + purpose line), TRY section with 3 quoted example prompts, bottom-anchored input pill.
- Examples are tap-to-fill-and-focus (not auto-submit) — teaches the prompt syntax instead of skipping past it.
- ASK behavior: `router.push('/results', { prompt })`. Each query is fresh, no thread state on prompt screen.
- Theme-aware throughout: uses `colors.background`/`surface`/`textPrimary`/`textSecondary`/`accent`/`accentText` from existing tokens. Light + dark mode both render correctly (verified via iOS sim Cmd+Shift+A toggle).

### Shipped — brand waveform icon

- New `src/components/WaveformIcon.tsx`. Inline SVG, 5 vertical bars (heights 6/12/18/12/6), `{ size, color }` props. Installed `react-native-svg` via `expo install` (matched to SDK 54).
- Used in two places: top bar brand mark (size 20, accent color) and the mic CTA button (size 26, accentText on accent bg).
- Same component → consistent brand language between logo and voice CTA.

### Shipped — mic↔send swap CTA

- Right-side button is the dominant visual element. 52×52 circle, accent green, soft shadow.
- Empty input → green button shows waveform icon (mic-as-voice-CTA). Designed to feel "alluring" — encourages voice over typing as the default.
- User starts typing → same button morphs to arrow-up (send). Same size, same green, same position — no jarring resize.
- Mic press currently focuses the input (Expo Speech wiring still deferred to v1.x).

### Shipped — /results placeholder

- `app/results.tsx` fully rewritten. Old Explore UI (Nottingham match list, sort/filter chips, top-match card) scrapped. In git history if ever needed.
- New layout: back chevron, user's prompt echoed at top in a "YOU ASKED" bubble, big centered placeholder with sparkles icon + "FitRoam AI is on the way" copy. Honest about the state — closed beta will see this for a session or two before concierge lands.

### Shipped — tab + routing cleanup

- Killed `app/(tabs)/dashboard.tsx`. No two-screen push pattern after all (briefly explored, then dropped on the call that AI-first means no escape hatch to legacy cards).
- `(tabs)/_layout.tsx` rewritten: only HOME / TRIPS / PROFILE in the tab bar. `index.tsx` (the redirect file) hidden via `href: null`.
- Bug fix in same file: `colors.isDark` was a no-op (it's `isDark` at top level of `useTheme()`, not nested). Active green tab now renders correctly in dark mode. Pre-existing, just caught while in here.

### Decisions locked

- **No dashboard screen.** Tempting to keep as a "backup" — that temptation is the same drift that produced routes/community/full-search anxiety over the past month. AI-first means one job on the headline screen. Old Home cards live on in their own tabs and via future AI tools (e.g. "what should I train today?" hits `useTodaySession`).
- **Brand color stays `#c8ff57`** (existing accent token), not the brighter `#a8e635` briefly hardcoded. Honored the design system instead of forking it.
- **Inline SVG over icon-font waveform.** Reusable component, exact shape match, no bundle bloat. One source of truth for the brand mark whether at 20px (top bar) or 26px (CTA).
- **Examples tap-to-fill-and-focus, not auto-submit.** Teaching prompt syntax > demoing one example.
- **ASK pushes to /results with prompt param, not stubbed with toast.** Wires the navigation end-to-end so concierge lands as a one-line swap from "show placeholder" to "call /api/concierge".

### Lessons logged

- The `node -e "..."` patching trick is a zsh quoting nightmare — backticks inside double-quoted shell strings, plus history-expansion on `!`, ate two attempts at home.tsx. Plain `cat > file <<'EOF'` heredocs are the safe default. Reach for node only when surgical edits inside a larger file demand it.
- Sentimentality about deleted UI is a real cost. Felt the pull to keep the dashboard despite it contradicting the locked product framing. Pattern: when a "backup" or "fallback" screen feels protective, that's anxiety about the headline product, not a real user need. Cut it.

### Files touched

- `app/(tabs)/home.tsx` — full rewrite (AI prompt screen)
- `app/(tabs)/_layout.tsx` — full rewrite (3-tab structure, isDark fix)
- `app/(tabs)/dashboard.tsx` — deleted
- `app/results.tsx` — full rewrite (AI placeholder)
- `src/components/WaveformIcon.tsx` — new
- `package.json` — `react-native-svg` added via `expo install`

### Pre-existing issues still open (log, don't chase)

- Prisma drift on Supabase extensions (postgis/pgcrypto/etc.). Schema changes still go via direct SQL + `prisma generate`.
- `tsconfig.json` `moduleResolution: bundler` blocks `tsc --noEmit` as CI check.
- Prisma 5.22 → 7 upgrade available, hold off mid-build.
- `[Gate]` console.log still in `app/_layout.tsx`, remove Phase 5.
- Onboarding files `lifestyle.tsx`, `budget.tsx`, `training.tsx`, `facilities.tsx` still on disk unreferenced. Delete in Phase 5.

---

## What's next (priority order)

### Next session (pick one)
1. **Match route DB-first flip** — PostGIS `ST_DWithin` against existing lat/lng, verified gyms ranked first, Google as fallback for thin areas. Unblocks the verification work meaning something at runtime, and the concierge will call this route as its `searchGyms` tool.
2. **AI concierge build — session 1 of 4-5** — `/api/concierge` backend endpoint scaffold with Anthropic client, tool definitions (`searchGyms`, `getUserProfile`, `saveAsTrip`), system prompt v1. Mobile `/results` swaps from placeholder to live AI output.

### Founder weekend work (no Claude session)
- Backfill `citySlug` on 290 existing gyms (`london-gb` / `newyork-us` / `miami-us`; Nottingham rows → null or delete).
- Begin manual verification of ~300 gyms across 3 cities: `dayPass` bool, `dayPassPence`, `dayPassUrl`, equipment tags, set `verified: true` + `verifiedAt`.

### Sessions after that
3. AI concierge sessions 2–5 (streaming status, full tool execution loop, multi-leg trip generation, polish + trust patterns)
4. Fake door for concierge auto-book — "sort it for me" → waitlist, measure intent rate, no money, no legal surface
5. Pre-TestFlight cleanup — remove `[Gate]` log, delete orphan onboarding files, empty/error state audit, ToS + Privacy drafts, App Store metadata
6. TestFlight setup — Apple Developer Program, signing, first build, closed beta with 20-50 users across 3 cities

---

## Day 8 — May 29, 2026 (PM) (Concierge build session 1 — AI shipped end-to-end)

Long session. Built the full concierge loop from zero, then iterated three times in response to real Dan-tests. The AI now plans trips, lists them, deletes them, takes initiative, and uses warm not-apologetic tone.

### Shipped — backend

- `src/routes/concierge.ts` — full endpoint rewrite, multi-iteration agent loop (max 6 iterations, hard cap on cost).
  - POST /api/concierge/threads — create
  - GET /api/concierge/threads — list user's chats
  - GET /api/concierge/threads/:id/messages — full thread w/ hydrated gyms per assistant message
  - POST /api/concierge/threads/:id/messages — send user msg, run agent loop, persist both messages, return optimistic shape
- Old `POST /api/concierge` single-shot endpoint deleted.
- DB schema: `ChatThread` + `ChatMessage` tables added via Supabase SQL editor (direct SQL, RLS enabled w/ no policies — service role bypasses it, fine for this arch). schema.prisma synced + `prisma generate` ran.
- Conversation history: last 20 messages of a thread sent to Claude per turn. User context (name, home city, primary activity, priorities, recent trips with dates) prepended to the first user message so the AI always knows who it's talking to and what's already planned.
- Model: `claude-sonnet-4-6`. Tool-use loop. Cost per query ~$0.01-0.03. $5 of credits covers ~200-500 dev queries.

### Shipped — tools (4 total)

1. **searchGyms** — filters by citySlug + day_pass=true, ranks by verified-first then ratingCount. Returns up to 10. Activity, budget (pence), neighborhood all optional.
2. **saveTrip** — auto-creates Trip + TripLeg with city centroid coords (`src/config/cityCentroids.ts`). Dedupes by overlapping dates so AI can't double-save. Returns `{ deduped: true, tripId }` when matching trip exists.
3. **listTrips** — reads user's trips + legs, returns date-formatted summary.
4. **deleteTrip** — verifies ownership via userId match, then `prisma.trip.delete` (cascades to legs via FK).
5. **respond** — structured-output tool that forces JSON-clean output. Solved the "Claude returns both prose AND code-fenced JSON" bug from earlier iteration — typed args from the SDK, no parsing ambiguity.

### Shipped — system prompt (v3)

- Voice: warm, conversational, never apologetic. Uses name naturally, not every message.
- Behavior: TAKE ACTION. Save trips on first mention of city+dates, no permission asking. Call searchGyms on first city+activity hint.
- Honest about unwired capabilities: "Not wired up yet — you can do it from the [Trips/Profile/Passport] tab for now." Explicitly forbids inventing permanent limitations like "I can only see your trip info" which misrepresents the product.
- City constraint enforced: only London/NYC/Miami. Other cities mentioned plainly without apology.

### Shipped — mobile

- Massive rewrite of `app/(tabs)/home.tsx`. Home IS the chat now. Empty state (greeting + TRY chips) visible only when no messages. Thread view with scrollable history when messages exist. Bottom-anchored input.
- `src/hooks/useChat.ts` — Provider-style hook (single shared state). Restores latest thread from server on mount, caches active thread ID in AsyncStorage. Optimistic user message rendering. `send` / `newThread` / `loadThread` / `refreshThreads` actions.
- `src/components/ChatHistorySheet.tsx` — slide-up sheet listing all chats, "+ NEW CHAT" pill at top, active thread tagged "NOW", relative timestamps (just now / 11m ago / 3d ago).
- `src/components/WaveformIcon.tsx` — already shipped Day 7, now used in 3 places (top bar logo, mic CTA, Home tab icon).
- Visible "New chat" pill above thread (small action affordance for clearing context without opening history sheet).
- `app/results.tsx` deleted (replaced by inline chat).
- Home tab icon → waveform (was home-outline). Brand consistency with logo + mic.

### Behavior verified end-to-end (curl + device)

- "Hey" → warm clarifying question, no Hey-Dan eagerness
- "I might go to Miami June 2-7 for lifting" → saveTrip called immediately, AI confirms trip saved, then searches gyms
- Trips tab shows the auto-saved trip
- "What trips do I have?" → listTrips called, real data returned
- "Delete the Dubai trip" → AI calls listTrips (gets IDs), then deleteTrip, then confirms. Trip actually gone from DB.
- Multi-turn context preserved: AI remembered Dubai ID across two turns
- "Have I got any stamps this month?" → honest "not wired up yet" instead of fake permanent limitation
- Light + dark mode both render correctly throughout

### Lessons logged

- **`tsx watch` is not infallible.** Server claimed to be running but was running stale code at one point. When AI behavior contradicts the prompt/tool definitions in the file, kill -9 the port and restart. Don't trust hot-reload alone for big file changes.
- **Curl before tap.** Two cycles this session where I'd ship a change, you'd reload Expo, the device test would fail, and we'd diagnose — only to find the backend never actually had the change deployed. Going forward: curl-verify backend changes BEFORE testing on device. Faster feedback loop, fewer wasted Dan-test conversations.
- **Big multi-anchor heredocs can fail silently if not pasted cleanly.** First attempt at adding listTrips/deleteTrip tools resulted in `grep -c` returning 0 — the heredoc never ran. Now defaulting to: paste heredoc → verify exits with success message → grep-check it landed → only then test behavior.
- **The "scope drift in the same session" trap is real and you caught it twice today.** Deferred the floating AI button to its own session, deferred listVisits + updateProfile tools to next concierge session. Discipline > shipping more.
- **Structured-output tools beat "respond in JSON" prompting.** The `respond` tool moved from "Claude usually emits clean JSON, sometimes wraps in code fences" to "Claude's args are SDK-typed, parser never breaks." Worth the 5 extra lines of tool definition.

### Known issues to fix next concierge session

- **Transient 500s on long threads** — 2 failed sends observed in one device-test session. Re-firing the same prompt via curl 5min later succeeded cleanly. Most likely upstream Anthropic blip or phone network jitter, not a code bug. Action: catch upstream Anthropic errors in the agent loop and retry once before bubbling 500, then surface a "tap to retry" affordance on the failed user-message bubble in mobile. Not blocking.
- **AI loses tool-call context in long threads** — observed: AI re-called listTrips deep in thread and "apologized" for a deletion it had genuinely done earlier. Root cause: tool results aren't persisted alongside text in ChatMessage, so on rehydration the agent only sees prose history. Fix: add `toolResults JSONB` column to ChatMessage, replay as `tool_result` blocks in subsequent agent runs. Real architectural fix, session 2.
- **Dedupe-on-update is wrong behavior.** When user updates trip dates ("actually June 3-8 not 2-7"), saveTrip returns `deduped: true` and AI surfaces internal language ("the system has your original dates locked in and flagged as duplicate"). Right behavior: detect date update intent → delete old trip + create new one transparently, or call `updateTrip` (not yet a tool).
- **No streaming.** "Thinking…" placeholder shown while AI processes, but full reply only appears once complete. Adds 3-8s perceived latency vs streaming. Sessions 4-5 territory.
- **`listVisits` / `updateProfile` / `addGymToTrip` not yet tools.** AI politely admits this now, but users will keep asking. Add when value:effort right.
- **FAB across screens deferred.** Currently chat only reachable via Home tab. v1.1 backlog.

### Files touched

- `packages/api/src/routes/concierge.ts` — new + 3 major rewrites
- `packages/api/src/config/cityCentroids.ts` — new
- `packages/api/prisma/schema.prisma` — ChatThread + ChatMessage + User.chatThreads relation
- `app/(tabs)/home.tsx` — full rewrite (chat surface)
- `app/(tabs)/_layout.tsx` — Home icon → waveform
- `app/results.tsx` — deleted
- `src/hooks/useChat.ts` — new
- `src/components/ChatHistorySheet.tsx` — new
- `packages/api/package.json` — `@anthropic-ai/sdk` added

### Pre-existing issues still open (carried)

- Prisma drift on Supabase extensions
- `tsconfig.json` `moduleResolution: bundler` blocks `tsc --noEmit`
- Prisma 5.22 → 7 upgrade available, hold off
- `[Gate]` console.log in `app/_layout.tsx` (Phase 5)
- Orphan onboarding files `lifestyle/budget/training/facilities` (Phase 5)
- `API_BASE` hardcoded in 5+ mobile files — move to single env var (Phase 5)

---

## What's next (priority order)

### Next session (pick one)
1. **Concierge session 2 polish** — diagnose the 500s, fix the dedupe-on-update bug (likely add `updateTrip` tool), add `listVisits` tool, swap "Thinking…" for a better loading state.
2. **Match route DB-first flip** — PostGIS `ST_DWithin`, verified gyms first, Google fallback. Unblocks the manual verification work.
3. **Floating AI FAB across screens** — modal-overlay pattern from this session's locked scope.

### Founder weekend work (no Claude session)
- Backfill `citySlug` on 290 existing gyms (london-gb / newyork-us / miami-us; Nottingham → null or delete)
- Manual verification of ~300 gyms across 3 cities: dayPass, dayPassPence, dayPassUrl, equipmentTags, verified=true

### Sessions after that
4. AI concierge session 3-4 (streaming, addGymToTrip tool, full trip-edit tool surface)
5. Fake door for concierge auto-book — measure intent rate, no money, no legal
6. Pre-TestFlight cleanup — remove `[Gate]` log, delete orphan onboarding files, error states, ToS/Privacy, App Store metadata, single API_BASE env var
7. TestFlight setup — Apple Developer Program, signing, first build, closed beta 20-50 users in 3 cities

## Day 9 — June 1, 2026 (Concierge session 2 — tool persistence, smart saveTrip, listVisits, retry, loading copy)

Six-step session, all shipped, end-to-end verified (curl + device).

### Shipped — tool result persistence (architectural fix from Day 8)

- New `tool_results` JSONB column on `chat_messages` (direct SQL via Supabase, schema.prisma synced, prisma generate ran). Stores per-turn `{assistantContent, toolResults}` arrays so tool_use + tool_result blocks survive thread rehydration.
- `runAgent` in `concierge.ts` now accumulates `ToolTurn[]` across iterations and returns them in `AgentResult`. POST `/threads/:id/messages` persists `toolTurns` on the assistant `ChatMessage`. GET rebuild interleaves `assistant(tool_use)` + `user(tool_result)` blocks from history before the final assistant text.
- Verified: thread with a `listTrips` call → "What was the ID of the NY trip?" → AI answered exact UUID, no re-call. Then "Delete the New York one." → AI called `deleteTrip` directly with the right ID, no clarifying re-list. Day 8's "AI loses tool-call context in long threads" bug is fixed.

### Shipped — smart saveTrip

- `saveTripImpl` returns `action: 'created' | 'updated' | 'noop'` instead of `deduped: true/false`. Overlap detection updates the existing `TripLeg` in place via `$transaction` rather than refusing to act.
- System prompt + tool description rewritten to teach the AI about the new response shape, including handling date-change requests by calling `saveTrip` again.
- Verified: "Save Miami June 20-23" → created. "Actually make it June 22-25" → updated in place (no duplicate row, no leaky "system deduplicated" language). AI prose clean: "Done — dates updated to June 22-25, Dan."

### Shipped — deleteTrip hardening (uncovered + fixed mid-session)

- The first smart-saveTrip test revealed a NEW bug: persisted toolResults showed Claude calling BOTH `saveTrip` and `deleteTrip` in the same turn on the just-saved trip. Preamble text claimed it was running saveTrip + searchGyms in parallel, but the actual second tool was deleteTrip. The new trip was correctly created and updated, then immediately deleted.
- Root cause: nothing in the system prompt constrained `deleteTrip` to explicit user delete intent. Tool selection misfired during parallel tool calls.
- Fix: prompt-level — hard rule that `deleteTrip` only fires on explicit user delete words ("delete", "remove", "cancel", "drop", "get rid of"). Date changes, updates, edits are NEVER deletes. Plus the tool description itself now says "Do NOT call alongside saveTrip in the same turn."
- Verified post-fix: same test sequence produced zero `deleteTrip` calls. Two Miami trips in DB (untouched June 3-8, updated June 22-25).

### Shipped — listVisits tool

- New `listVisitsImpl` reads from `GymAccess` joined to `Gym`, returns up to 50 most-recent visits with gym name, address, citySlug, accessType, status (pending/confirmed/denied), visitedAt, confirmedAt. Shape mirrors the existing `/api/visits/all` route.
- Tool definition added to TOOLS, dispatch case added to agent loop, system prompt's capabilities list updated: "list the user's gym visits (passport stamps)" moved from "cannot yet" to "can".
- Verified: "Have I logged any gym visits yet?" → AI calls `listVisits`, gets empty array, replies honestly ("No stamps yet, Dan — your passport is blank!"). No "not wired up yet" leak.

### Shipped — retry on upstream Anthropic errors

- Backend: new `callAnthropicWithRetry` helper wraps `anthropic.messages.create`. `isTransientUpstreamError` returns true for 5xx, 429, and network errors (ETIMEDOUT/ECONNRESET/ECONNREFUSED/EAI_AGAIN, APIConnectionError, APIConnectionTimeoutError). On transient failure: 500ms sleep, retry once, then bubble. Wrap is inside the loop iteration — non-transient errors throw immediately, retries don't re-execute tools.
- Mobile: `ChatMessage` now has optional `failed?: boolean`. The send catch branch sets `failed: true` on the optimistic bubble instead of mutating the message content. New `retrySend(messageId)` removes the failed bubble and re-calls `send` with the original content.
- `MessageBlock` renders failed user bubbles at 55% opacity with a "Failed — tap to retry" link below in accent green.
- Verified on device: airplane mode mid-send → bubble fades, retry link appears. Toggle back on, tap retry → message resends successfully.

### Shipped — rotating loading copy

- New `useLoadingCopy(active)` hook rotates through ['Thinking…', 'Checking your trips…', 'Searching gyms…', 'Pulling it together…'] every 2.5s while sending. Resets to index 0 when inactive.
- Replaces the static "Thinking…" in the sending JSX block. No backend dependency — this is the cheap version. Real per-tool streaming is concierge session 3.
- Verified on device: copy cycles smoothly during agent runs (3-8s typical).

### Lessons logged

- **Persisted tool results aren't just for context preservation — they're also the debugger.** Without `tool_results` in the DB, the speculative-deleteTrip bug would have looked like a Prisma or transaction issue. Reading the actual tool calls Claude made revealed the cause in 30 seconds. This pattern (persist the agent's reasoning trace, read it on bug reports) will keep paying off.
- **Heredoc patches that write the file only at the END are dangerous when multi-anchor.** If any anchor fails mid-script, ALL prior in-memory replaces are lost AND there's no visible diff. Twice today a partial patch left the file in an inconsistent state (loading copy hook called but not declared). Going forward: write the file after each anchor (or fail fast with intermediate writes), or split multi-anchor patches into single-anchor scripts.
- **The placeholder-substitution pattern in Claude's instructions (`PASTE_REAL_UUID_HERE`) kept tripping the workflow.** Multiple curls failed because the literal placeholder string was exported as the variable. Going forward: every command Claude provides ships with real values prefilled from the most recent tool output, no `PASTE_X` markers.
- **`tsx watch` keeps biting** — multiple times today the watcher claimed reloaded but ran stale code. Default: kill the port and restart on every nontrivial backend edit. Five seconds of restart > debugging stale-code phantoms.
- **Trusting the model's preamble text is wrong** — Claude said "I'll save and search for gyms" while actually calling save + delete. Audit toolResults, not assistant prose, when diagnosing weird behavior.

### Files touched

- `packages/api/prisma/schema.prisma` — `toolResults Json?` on ChatMessage
- `packages/api/src/routes/concierge.ts` — full `runAgent` rewrite (persistence + replay), `saveTripImpl` smart-save, `listVisitsImpl` added, `callAnthropicWithRetry` wrapper, deleteTrip prompt hardening, system prompt capabilities updated, tool descriptions tightened
- Supabase: `ALTER TABLE chat_messages ADD COLUMN tool_results JSONB` via SQL editor
- `fitroam-mobile/src/hooks/useChat.ts` — `failed?: boolean` on ChatMessage, `retrySend` function exported, failure branch stops mutating content
- `fitroam-mobile/app/(tabs)/home.tsx` — `useLoadingCopy` hook, MessageBlock signature accepts onRetry, failed user bubbles render retry affordance, loading text rotates

### Pre-existing issues still open (carried)

- Prisma drift on Supabase extensions
- `tsconfig.json` `moduleResolution: bundler` blocks `tsc --noEmit` as CI check
- Prisma 5.22 → 7 upgrade available (do NOT do mid-build)
- `[Gate]` console.log in `app/_layout.tsx` (Phase 5)
- Orphan onboarding files `lifestyle/budget/training/facilities` (Phase 5)
- `API_BASE` hardcoded in 5+ mobile files (Phase 5)

---

## What's next (priority order)

### Next session — pick one
1. **Concierge session 3 — streaming** — Server-Sent Events from backend, mobile reads stream, per-tool status updates ("Searching gyms…", "Saving your trip…") instead of the cheap rotating copy. The proper version of what Day 9 step 6 stubbed in.
2. **Match route DB-first flip** — PostGIS `ST_DWithin` against existing lat/lng, verified gyms ranked first, Google as fallback for thin areas. Unblocks the weekend verification work meaning anything at runtime.
3. **Floating AI FAB across Trips/Profile screens** — modal-overlay pattern, makes the chat reachable from non-Home tabs.

### Founder weekend work (no Claude session)
- Backfill `citySlug` on 290 existing gyms (london-gb / newyork-us / miami-us; Nottingham → null or delete)
- Manual verification of ~300 gyms across 3 cities: dayPass, dayPassPence, dayPassUrl, equipmentTags, verified=true

### Sessions after that
4. Concierge session 4 — `addGymToTrip` tool, full trip-edit surface
5. Concierge session 5 — trust patterns, edge cases, error states in the chat
6. Fake door for concierge auto-book — measure intent rate, no money, no legal
7. Pre-TestFlight cleanup — remove `[Gate]` log, delete orphan onboarding files, error states, ToS/Privacy, App Store metadata, single API_BASE env var
8. TestFlight setup — Apple Developer Program, signing, first build, closed beta 20-50 users in 3 cities
