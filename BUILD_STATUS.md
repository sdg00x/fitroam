# FitRoam — Build Status & Decisions

**Status:** Living document. Updates with every working session.
**Companion to:** PRODUCT_v4.md (the spec), CONCIERGE_LAUNCH_PLAN.md (Stage 1 revenue), global roadmap v2, ecosystem strategy, founder operating manual.
**Last updated:** May 20, 2026 (end of build session)
**Author:** Samuel
**Purpose:** Captures *where we are* as opposed to *where we're going*. Read this to know what's built, what's broken, what's decided, what's next.

---

## Part 1 — How to use this document

PRODUCT_v4 describes what FitRoam is meant to be. This document describes what FitRoam actually is right now, and what we've decided about how to get from here to there.

If anything in PRODUCT_v4 conflicts with what's written here, **this doc wins for current state**, PRODUCT_v4 wins for direction. Conflicts are flagged in Part 8.

Read order for tomorrow-Samuel or any new collaborator:

1. PRODUCT_v4 (vision and spec)
2. This document (reality and decisions)
3. CONCIERGE_LAUNCH_PLAN (revenue model details)
4. Global roadmap (timing and geography)
5. Ecosystem strategy (integration paths)
6. Founder operating manual (hiring, money, distribution)

---

## Part 2 — What's actually built

The state of the codebase as of end of May 20, 2026.

### Backend API (Node + Express + Prisma + Supabase Postgres)

