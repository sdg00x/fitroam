# FitRoam — PRODUCT v4

**Status:** Living document. Updated when product decisions change.
**Last updated:** May 14, 2026
**Previous versions:** `/docs/archive/PRD_v3.0.md`

This is the canonical spec. If something here conflicts with code, the spec wins until the spec is updated to reflect a deliberate change. Mockups in `/design/v1/` are the visual source of truth.

---

## Part 1 — Vision

### One sentence
FitRoam finds you the right place to train anywhere in the world and makes sure you never overpay or get trapped.

### The deeper why
FitRoam exists because your fitness identity shouldn't pause when life moves you. People who refuse to compromise on training — across travel, relocation, nomadic lifestyles, or just exploring a new city — deserve a tool that travels with them.

The competing apps split the problem badly. Fitness apps know your workout but not the gym in front of you. Gym apps know the gym but not your training. ClassPass exists but locks you into one ecosystem. Google Maps is everywhere but knows nothing about whether the gym suits a Push day. FitRoam closes that gap.

### Audience
Not just gym-heads. The product serves multiple training identities and the people who hold several at once:
- Lifters and strength athletes
- Calisthenics and street workout community
- Runners (road, trail, social run clubs)
- CrossFit / Hyrox / functional training
- Yoga and pilates practitioners
- Swimmers
- People who do several of the above

### Who FitRoam is for
- The traveller who trains (work or leisure)
- The local who explores their own city
- The relocator between cities
- The digital nomad
- The fitness-driven trip planner
- The corporate user whose employer pays (future)
- The hotel guest who needs immediate access (future)

### Who FitRoam is not for
- People who only train at home
- People who don't care which gym they use
- People committed to one local gym with no travel
- People who want a workout programming tool

### Geographic roadmap
UK (launch) → Toronto Y2 → NYC Y2-3 → Europe/US rollout → SE Asia Y4+

### Business model
1. Per-access transaction fee (£1-2) — funded by partner gyms
2. User subscription (£6-8/month) for premium features — trip planning, smart cancellation, savings tracking
3. Gym SaaS (£150-300/month) — partner dashboard for independent gyms
4. Corporate wellness + hotel white-label (future)

---

## Part 2 — Navigation Shell

Four tabs at the bottom of every screen:

| Tab | Purpose | Default state |
|-----|---------|---------------|
| **Home** | Daily personal dashboard | Current city, today's training, next trip, passport status |
| **Explore** | Discovery and search | Current city's gyms, routes, parks |
| **Trips** | Multi-leg trip planning and passport history | Upcoming trips, past trips |
| **Profile** | Identity, training preferences, settings | Stats, training profile, passport visualization |

This replaces the current implementation which uses Discover / Routes / Parks / Profile. The 4-tab shell from the v1 mockups is the correct structure.

---

## Part 3 — Each Tab in Detail

### Home tab

**Purpose:** What FitRoam can do for you today.

**MVP sections, top to bottom:**

1. **Greeting and city header.** "Good morning, [City]" with avatar top-right and message indicator. City name is tappable to open the City Switcher sheet.

2. **Weather card.** Current temperature and condition. If conditions favour outdoor training, a "Good for outdoor" pill appears. Used by the recommendations below.

3. **Today's training card** (sprinkle from B+C). Only shown if `trainingPattern` is set. Displays:
   - The current day's split (e.g. "Push day" if Push/Pull/Legs)
   - Body parts involved
   - Equipment categories needed (cables, dumbbells, bench)
   - Tappable to manually change today's split if needed

4. **Next trip card.** Only shown if there's an upcoming trip within 30 days. Displays:
   - "DEPARTING IN N DAYS" pill
   - Trip name (e.g. "Leeds + Manchester")
   - Date range and total nights
   - Plan progress ("Everything's ready ✓" or "Plan now")
   - Tap to open Trip Detail

5. **Today in [city] strip.** Three cards in a row mixing pillar types — one route, one park, one gym. Personalised to today's training where possible. Each card has a coloured top stripe by pillar type.

6. **Your passport.** Active access records and recent completed visits. Up to 2-3 items. "View all →" link goes to a full passport screen accessible from Profile.

**Out of scope for v1 (validate before adding):**

