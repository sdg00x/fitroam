# FitRoam — Build Status v2

**Status:** Active build doc. Supersedes BUILD_STATUS.md.
**Last updated:** May 22, 2026
**Goal:** TestFlight in ~6-8 weeks.

---

## What changed from v1

- Routes and Parks pillars removed from build sequence (scrapped — see PRODUCT_v5.md)
- Human concierge build (was 6 sessions) replaced with AI concierge build (4-5 sessions)
- Pre-TestFlight cleanup added as explicit phase

---

## Where we are

### Shipped (cumulative)

**Foundation (Day 1):**
- Backend API (Express, Prisma, Supabase Postgres)
- Match engine v1 with Google Places integration
- Mobile app scaffolding (Expo, four tabs, dark theme)
- Auth (Pattern B — local identity creation)
- Tappable gym cards, gym detail screen, Get Access flow
- Trip schema + multi-leg trip API
- Add Trip flow with Places autocomplete
- Trips tab with real data
- Trip detail screen
- Profile redesign foundation
- 5 strategic docs (PRODUCT_v4, global_roadmap, ecosystem_strategy, founder_manual, concierge_launch_plan, build_status)

**Polish (Day 2 AM):**
- Profile identity editor (push-to-screen, locked email/phone)
- Section-based editor (6 sub-screens, save per section)
- useUser refresh pattern
- Passport detail screen