**Schema:**
- `User` (clerkId, email, etc.) — find-or-create on first API request with x-user-id header
- `UserProfile` (preferences from onboarding)
- `Gym` (Google Places data + match scoring fields)
- `Trip` (multi-leg trip container) — `name`, `reason`, `userId`, timestamps
- `TripLeg` — `city`, `citySlug`, `country`, `placeId`, `formattedAddress`, `lat`, `lng`, `arriveOn`, `departOn`, `legOrder`
- `TripGym` (junction between Trip, TripLeg, Gym) — gym saved to a specific leg
- `GymAccess` (a user's commitment to visit a gym) — `accessType` (day_pass/monthly), expected end date

**Endpoints:**
- `GET /api/gyms/discover` — match engine, returns scored gyms for given lat/lng + user profile
- `POST /api/gyms/:id/access` — records a "I'm going here" commitment
- `POST /api/trips` — creates trip with multiple legs
- `GET /api/trips` — lists user's trips
- `GET /api/trips/:id` — single trip detail
- `PATCH /api/trips/:id` — updates trip name, reason, can add legs
- `DELETE /api/trips/:id` — deletes trip and saved gyms
- `POST /api/trips/:id/legs/:legId/gyms` — saves a gym to a leg
- `DELETE /api/trips/:id/legs/:legId/gyms/:gymId` — removes saved gym
- `GET /api/places/autocomplete?q=...` — Google Places search proxy (debounced on mobile)
- `GET /api/places/details/:placeId` — resolves placeId to lat/lng + city + country

**Known issue:** `POST /api/gyms/:id/access` crashes hard if the gymId isn't a valid UUID (e.g. a stale Google Places ID from a pre-DB-reset session). Deferred.

**Auth state:** A single hardcoded `seed_user_placeholder` user existed earlier today. Replaced tonight with real per-user UUIDs generated locally on first sign-up. `x-user-id` header now carries the real user ID.

### Mobile (Expo + React Native + TypeScript)

**4-tab shell:**
- **Home** — placeholder. Real content not yet built (step 9).
- **Explore** — fully functional. Match engine, sort tabs, filter chips, city switcher, planning mode.
- **Trips** — fully functional. Next up hero, Upcoming compact, Past compact. Pull-to-refresh.
- **Profile** — redesigned tonight. Identity card (read-only), stats grid, training profile section, fitness passport preview, account section with sign out.

**Onboarding:**
- 6 steps: Style → Facilities → Lifestyle → Budget → Priorities → Training pattern
- Step 6 (training pattern) added tonight. Skippable. Saves to `profile.trainingPattern`.

**Components built:**
- `GymCard` (featured + compact variants, planning-mode aware)
- `TripCard` (hero + compact variants)
- `PlacePicker` (Google Places autocomplete bottom sheet, optional "Use current location" row)
- `GetAccessForm` (reusable identity capture form, access/signup modes)

**Screens built:**
- `app/(tabs)/index.tsx` — Explore
- `app/(tabs)/home.tsx` — placeholder
- `app/(tabs)/trips.tsx` — Trips list
- `app/(tabs)/profile.tsx` — Profile, redesigned tonight
- `app/gym/[id].tsx` — gym detail with sticky floating "Get access" CTA
- `app/trips/new.tsx` — Add Trip flow, multi-leg, Places autocomplete
- `app/trips/[id].tsx` — Trip Detail with editable name, delete, planning-mode launchpad
- `app/profile/edit.tsx` — Profile editor (one-page, save-on-change, ugly but functional)
- `app/onboarding/*` — six onboarding screens

**Hooks:**
- `useProfile` — preferences from AsyncStorage
- `useUser` — identity (name/email/phone/UUID) from AsyncStorage
- `useLocation` — GPS
- `useViewingLocation` — manual city switcher override, persisted; falls back to GPS
- `useStats` — visit count from local AsyncStorage `@fitroam:visits`

**Libraries:**
- `src/lib/serviceCoverage.ts` — hardcoded service tier per city. Architecture for concierge gating. No cities currently marked `concierge`.
- `src/lib/labels.ts` — slug-to-label translation for all profile values

### Storage keys (AsyncStorage)

- `@fitroam:profile` — preferences (useProfile)
- `@fitroam:user` — identity (useUser, added tonight)
- `@fitroam:viewingLocation` — manual location override (useViewingLocation)
- `@fitroam:visits` — local visit history (used by useStats and gym detail's handleConfirm)

---

## Part 3 — The core architectural decisions made today

These are the binding decisions from the May 20 build session. Anything that contradicts these needs explicit revision.

### Decision 1 — Pattern B for auth

**The pattern:** Use the app without signing up. Capture identity only at the friction moment.

The friction moments that trigger identity capture:
- **"Get access" on a gym (high intent)** — full form, no cancel button
- **Creating a trip (medium intent)** — full form, has cancel
- **Saving a gym to favorites (low intent)** — full form, has cancel

The user might never realize they "signed up" — they just gave details to book a gym.

**Why not Pattern A (signup at app open):** Worst conversion. Forces friction before value.
**Why not Pattern C (anonymous until first paid booking):** Too late — we need email for booking confirmations. Identity at "Get access" works for free flows too.

### Decision 2 — Get Access flow has NO cancel button

The "Get access" sign-up is high-intent. The user committed by tapping the CTA. A "Not now" button kills conversion at the exact moment they were about to convert. System gestures (pull down, back) still work — those are explicit user-initiated escapes, which is different from offering an opt-out.

Trips and favorites keep the cancel button because they're lower-intent moments.

### Decision 3 — Agent of record (not merchant) for concierge

When concierge launches, FitRoam is the user's authorized agent purchasing gym access on their behalf. The user buys the gym pass from the gym via FitRoam as agent. FitRoam takes a service fee.

This means:
- Money flows: user pays FitRoam → FitRoam holds pass cost in trust for gym → FitRoam keeps service fee
- VAT applies only to the service fee, not the pass-through cost
- Legal liability is the service fee, not the underlying product
- Stripe Connect with destination charges (not standard Stripe)
- ToS must be airtight — solicitor budget £500-1500
- Accountant familiar with agent-of-record structures required

Full details in CONCIERGE_LAUNCH_PLAN.md.

### Decision 4 — Concierge is the LAST feature built, not the first

The original PRODUCT_v4 sequence had concierge weighted later but ambiguously. Tonight we made it explicit: concierge is the final feature before TestFlight.

**Why:**
- More product to show before charging users
- Friends-and-family validation period stretches longer
- By concierge launch we have more features shipped, velocity is proven, and the product feels real
- Concierge lands on warm ground (a loved product), not as a payment wall on a half-finished product

### Decision 5 — Visual polish work happens screen-by-screen, deliberately

The earlier polish pass attempt (token reduction, padding bumps, rating word labels, photo fallback gradients) broke the Explore layout. We reverted. Lesson:

- Don't change everything at once
- Test after each change
- Define the design system explicitly before applying broadly
- Visual polish is its own kind of work — not a tax on every feature

Token changes (colors, spacing, radius) cascade across screens. They need their own dedicated, focused pass — not bolted onto feature work.

### Decision 6 — Multi-leg trips with address-level precision from day one

The original schema considered a trip as a single city + dates. We rejected that because "London" returns gyms across all of London — a trip in Shoreditch needs Shoreditch precision.

Solution: a trip has multiple legs. Each leg is a Place (city, neighborhood, hotel, or address) resolved via Google Places. The leg coordinate is the actual lat/lng of that Place, not a city centroid.

Schema reflects this. Add Trip flow uses Google Places autocomplete. Planning mode in Explore uses the leg's precise coordinates.

### Decision 7 — Pricing model v1 with smart pricing

For concierge bookings (when launched):

| Scenario | Margin rule |
|----------|-------------|
| Single day pass | +20% on raw price |
| 2-7 day stay, day passes optimal | +15% on total |
| 2-7 day stay, weekly pass optimal | +25% on the weekly pass |
| 7-30 day stay, monthly pass optimal | +30% on the monthly pass |
| Plus flat £3 concierge fee on every booking | |
| Plus Stripe fees passed through | |

Smart pricing means the system auto-detects which pass type is cheapest for the user's stay length. Where FitRoam saves the user money, margin is higher because value is higher.

**Principle:** users feel grateful, not extorted. £30 markup is fine when the user just saved £170.

Status: v1, attached to "test and adjust based on real bookings."

### Decision 8 — 30-minute SLA, "always get you in or refund instantly"

The strong booking promise. Same-day bookings confirmed within 30 minutes. Advance bookings (24h+ out) confirmed within 4 hours.

This is the public promise. It's harder to deliver than "we'll try" but signals professionalism. Operationally means: 5-15% of bookings will fail, refund flow must be automated via Stripe webhook, refund must hit the user's account within 5 minutes of failure determination.

### Decision 9 — London-only concierge at launch, UK opportunistically

Concierge fulfilment starts in London. Other UK cities (Manchester, Birmingham, Leeds, Edinburgh) added opportunistically based on inbound demand in first 30 days post-launch. International cities wait for Stage 2-3 of the global roadmap.

Discovery (browsing) is global from day one. Concierge fulfilment is geographically gated via `serviceCoverage.ts`.

### Decision 10 — Personal commitment phase: 50-100 manual bookings before any VA help

When concierge launches, Samuel personally handles every booking for the first 50-100 transactions. No virtual assistant, no automation beyond Stripe webhook for refunds.

**Why:** Real data on time-per-booking, which gyms are smooth, which gyms refuse, which are partnership candidates. Plus the founder discipline of doing things that don't scale.

After this phase: bring in a VA, start partnership conversations with the highest-volume gyms.

### Decision 11 — One-page profile editor is interim, section-based is the target

Tonight we shipped a one-screen all-chips profile editor. It works but doesn't feel premium. The target architecture is section-based — six sub-screens (Activities, Facilities, Lifestyle, Training, Budget, Priorities), each with its own Save button.

Deferred to next session. The current editor is fine as a fallback for power users even after section-based ships.

### Decision 12 — Identity editor lives inside the Profile tab

Per Samuel's request: when users want to edit name/email/phone (not preferences), they tap the identity card on the Profile tab. Same `GetAccessForm` component, in update mode rather than signup mode. Currently not implemented — identity card is read-only. Deferred to next session.

### Decision 13 — Service tier per city as the architecture

Concierge isn't a global feature. It's per-city. The data model is a hardcoded `ServiceCoverage` config — `citySlug → { serviceTier: 'concierge' | 'discovery', conciergeHours?: string }`.

For MVP: hardcoded TypeScript file (`serviceCoverage.ts`).
For Stage 2+: becomes a database table.

This architecture is in place. Currently no cities are marked concierge.

---

## Part 4 — Updated build sequence (concierge last)

The original PRODUCT_v4 had 15 steps. We've consolidated and re-ordered. The current sequence:

**Done this session (8 of 15 + extras):**

1. ✅ Tappable gym card fix
2. ✅ Trip schema + 7 API endpoints (multi-leg)
3. ✅ Navigation restructure (Home/Explore/Trips/Profile)
4. ✅ City switcher with Places autocomplete + service coverage architecture
5. ✅ Add Trip flow (multi-leg, Places autocomplete)
6. ✅ Real Trips tab (Next up / Upcoming / Past)
7. ✅ Trip Detail screen (inline editing, delete, planning-mode launchpad)
8. ✅ Planning mode in Explore (save gyms to legs)
9. ✅ Onboarding step 6 — training pattern
10. ✅ Auth foundation — Pattern B (`useUser`, `GetAccessForm`, real user IDs)
11. ✅ Get Access flow on gym detail (rename, sign-up modal, sticky CTA)
12. ✅ Profile tab redesign — identity, stats, training profile, passport preview, account, slug-to-label translation

**Remaining (in order):**

**Tier 1 — Polish existing features (next session):**

13. **Profile editor section-based refactor** — 6 sub-screens, each with Save button
14. **Profile identity editing** — make the identity card tappable, opens update form
15. **Passport detail screen** — `5 cities stamped` is tappable, shows actual cities + gyms + dates

**Tier 2 — Home tab + sprinkles:**

16. **Home tab real content** — weather card, today's training (uses trainingPattern), next trip, today-in-city strip, passport preview
17. **The three sprinkles** — Today's training on Home, "Good for today" filter chip on Explore, visit memory on gym detail

**Tier 3 — Other pillars:**

18. **Routes pillar** — OpenStreetMap data, basic route detail, save to trip
19. **Parks pillar** — OSM again, similar pattern

**Tier 4 — Final polish:**

20. **Visual polish pass** — proper screen-by-screen design system application. The thing we tried earlier and reverted.

**Tier 5 — The big finale (concierge build, 6 sessions):**

21. **Stripe Connect + Booking schema** (real-world: Stripe Connect application, 5-10 day KYC)
22. **Booking flow UI** (mobile)
23. **Ops dashboard** (web at `/ops`, password-protected)
24. **Pricing engine** (smart pricing logic)
25. **Service coverage gating + ToS** (London-only "Book day pass" CTA, ToS acceptance in onboarding)
26. **Email templates + push notifications**

**Then:**

27. **TestFlight beta**
28. **Public launch (London concierge live)**

---

## Part 5 — Known issues and deferred work

Things that work but should be improved when we get to them.

### Functional gaps

- **No way to edit identity (name/email/phone) after sign-up.** Currently typo recovery requires Sign out → re-onboard. Fix: make identity card tappable. (Tier 1, step 14)
- **Training profile rows on Profile tab are not tappable.** Would be nicer to tap "Pattern" → opens just the training section in the editor. (Tier 1, step 13 in spirit)
- **Passport card not tappable.** Should open a detail view of visited cities. (Tier 1, step 15)
- **Saved gym count always shows 0.** The `SavedGym` table exists in schema but no save-to-favorites UI was built. Deferred until Tier 2.

### Bugs

- **`POST /api/gyms/:id/access` crashes on non-UUID gymIds.** Stale Google Places IDs from before a DB reset will trigger it. Needs defensive validation. Low priority since DB resets are dev-only.
- **Compact gym card text wraps oddly on long names** — observed earlier when polish pass increased card padding. Reverted, but the latent issue remains for very long gym names.

### Visual polish backlog

- Sticky CTA on gym detail: floating pill works but padding could still feel softer — wasn't fully nailed.
- Profile screen training profile section: rows are readable but border treatment is plain.
- Stats grid uses raw text labels — could be a tiny icon per stat.
- Accent green still appears too prominently in some places (sort tabs, certain dividers) — the polish pass would address this systematically.
- No design system tokens for type sizes yet. Each screen sets fontSize directly. Adding a `type` token export to `useTheme` is part of the visual polish pass.

### Architectural debt

- All API calls use a hardcoded `http://192.168.0.64:3000` base URL in mobile code. Should become an env var.
- No retry logic on API calls. A single network blip = failed booking attempt. Acceptable for MVP, needs revisiting before public launch.
- `useStats` extracts city from gym address string with crude parsing. Real implementation should use the stored `citySlug` on the GymAccess record or compute server-side.
- No tests anywhere. Acceptable for solo dev / pre-launch. Becomes critical once VA or hire #1 lands.

---

## Part 6 — What's specifically NOT yet built (vs PRODUCT_v4)

If you read PRODUCT_v4 and wonder "is this real yet" — this list answers no.

- **Routes and Parks pillars** — schema not designed, no OSM integration yet. PRODUCT_v4 mentions them as v1 scope; in reality they're Tier 3 (after Home + sprinkles).
- **Smart pricing engine** — concierge plan describes the rules but the engine doesn't exist. Built in concierge session 4.
- **Concierge booking flow itself** — entirely absent from the codebase. Built in concierge sessions 1-6.
- **Service tier UI badges** — `serviceCoverage.ts` exists; the "INSTANT BOOKING" badge architecture is in place; but no city is marked concierge so nothing displays. Will activate the day concierge launches in London.
- **The three sprinkles from PRODUCT_v4 B+C strategy** — Today's training card, "Good for today" filter, visit memory. None built. Tier 2.
- **Calendar integration** — "add to calendar" on booking confirmation mentioned in concierge plan. Not built. Concierge session 2.
- **Notifications** — placeholder on Profile tab says "On" but no actual notifications wired. Push registration happens in concierge session 2.
- **Email infrastructure** — no Resend/Postmark integration. Concierge session 6.
- **Friends-and-family soft launch funnel** — no manual booking ops yet. Concierge launch criteria.

---

## Part 7 — How sessions have been working

Empirical observation, useful for planning future sessions.

- **Average ship rate:** 8-12 working features per full day. Compressed because of session spacing.
- **Three intervals/day rhythm** seems sustainable. Single 8+ hour stretches degrade decision quality (observed late tonight).
- **Strategic docs come out of conversation** — PRODUCT_v4, the roadmap, the ecosystem doc, the founder manual, the concierge plan, this doc — these all emerged when context was rich and decisions needed locking in. Not pre-planned.
- **Real-world tasks always block code.** Stripe Connect KYC, VAT registration, accountant scheduling, business banking — these have lead times of days to weeks. Start them ASAP relative to when they're needed.
- **Sed and node script edits are reliable for surgical changes.** Full-file rewrites via `cat > file << EOF` are reliable for new files but risky for existing complex files (whitespace mismatches break replacements).
- **Visual polish is its own session type.** Don't bolt it onto feature work. Don't change all tokens at once.

---

## Part 8 — Conflicts with PRODUCT_v4 that need reconciling

PRODUCT_v4 was written before today's session. A few things have shifted since:

| PRODUCT_v4 says | Reality says |
|-----------------|---------------|
| Hardcoded UK city list for trip planning | Google Places autocomplete (no city list) |
| Concierge mid-sequence | Concierge is the LAST feature before TestFlight |
| Generic "I'm going here" CTA | "Get access" with auth-aware behavior + sticky floating pill |
| Routes and Parks in v1 scope | Deferred to Tier 3, after Home tab + sprinkles |
| Profile tab as simple settings | Identity + stats + training profile + passport preview + account |
| Single-screen profile editor | One-screen interim; section-based is the target |
| Auth assumed but not specified | Pattern B locked in: use without signup, capture at friction moment |
| Pricing model TBD | v1 smart pricing rules locked in (see Decision 7) |
| London + UK as launch geography | London-only at launch, UK opportunistic |

**Reconciliation plan:** PRODUCT_v4 gets an update pass once next session settles. This doc continues to be the source of truth for current reality.

---

## Part 9 — What to start with next session

Three credible starting points, with my recommendation flagged.

**Option A — Finish Profile redesign (Tier 1: steps 13, 14, 15)**

About 45-60 minutes. Section-based editor + identity editing + passport detail screen. After this, the Profile tab is fully done.

This is the "tie up loose ends" choice. Pro: closes out work cleanly. Con: still no new value for users.

**Option B — Home tab real content (Tier 2: step 16)**

About 90 minutes. Weather endpoint, weather card, today's training (uses trainingPattern), next trip card, today-in-city strip, passport preview. Transforms the placeholder Home tab into the daily-use surface.

This is the "biggest visible value" choice. Pro: makes the app feel real on first open. Con: leaves the Profile loose ends.

**Option C — Three sprinkles (Tier 2: step 17)**

About 60 minutes. Today's training on Home + Good for today filter on Explore + visit memory on gym detail. These make the B+C strategy from PRODUCT_v4 actually visible.

This is the "show off the smart system" choice. Pro: completes the intelligence layer that's already half-built (trainingPattern exists but unused). Con: smaller individually but cumulative impact is high.

**My recommendation: Option A first, then Option C, then Option B.**

Reasoning: A is small and finishes a thread. C builds on A naturally (training pattern editor → today's training sprinkle uses that pattern). B is bigger and benefits from a fresh session because it touches several APIs.

But also legitimate: do B first if the placeholder Home tab is the thing that's most bothering you.

---

## Part 10 — Open questions to revisit

Things deliberately not locked here because they need more context.

- **Avatar upload.** When does it land? Probably Tier 4 (visual polish) or Stage 2.
- **Friends invite / referral.** Founder manual mentioned this as a distribution channel. No spec yet.
- **Magic link auth proper.** Currently identity is local-only. When does it become server-side? Likely concierge session 1 (Booking schema needs persisted users anyway).
- **Web app or mobile-only?** PRODUCT_v4 implies mobile-first. Concierge ops dashboard at `/ops` will be web (it's just for Samuel). Public web product is Stage 3+.
- **Internationalization.** No i18n in the codebase. All copy is hardcoded English. Becomes a Stage 2 concern when Toronto launches.
- **Apple sign-in.** App Store guidelines require it if you offer third-party social logins. We don't yet — pure email-based. Concierge session 1 decides if magic link suffices.

---

## Part 11 — Reading order for any future session

1. Open this doc first. Read Part 4 (sequence) and Part 5 (known issues).
2. Cross-reference PRODUCT_v4 for what the feature is meant to do.
3. Check CONCIERGE_LAUNCH_PLAN if the work touches money, identity, or service tier.
4. Check ecosystem strategy if the work touches integrations.
5. Build.
6. At end of session, update this doc with: what was built, any new decisions, any new known issues.

---

## Changelog

- **May 20, 2026:** Initial document. End of a session that shipped 8 features end-to-end, the planning/auth foundation, and the Profile tab redesign. Locks in 13 architectural decisions, updated build sequence with concierge last, full backlog of known issues.

## Day 2 PM additions to backlog

### Bug: Non-gym results in Explore
Match engine returns personal trainers and wellness studios that aren't actual gyms (e.g. "Bear Fitness Personal training", "Time2rejuven8"). The `isActualGym` filter in `placesService.ts` isn't catching them.

Fix approach (next session):
- Tighten name filtering — exclude "personal training", "rejuven", "wellness", "massage"
- Check Google Places `types` array more strictly — only allow `gym` or `health_club`, not just `establishment`
- Consider a manual blocklist for repeat offenders
- Maybe add a confidence score and threshold

### Pending small items
- Remove "Hey" from Home greeting (visual)
- Sign-up CTA on Profile when no user (real gap — user can't sign up from Profile tab)
- Visual polish on Home Top match card (real photo landed, but card could feel a bit more premium)

### Sprinkles still on docket (step 17 in build sequence)
- Today's training → match engine integration (currently hardcoded equipment hints)
- "Good for today" filter on Explore (based on training pattern)
- Visit memory on gym detail (remember user's last visit, surface it)