- **Community near you.** Run clubs and group events near the user. We don't know yet whether community-led discovery will drive engagement. Build after first cohort tells us they want it.
- **Horizontal upcoming trips strip.** Trips tab already shows this; duplication on Home adds noise unless feedback says users want it both places.
- **This month stats card.** Sessions / cities / money saved. Adds emotional payoff but requires real usage data to feel meaningful. Build when there's data to display.

### Explore tab

**Purpose:** Search and discovery across all three pillars.

**Structure:**

1. **Header.** "Explore" title with search icon.

2. **Search bar.** Tappable, opens search overlay. Search across gyms, routes, parks within the current viewing location. Includes a city pill at the right showing the current location — tap to open City Switcher.

3. **Planning mode banner** (only shown if user entered Explore via a trip). Displays: "PLANNING MODE · [City] · Leg N of [Trip Name] · [Dates]". This frames everything in Explore as adding to that trip leg, not booking immediately.

4. **Pillar pills.** Gyms / Routes / Parks. Single select. Default Gyms.

5. **Filter chips.** Horizontally scrollable. Default chips depend on pillar:
   - **Gyms:** All / Strength / Calisthenics / Open now / Under £10 / Good for today (sprinkle)
   - **Routes:** All / Trail / Road / Flat / Hilly / Short (<5km) / Long (>10km)
   - **Parks:** All / Pull-up bars / Rings / Parallel bars / Free / Open 24h

6. **Result list.** Cards by relevance for the current pillar. Top match gets a hero card with photo; subsequent items are list-style.

**Tappable cards:** The entire gym/route/park card is the primary tap target, opening the detail screen. The "I'm going here" button on the card is a secondary quick-action shortcut. Tapping anywhere else on the card opens detail.

**Planning mode behaviour:** Every action — "I'm going here" / "Save to trip" — saves to the trip leg, not creates active access. The CTA label changes from "I'm going here" (live) to "Save to trip" (planning). Smart pricing dial defaults to the leg duration, not 1 day.

### Trips tab

**Purpose:** Plan trips. View planned and past trips. The passport's home.

**MVP sections:**

1. **Header.** "My trips" with "+ Add trip" pill that opens Add Trip flow.

2. **Next up.** The single most imminent trip, full-card. Shows:
   - "DEPARTING IN N DAYS" pill
   - Trip name and dates
   - Plan progress ("Everything's ready ✓" or "Still planning")
   - Legs displayed as a vertical strip with the saved gym per leg and daily rate
   - "OPEN FULL PLAN →" CTA to Trip Detail

3. **Upcoming.** All future trips beyond the imminent one. List form with name, dates, plan status, and a "Plan now →" or "Edit" action.

4. **Past trips.** Completed trips. Shows name, date range, number of sessions, total spend. Tap to view as read-only archive.

**What MVP Trips does:**

- Create a trip with one or multiple legs
- Edit dates or add legs to an upcoming trip
- View saved gyms per leg
- Estimated spend per leg and per trip
- Auto-archive trips when departure date passes
- See completed trips with session count and total spend

**Out of scope for v1 (validate before adding):**

- Editing past sessions (correcting which gym you actually used vs what was planned)
- Multi-city merging when legs are in the same metro
- Run clubs / events inside trips (community surface, post-validation)
- Travel time between legs suggestions
- Trip cost rolled-up summaries beyond the per-leg estimates
- Shared trips (multiple users on one trip)

### Profile tab

**Purpose:** Identity. Stats. Preferences. Account.

**MVP sections:**

1. **Identity card.** Avatar (initials in coloured circle), name, @handle, home city, optional bio. "Edit profile" CTA.

2. **Stats grid.** Four metric cards: Sessions, Cities, Saved, Trips. Numbers in acid green.

3. **Training profile.** Style (e.g. "Strength + Calisthenics"), Pattern (e.g. "Push/Pull/Legs"), Budget, Distance preference, Priority equipment. "Edit →" link opens an editor that lets the user adjust without going through full re-onboarding.

4. **Fitness passport.** Visual stamps per city visited. Country flag + city short name + number of gyms trained there. Grid of 4. "See all →" opens a full passport view with all cities and timeline of visits.

5. **Account.** Notifications, Appearance (light/dark), Sign out.

**Out of scope for v1 (validate before adding):**

- Social counts (Following / Followers / Shared) — depends on whether community surfaces become real
- Payment method UI — only relevant when subscription tier launches
- Sharing your passport externally

---

## Part 4 — Core Flows