**Home + Architecture (Day 2 PM):**
- Home tab with five sections (greeting + weather, today's training, next trip, top match, passport)
- OpenWeatherMap integration (backend proxy with 15min cache)
- Training pattern logic (PPL, U/L, full body, body-part split, program, freestyle)
- Real gym photo on Top match card with score pill + tag overlays
- Loading skeleton for Top match card

**Architecture fixes (Day 2 PM):**
- **UserContext refactor** — single source of truth, eliminates per-screen race conditions
- **Auth data plumbing fix** — replaced 6 hardcoded `seed_user_placeholder` calls with `user?.id`
- **Gym detail refactor** — fetches from API on mount, works regardless of navigation entry point
- **GET /api/gyms/:id endpoint** — handles both UUIDs and Google Places IDs, lazy-upserts new gyms

---

## Build sequence to TestFlight

Total estimated sessions: **8-9 sessions** + TestFlight setup.

### Phase 1 — Carryover cleanup (1 session)

Small items pending from previous sessions. Easy wins, build momentum.

- Remove "Hey" from Home greeting
- Sign-up CTA on Profile when no user (real gap — currently no path to create account from Profile)
- Tighten non-gym filter in match engine (personal training studios, wellness centres slipping through)
- Delete orphan trips under `seed_user_placeholder` (6 test trips)
- Visual tweaks on Home Top match card

### Phase 2 — Sprinkles (1 session)

The "smart layer" — what makes FitRoam feel intelligent.

- Today's training → match engine integration (hardcoded equipment hints become real gym queries)
- "Good for today" filter on Explore (chip that filters by today's training equipment)
- Visit memory on gym detail ("You trained here on March 5")

### Phase 3 — AI concierge (4-5 sessions)

The differentiator. See PRODUCT_v5.md for full spec.

**Session 1: Backend AI endpoint**
- New `/api/concierge` endpoint
- Claude or OpenAI integration
- Tool definitions: query match engine, read user profile, read trips, read passport, search gyms by criteria
- Prompt engineering for FitRoam voice and constraints
- Cost monitoring and rate limiting

**Session 2: Assistant UI**
- Sheet-based assistant screen
- Message thread with streaming responses
- Voice input (Expo Speech / device native)
- Action chips inline with messages ("View gym," "Add to trip")

**Session 3: FAB + integration**
- Floating sparkle button on every screen (root layout)
- Settings toggle to hide AI assistant
- Context passing — AI knows what screen the user came from

**Session 4: Actions (Phase 2 of AI concierge)**
- AI can call mutation endpoints (create trip, add gym to trip, get access)
- Confirmation UX before destructive actions
- Error states and fallbacks

**Session 5: Polish and trust**
- Streaming optimization
- Memory across conversations
- Edge case handling
- Trust patterns (sources shown, "I don't know" responses)

**Possible deferral:** If timeline pressure rises, AI concierge can ship in v1.1 instead of v1. Ship gyms + passport + trips + matching first, AI concierge as a press moment 6-8 weeks after first ship.

### Phase 4 — Visual polish pass (1 session)

Screen-by-screen design review. Tighten what's loose. Same dark, focused aesthetic.

- Home
- Explore
- Trips
- Profile
- Gym detail
- Trip detail
- AI assistant

### Phase 5 — Pre-TestFlight cleanup (1 session)

Required before any submission.

- Remove all `seed_user_placeholder` defensive fallbacks (auth is solid now)
- Empty states audit (every screen has an intentional empty state)
- Error states audit (network failures, API errors handled gracefully)
- Onboarding flow review end-to-end
- ToS and Privacy Policy drafts
- App Store metadata (description, screenshots, keywords)

### Phase 6 — TestFlight setup (1 session, can run in parallel)

- Apple Developer Program ($99/year)
- App icons, splash screen
- Signing certificates, provisioning profiles
- App Store Connect setup
- First TestFlight build uploaded
- Internal testing (just you, 1-2 trusted people)

**Recommendation:** Do this earlier than Phase 6 — even now. Set up the infrastructure so when you're ready to ship there's no last-minute Apple-pipeline learning.

### Phase 7 — Beta + iterate (4-6 weeks after TestFlight)

Not a build phase, but a real product phase.

- Invite 20-50 testers from your network + community channels
- Weekly builds based on feedback
- Watch usage patterns, fix what breaks, double-down on what works
- Decide AI concierge launch slot if deferred from v1

---

## Active backlog

Things to do, ordered by phase above:

**Phase 1 — Carryover:**
- [ ] Remove "Hey" from Home greeting
- [ ] Sign-up CTA on Profile when no user
- [ ] Tighten non-gym filter (`isActualGym` in placesService)
- [ ] Delete 6 orphan trips under `seed_user_placeholder`
- [ ] Home Top match card visual polish

**Phase 2 — Sprinkles:**
- [ ] Today's training → match engine integration
- [ ] "Good for today" filter on Explore
- [ ] Visit memory on gym detail

**Phase 3 — AI concierge:** (see breakdown above)

**Phase 4 — Visual polish:**
- [ ] Home, Explore, Trips, Profile, Gym Detail, Trip Detail review

**Phase 5 — Pre-TestFlight:**
- [ ] Remove `seed_user_placeholder` fallbacks
- [ ] Empty/error state audit
- [ ] ToS, Privacy Policy
- [ ] App Store metadata

**Phase 6 — TestFlight setup:**
- [ ] Apple Developer Program
- [ ] Signing pipeline
- [ ] First build

---

## Architectural decisions (cumulative)

1. **Pattern B auth** — local identity creation, AsyncStorage-backed, real auth provider deferred to post-launch.
2. **UserContext** — single source of truth, replaces per-screen AsyncStorage reads.
3. **Gym data — dual ID handling** — `/api/gyms/:id` accepts UUIDs and Google Places IDs, lazy-upserts gyms.
4. **Match engine first, then AI** — AI concierge operates on top of match engine results, not as replacement.
5. **AI constrained to FitRoam data** — no free-roaming LLM, only tools that call FitRoam endpoints.
6. **AI assistant hideable** — user can disable in Settings.
7. **Concierge AI replaces human concierge** — see PRODUCT_v5 reasoning.
8. **Routes and Parks scrapped** — see PRODUCT_v5 reasoning.
9. **Gym-specialist positioning** — see PRODUCT_v5 reasoning.

---

## Known issues / debt

- Diagnostic console.logs cleaned May 22, 2026
- `seed_user_placeholder` fallback still in code as defensive guard — remove in Phase 5
- AI concierge Phase 2 (actions) requires careful error handling — budget extra time
- Voice transcription: use device-native (Expo Speech). No third-party dependency.

---

## Out of scope (do not reintroduce)

- Routes pillar
- Parks pillar
- Outdoor calisthenics maps
- Yoga / climbing / swimming verticals
- Workout programming
- Nutrition
- Social features
- Multi-language at v1

If the urge to add returns, re-read PRODUCT_v5.md "out of scope" section. Then don't.


## Critical issue surfaced — May 22 PM

**Match engine v1 doesn't match the current profile schema.**

The engine was built for an earlier profile shape (`trainingStyle`,
`equipmentNeeds`, `budgetRange`, `environmentPref`). The app now uses
`primaryActivity`, `activities`, `priorities`, `lifestyle`,
`monthlyBudget`, `travelDailyBudget` — and the API maps badly between
them.

Result: gym scores cluster at 51-69% with no real differentiation.
The product's core value (smart matching) is currently not working
the way the rest of the app suggests.

**Phase 1.5 (next session, top priority): match engine v2.**

- Rewrite scoreStyleMatch with proper STYLE_EQUIPMENT_MAP for all 6
  activity options (staying_in_shape, lifting, powerlifting,
  bodybuilding, crossfit, calisthenics)
- Wire priorities into scoring (24hr access, deadlift platform,
  cleanliness, etc — currently ignored)
- Use both monthlyBudget AND travelDailyBudget for context-aware pricing
- Spread scores to 30-95% range, not 51-69% cluster
- Unit tests for each scoring factor