### Onboarding flow

Six steps. Steps 4, 5, and 6 are skippable.

| Step | Question | Type | Required |
|------|----------|------|----------|
| 1 | What do you do? | Multi-select activities; first tap becomes Primary | Yes |
| 2 | Where would you want to train? | Multi-select facility types | Yes |
| 3 | How do you live? | Multi-select lifestyle | Yes |
| 4 | What would you spend on the go? | Single select budget | Skippable |
| 5 | What matters most? | Multi-select priorities + distance preference | Skippable |
| 6 | How do you train? | Single select training pattern | Skippable |

**Step 6 detail** (new, B+C sprinkle):

Question: "How do you train?"
Subtitle: "We'll match what gyms you need."

Options (single select):
- Push / Pull / Legs — 3-day rotation
- Upper / Lower — 4-day split
- Full body — every session is everything
- Body-part split — chest day, back day, etc
- I follow a program — Stronglifts, 5/3/1, etc
- I mix it up freestyle

Skip top-right. If user skips, `profile.trainingPattern = null` and the "Today's training" card on Home hides gracefully. The "Good for today" filter chip on Explore doesn't appear. No prompts, no nudges.

### "I'm going here" flow (live, not planning)

1. User taps "I'm going here" on a gym detail screen.
2. "Plan your access" modal opens. User selects number of days via dial (default 1).
3. Smart pricing recommendation appears comparing day-pass cost vs monthly. If monthly is cheaper, defaults to monthly with savings highlighted.
4. User reviews "You're going with" summary.
5. Tap "CONFIRM — I'M GOING":
   - Backend `POST /api/gyms/:id/access` creates a `GymAccess` record with status `active`, `expectedEndDate` calculated
   - Local AsyncStorage saves the visit for Home/Profile display
   - Success banner: "You're going! We'll remind you to cancel before you leave."
   - Modal closes
   - 500ms later, gym's website opens in browser via `Linking.openURL`
6. The detail screen now shows the visit memory ("You trained here · [date]") on subsequent visits.

### Trip planning flow

1. User taps "+ Add trip" on Trips tab.
2. Add Trip sheet opens. User enters:
   - Trip name (auto-suggested from cities, editable)
   - Legs: each leg is `{ city, arriveOn, departOn }`
   - "+ Add another leg" button to extend
   - Reason for the trip (Work / Leisure / Nomad) — optional pills, for the user's own categorisation
3. User taps "CREATE TRIP":
   - Backend creates `Trip` and `TripLeg` records
   - User lands on Trip Detail screen
4. From Trip Detail, user can:
   - Tap a leg to enter planning mode in Explore (city context set to that leg)
   - Save gyms to the leg from Explore
   - Edit dates or remove legs
   - Delete the trip

### City switcher flow

Triggered by tapping the city pill anywhere it appears (Home header, Explore search bar).

A bottom sheet opens with:
1. **Search any city...** text field with Google Places city autocomplete
2. **Quick — Use current location** — switches back to GPS
3. **Your trips** — shows all upcoming trips with their cities; tap any to switch to that city in planning mode
4. **Recent** — last 3-5 cities the user has explored
5. **Browse** — Europe / Americas / Asia chips for casual browsing (post-MVP polish)

Selecting a city updates `viewingLocation` state. The current tab re-renders for that city. If selected from a trip leg, planning mode is active. If selected from search or recent, browse mode (no save target).

### Cancellation reminder flow (post-MVP, but architected for)

Server-side cron checks `GymAccess` records daily for `expectedEndDate` within 3 days where `cancelledAt` is null and `status = active`.

For each match:
1. Send push notification: "Your access at [Gym Name] ends in N days — cancel now"
2. Open the app → directly to the access record
3. User taps "Mark as cancelled" → updates `cancelledAt`, status → `cancelled`
4. Optional: stats card on Profile increments "Saved" if user switched from day-pass to monthly thanks to smart pricing

---

## Part 5 — Cross-Cutting Features

### Smart pricing engine

Calculates whether day passes or monthly membership is the better deal for a given duration.

Inputs: `dayPassPence`, `monthlyPence`, `days`
Output: `recommendation { recommendMonthly: bool, savingPence, savingPercent, headline, subline }`

If monthly saves money, recommendation shows "SAVE N%" badge, green styling, breakdown of "Day passes £X vs Monthly £Y". If day-pass wins, recommendation shows "Day pass is the better deal" with logic.

Currently working. No changes needed for MVP.

### Match scoring

Backend `scoreGyms()` scores each gym 0-100 based on user profile.

Factors:
- Style match (does equipment fit training style)
- Price match (does the gym fit user budget)
- Distance match (is it within user's distance preference)
- Equipment match (specific equipment needs)

**Current behaviour:** Soft floor of 0.65 for gyms with any equipment tags. This prevents commercial gyms from being demoted just because Google Places didn't tag every piece of equipment perfectly.

**Sprinkle behaviour:** When `trainingPattern` is set and `dayOfWeek` maps to a known split day, gyms with matching equipment for that day get a boost AND a "CABLES YOU NEED TODAY" chip on the gym card.

### Fitness passport

Conceptually: the user's training history across cities. Visually: country flags with city short names and gym counts.

Implementation:
- Every confirmed visit is a `GymAccess` record with `citySlug`
- Aggregated by city → shown on Profile and Home
- "See all" view lists cities with all gyms trained at in each
- Country flag derived from `citySlug` mapping

### Visit memory (sprinkle)

When a user returns to a gym they've been to before, the detail screen shows a small line: "You trained here [date] · [Push day if pattern set]".

Implementation: query local AsyncStorage `@fitroam:visits` for matching gymId. Display top match.

### "Good for today" filter (sprinkle)

Only appears if `trainingPattern` is set.

When toggled, filters Explore gym results to those whose `equipmentTags` overlap with the equipment needed for today's split.

Mapping (server-side):
- Push day → cables, dumbbells, bench, smith machine, chest press
- Pull day → cables, bars, rows, pull-up, lat pulldown
- Legs day → squat rack, leg press, leg curl, leg extension
- Upper day → full upper-body equipment
- Lower day → full lower-body equipment
- Full body → free weights at minimum

If the gym lacks tagged equipment for today, it gets demoted but not hidden.

---

## Part 6 — MVP Scope

### Must ship in v1

**Discovery and matching:**
- [x] Gym discovery from Google Places (working)
- [x] Photos, reviews, ratings, opening hours on gym detail (working)
- [x] Sort: Best match / Nearest / Top rated / Best price (working)
- [x] Match scoring with soft floor (working)
- [ ] Filter chips wired to results (currently visual only)
- [ ] Whole gym card tappable to open detail (currently only the "I'm going" button)
- [ ] Good for today filter (new sprinkle)
- [ ] Routes from OpenStreetMap (basic: name, distance, surface, location)
- [ ] Parks from OpenStreetMap (basic: name, equipment tags, location, free/paid)

**Access and passport:**
- [x] "I'm going here" → POST access + local save + open website (working)
- [x] Smart pricing dial (working)
- [x] Visit memory on revisit (new sprinkle)

**Navigation restructure:**
- [ ] Replace Discover/Routes/Parks/Profile with Home/Explore/Trips/Profile
- [ ] Home tab with weather, today's training, next trip, today in city, passport preview
- [ ] Explore tab with editable city, pillar pills, filter chips
- [ ] Trips tab with upcoming trips and past trips
- [ ] Profile tab with stats, training profile, passport visualization

**Trip planning:**
- [ ] Trip schema with `Trip` + `TripLeg` tables
- [ ] API endpoints for create / list / read / update trips
- [ ] Add Trip flow with multi-leg from day one
- [ ] Trip Detail screen with legs grouped, saved gyms per leg, estimated spend
- [ ] Planning mode banner on Explore when entered from trip context
- [ ] "Save to trip" CTA in planning mode (vs "I'm going here" in live mode)

**Editable location:**
- [ ] City switcher sheet with search, quick, recent, trips
- [ ] Tappable city pill on Home header
- [ ] Tappable city pill on Explore search bar
- [ ] `viewingLocation` state separate from GPS

**Onboarding:**
- [x] Steps 1-5 working
- [ ] Step 6 — training pattern question (new)
- [ ] Profile editor to change preferences without re-onboarding

### Out of scope for v1 (validate before building)

We don't assume what users want. We ship the core, gather real usage, and let feedback tell us what to build next.

**Held back until usage proves demand:**

- Community feed and social profile (following, followers, shared)
- Run clubs and group events surfaces
- Cancellation reminder push notifications (architected, not yet built — turn on when first user has an active access for >25 days)
- "Money saved" stats card calculations (needs months of data to be meaningful)
- Payment method UI on Profile (needs subscription tier to exist first)
- "This month" Home tab card
- "Your trips" Home tab horizontal strip
- "Community near you" Home tab section
- Multi-city merging when legs are in same metro
- Map view alongside list view
- Editing past sessions
- "Walk-in to sign up" fallback for gyms without websites
- Trip cost rolled-up summaries beyond per-leg
- Browse cities by region in City Switcher
- Sharing the passport externally

### Adjacent products we won't become

Things FitRoam isn't trying to be. Listed so we stay focused on the gym/route/park passport identity:

- Workout programming or exercise libraries
- Sets, reps, weights logging
- Progression tracking
- Form videos or instructional content
- Diet or nutrition features
- Personal training booking

These belong in other products. FitRoam stays focused. The training pattern question and three sprinkles are the line we walk — knowing your training so the gym recommendations get smarter, without becoming a workout app.

---

## Part 7 — Build Sequence

In order. Each item is a discrete session of work.

1. **Make gym card fully tappable.** Quick win. The whole card opens detail; the "I'm going here" button stays as a quick-action. Small change but the right UX baseline before building more.

2. **Trip schema and API.** `Trip` and `TripLeg` tables in Prisma. Endpoints: `POST /api/trips`, `GET /api/trips`, `GET /api/trips/:id`, `PATCH /api/trips/:id`, `POST /api/trips/:id/legs/:legId/gyms`. Foundation for everything else.

3. **Navigation restructure.** Change tabs from Discover/Routes/Parks/Profile to Home/Explore/Trips/Profile. Existing Discover content becomes Explore. Routes and Parks become pillar pills inside Explore.

4. **Editable location.** Build the City Switcher sheet. Add `viewingLocation` state. Make the city pill tappable on Explore. Search uses Google Places city autocomplete.

5. **Trips tab.** Build with three sections (Next up / Upcoming / Past). Pulls from `/api/trips`. Empty state shows "Plan your first trip" CTA.

6. **Add Trip flow.** Sheet with multi-leg from day one. Save creates Trip + TripLegs. User lands on Trip Detail.

7. **Trip Detail screen.** Legs grouped, gyms per leg, estimated spend, edit and delete actions.

8. **Planning mode in Explore.** Banner at top, save behaviour changes, smart pricing defaults to leg duration.

9. **Home tab.** Greeting, weather, today's training (if pattern set), next trip card, today in city strip, passport preview.

10. **Onboarding step 6.** Training pattern question. Profile editor on Profile tab.

11. **The three sprinkles.**
   - Today's training card on Home (depends on step 10)
   - Good for today filter on Explore
   - Visit memory on gym detail

12. **Routes pillar.** Wire OpenStreetMap data. Basic Route detail screen. Save to trip from Routes.

13. **Parks pillar.** Wire OpenStreetMap data. Basic Park detail screen. Save to trip from Parks.

14. **Profile redesign.** Stats grid, training profile section, passport visualization, account settings.

15. **TestFlight.** Build, upload, distribute to 5-10 testers.

Each item is roughly one focused session of work. Some are larger than others. Total: probably 12-18 working sessions to a real TestFlight build.

---

## Part 8 — Data Model

### Existing (already in Prisma schema)

- `User` — Clerk-managed identity
- `UserProfile` — training style, equipment needs, budget, distance, environment
- `Gym` — Google Places-sourced, with photos, reviews (in openingHours JSON), websiteUrl
- `PriceReport` — user-submitted price data per gym
- `SavedGym` — user's saved/favourited gyms
- `Trip` — destination city, arrives/departs dates *(currently single-leg)*
- `TripGym` — gyms saved to a trip
- `GymAccess` — active access record with `expectedEndDate`, status, citySlug
- `Route` — currently empty, schema in place
- `Park` — currently empty, schema in place

### Required changes for v1

- **Add `TripLeg` table** with fields: `id`, `tripId` (FK), `city`, `citySlug`, `lat`, `lng`, `arriveOn`, `departOn`, `legOrder`
- **Modify `Trip`** to remove direct `destinationCity` / `arrivesOn` / `departsOn` (move to legs); add `name` field
- **Modify `TripGym`** to add `legId` (FK to TripLeg) so saved gyms attach to a leg, not just the trip
- **Add `trainingPattern` to UserProfile** with values like `ppl`, `upper_lower`, `full_body`, `body_part`, `program`, `freestyle`, `null`
- **Add `notes` field to `GymAccess`** for the visit memory feature (free text, optional)

---

## Part 9 — Design System

### Visual identity

- **Background:** Black (`#0a0a0a`) for dark mode, near-white for light mode
- **Accent:** Acid green (`#c8ff57`)
- **Text:** White / off-white for dark mode, near-black for light mode
- **Muted text:** Various rgba(255,255,255,0.5–0.7) opacities
- **Surfaces:** rgba(255,255,255,0.04-0.06) for cards on black
- **Borders:** rgba(255,255,255,0.06-0.1) hairline

### Typography

- **Sans-serif** for everything
- **Bold weights** for headlines, regular for body
- **Sentence case** for everything (no Title Case, no ALL CAPS in headers)
- **Eyebrow text** for section labels: 9-11px, letter-spacing 1.2-1.5px, uppercase, muted colour

### Components

- **Rounded cards** with 10-12px border radius
- **Pills** with 100px border radius for badges and CTAs
- **Chips** for filters with 100px border radius, lighter background
- **CTAs** acid-green background, dark text, 14-16px height
- **Ghost CTAs** transparent with 1px border for secondary actions
- **Cards** are fully tappable as the primary tap target

### Icons

Minimal emoji. Used only when communicating something cultural or content-specific (country flags on the passport, a single emoji in a hero illustration). UI icons are line-style outline icons throughout.

### Motion

Fast and snappy. No long animations. Modal transitions, sheet slides, tab swaps should all feel under 250ms.

---

## Part 10 — Notes and Open Questions

### Strategic clarity

- B+C framing for workout layer is locked in: hint at it through the training pattern question and three sprinkles, don't build workout features themselves
- Multi-leg trips locked in for MVP (revised from initial recommendation of single-leg)
- Editable location is the foundational unlock for trip planning
- Routes and parks shipped in v1 with basic OSM data, not stubbed
- Community feed and stats are out of scope until usage data tells us they're wanted

### Open questions worth revisiting

- **What does "Good for today" actually filter on?** Need to confirm the mapping from training pattern + day of week → required equipment tags. Equipment tag accuracy from Google Places is the limiting factor here.
- **Trip "type" — Work / Leisure / Nomad — does it affect product behaviour?** Or is it just for the user's own categorisation? Currently optional pill in Add Trip flow. Defaulting to user-categorisation only for v1.
- **Should "Past trips" show editable sessions** (i.e. user can correct a visit they took to a gym we didn't recommend)? Decision: read-only archive for v1.
- **Multi-city merging.** If a trip has Leg 1 in Tokyo and Leg 2 in Tokyo (same metro, different neighbourhoods), do we merge or treat as separate? v1: separate.

### Insights captured

- The Reddit user asking for travel-friendly workout app validates direction; informs B+C strategy
- Soft floor (0.65) in match scoring is critical to commercial gym usability
- Cache `>= 10 gyms` threshold prevents sparse-area cache pollution
- User profile is the right place for `trainingPattern`, not a separate table — keeps onboarding state coherent
- "We don't assume, we wait for data" — the discipline that shapes what's in v1 vs held back

---

## Part 11 — How to use this document

**For Claude:** Read this file at the start of any session involving FitRoam. It is the source of truth. If anything in this doc conflicts with what I remember, the doc wins. If I suggest building something not in this doc, flag it and check whether we should update the doc first.

**For the user:** Edit this file when product decisions change. The mockups in `/design/v1/` are the visual truth; this doc is the verbal truth. They should agree. When making major changes, bump the version number in the filename (e.g. `PRODUCT_v5.md`) and archive the prior version to `/docs/archive/`.

**Updates:** Bump the "Last updated" date at the top whenever this changes. Note the reason in the changelog at the bottom.

---

## Changelog

- **v4 — May 14, 2026:** First proper PRODUCT spec. Written end of session that shipped working "I'm going here" flow. Locks in 4-tab navigation, multi-leg trips, B+C strategy, training pattern onboarding, three sprinkle features, basic Routes/Parks pillars from OSM. 12 mockup screens saved to `/design/v1/`. Builds on PRD v3.0 which is archived at `/docs/archive/PRD_v3.0.md`.
