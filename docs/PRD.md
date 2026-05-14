# FitRoam — Product Requirements Document
**Version:** 3.0  
**Status:** Active  
**Last Updated:** April 2026  
**Repos:** `fitroam/` (backend) · `fitroam-mobile/` (mobile)

---

## The product in one sentence

**FitRoam finds you the right place to train anywhere in the world and makes sure you never overpay or get trapped.**

---

## The problem

Getting into a gym in an unfamiliar place is surprisingly hard. Every time you arrive somewhere new and want to train, you lose 30–60 minutes Googling gyms, calling to ask about day passes, filling in forms at reception, and handing over your card details to yet another gym. Then you forget to cancel and pay for a month you didn't use.

The problem isn't finding a gym. Google Maps can find a gym. The problem is everything between finding it and being inside it — and everything between signing up and cleanly leaving.

**Three scenarios. One solution.**

- You're in Leeds for 4 days and want to keep training
- You're in Malaga for a week, don't speak Spanish, and want a gym near your hotel
- You're at home in Nottingham and want to try a different gym without committing

Same problem. Same product. Same flow.

---

## What FitRoam is

A fitness passport app. One profile, everywhere. FitRoam finds gyms, running routes, and calisthenics parks that match how you train. It tells you the smartest way to access them for exactly how long you need, gets you as close to the door as possible, and makes sure you never overpay or forget to cancel.

**What makes it different:**

1. **Personalised matching** — not nearest gym, right gym. Matched to training style, budget, equipment needs, and distance tolerance
2. **Smart pricing** — automatically calculates whether day passes or monthly is cheaper for your specific duration
3. **Cancellation reminders** — persistent sequence before your access period ends with direct cancel link. Becomes automatic cancellation as gym partnerships develop
4. **Global from day one** — Google Places and OpenStreetMap mean it works in Malaga, Leeds, Toronto, and Tokyo without a single partnership
5. **Three daily use cases** — gyms, running routes, outdoor parks. Not just a travel tool — a daily fitness companion

---

## What FitRoam is not

- Not a gym directory — Google Maps is a gym directory
- Not a price comparison site — showing prices is not the product
- Not a social fitness app — community is a feature, not the product
- Not global with deep coverage from day one — launches in one city deep, expands carefully
- Not automatic cancellation at launch — starts with persistent reminders, automates progressively

---

## Target users

**Primary — the mobile trainer**

Anyone who trains regularly but not always in the same place:
- Frequent business and leisure travellers
- Digital nomads moving cities every few weeks
- People who have recently moved and haven't committed to a local gym
- Gym-hoppers who prefer variety over commitment
- People between memberships

**Secondary — the local explorer**

Someone based in one city who wants to try different gyms without signing up to each one individually. Lower urgency than the primary user but higher frequency of use.

---

## How it works

### For the user

1. Set up profile once — training style, budget, equipment needs, max distance. Never repeated.
2. Open FitRoam anywhere. App detects location. Shows three best-matched gyms, nearby parks, and recommended running routes.
3. Tap a gym. See price, match reasons, photos, reviews, opening hours.
4. Tap "I'm going here." FitRoam calculates cheapest access for your duration. Deep links to gym sign-up page or provides walk-in guide.
5. When access period ends — FitRoam reminds you to cancel before it costs another month.

**Time from app open to confirmed gym access: under 3 minutes.**

### For the gym (partnership model — future)

Partner gyms receive a commercial relationship with FitRoam. FitRoam agrees a rate for access, pays gyms directly, and handles all user-facing communication. Gyms receive guaranteed revenue from customers they would not otherwise have acquired, with zero admin overhead.

---

## Navigation structure

**Four tabs:**

| Tab | Job | Content |
|-----|-----|---------|
| Home | Anticipate | Today's recommendations, next trip, passport status, community events, insights |
| Explore | Search and discover | Gyms, routes, parks — toggled by content type. Sort by match, nearest, rating, price |
| Trips | Plan ahead | Upcoming trips with pre-prepared gym, route, park recommendations per destination |
| Profile | Manage | Training profile, passport history, payment method, settings, following/followers |

**Social feed** — accessed via chat icon top right on Home. Not a bottom tab. Following feed, nearby activity, shared routes and parks. Strava-style following model.

---

## Feature requirements

### F-01: User profile — P0 · MVP

Single profile that travels with the user:
- Training style (strength, calisthenics, cardio, crossfit, yoga, mixed)
- Equipment preferences (barbells, pull-up bars, cables, etc.)
- Budget range per day (under £10, £10–20, £20–40, any)
- Maximum walking distance
- Saved payment method (Stripe)

Stored locally in AsyncStorage. Syncs to backend on authentication.

### F-02: Gym matching and discovery — P0 · MVP

**Match score algorithm:**
- Training style alignment: 40%
- Price within budget: 25%
- Distance: 20%
- Equipment match: 15%

**Sort options:**
- Best match (default) — ranked by match score
- Nearest — ranked by walking distance
- Top rated — ranked by Google rating
- Best price — ranked by cheapest access option

**Content type toggle in Explore:**
- Gyms — powered by Google Places API with hotel/spa filtering
- Routes — powered by OpenStreetMap and Strava
- Parks — powered by OpenStreetMap outdoor gym nodes

### F-03: Gym detail screen — P0 · MVP (built)

- Real photos from Google Places (up to 4)
- Star rating and review count
- Opening hours expandable by day — today highlighted
- Directions button — opens Apple Maps or Google Maps
- Equipment tags inferred from gym name and type
- Why it matched — match reasons listed
- Google reviews (up to 3)
- Smart pricing modal (see F-04)
- "I'm going here" CTA

### F-04: Smart pricing and access flow — P0 · MVP (built)

Duration dial — 1 to 30 days with quick select (1d, 3d, 7d, 14d, 30d).

Logic:
- If monthly price < (day pass × days): recommend monthly, show saving percentage and cost comparison
- If day pass × days < monthly: recommend day passes, confirm total cost
- If only one option exists: show that option with context

Access tiers:
1. Partner gym — instant QR code or digital pass (future, with partnerships)
2. Online sign-up — deep link to gym website, pre-filled where possible
3. Walk-in — guide card showing what to say, translatable for foreign countries

### F-05: Cancellation reminders — P0 · MVP

When user confirms monthly access:
- Day 27: "Your [Gym] access ends in 3 days — cancel now in 30 seconds" + direct cancel link
- Day 28: "Today's the day — here's the cancel link"
- Day 29: "Looks like you're still active — tap to cancel before you're charged again"

Implemented via Expo push notifications. Persistent until dismissed or cancelled.

Becomes automatic cancellation — FitRoam submits cancellation form on user's behalf — as gym partnerships develop.

### F-06: Real location detection — P0 · MVP (built)

- `expo-location` with foreground permission request
- Reverse geocode to city name for hero display
- Graceful fallback to last known location or manual city search if denied
- Coordinates passed to API for distance calculation and gym search

### F-07: Google Places integration — P0 · MVP (built)

- Text search for "gym", "fitness centre", "crossfit box" near user location
- Filters out hotels, spas, leisure centres with keyword and type matching
- Fetches full place details including photos, reviews, opening hours
- 24-hour database cache to minimise API costs
- Equipment tags inferred from gym name and type

### F-08: Running routes — P1 · Post-MVP

- OpenStreetMap and Strava route data per city
- Distance, elevation, terrain type
- Downloadable for offline use
- User-shareable to social feed
- Shown in Explore (Routes tab) and Home screen today cards

### F-09: Outdoor parks and calisthenics spaces — P1 · Post-MVP

- OpenStreetMap outdoor gym nodes globally
- Equipment tags (pull-up bars, dip stations, rings, etc.)
- Completely free — no partnership required
- Shown in Explore (Parks tab) and Home screen today cards
- User-shareable with photo and equipment confirmation

### F-10: Home screen — P1 · Post-MVP

- Good morning greeting + city name
- Weather strip (Open-Meteo API — free, no key)
- Three today cards: top gym, nearest park, best route
- Next trip card if trip is planned
- Upcoming trips horizontal scroll
- Passport strip — active memberships with days remaining
- Community events near user
- Monthly insights: cities, sessions, money saved

### F-11: Trips planning — P1 · Post-MVP

- Add trip: destination + dates
- FitRoam automatically prepares: matched gyms, routes, parks, community events for those dates
- Trip briefing with tabs: Gyms, Routes, Parks, Events
- Offline downloadable content
- Departure countdown on home screen
- Past trips log with sessions and spend

### F-12: Social feed — P2 · Post-MVP

- Accessed via chat icon top right on Home
- Following and followers — Strava-style model
- Share routes, parks, gyms with real stats
- "Save route" / "Save park" — adds directly to user's FitRoam library
- Tabs: Following, Nearby, Routes, Parks
- No text posts — only fitness content sharing
- Activity indicators showing who's trained recently

### F-13: Walk-in guide card — P1 · Post-MVP

For gyms without online sign-up:
- Clean card showing user's name, training preference, duration, budget
- One-sentence access request in local language (Malaga → Spanish, Berlin → German)
- Directions to gym
- What to expect at the front desk

### F-14: User subscription — P2 · Post-MVP

£6–8/month premium tier:
- Unlimited access requests
- Smart pricing on every gym
- Cancellation management
- Offline routes and parks
- Trip planning with full briefing
- Community features

Free tier: 3 access requests/month, basic discovery, no offline content.

---

## Gym partnership model

**At launch — no partnerships required**

Google Places provides global gym data. Users access gyms through the gym's own website or walk-in process. FitRoam gets them there faster and smarter.

**Partnership model (Phase 2)**

Gyms receive:
- New revenue from customers they wouldn't acquire otherwise
- Zero admin — FitRoam handles all user communication
- Guaranteed payment on regular billing cycle
- Featured placement and priority in matching algorithm
- Customer analytics dashboard

FitRoam receives:
- Agreed access rate (day pass, weekly, or monthly block)
- Right to issue FitRoam digital passes for entry
- Right to cancel memberships on user's behalf

**Partnership acquisition sequence:**
1. Independent gyms in Nottingham — owners accessible, decisions made on the spot
2. Independent gyms in second UK city — use Nottingham case study
3. Regional gym chains — use user data as leverage
4. National chains (PureGym, JD Gyms, The Gym Group) — requires user base to negotiate

---

## Monetisation sequence

| Stage | Model | When |
|-------|-------|------|
| Launch | £1–2 transaction fee per access | MVP |
| Traction | £6–8/month user subscription | 500 MAU |
| Scale | £150–300/month gym SaaS | 5,000 MAU + 50 gym partners |
| Global | Corporate wellness, hotel white label | Series A |

---

## Technical stack

**Backend**
- Node.js + Express + TypeScript
- PostgreSQL + PostGIS on Supabase
- Prisma ORM
- Google Places API (New) — gym discovery
- OpenStreetMap Overpass API — parks and routes
- Stripe — payment processing
- Clerk — authentication

**Mobile**
- React Native + Expo
- expo-router — file-based navigation
- expo-location — GPS detection
- react-native-safe-area-context
- @expo/vector-icons
- TypeScript

**External APIs**
- Google Places — gym data, photos, reviews, opening hours
- Open-Meteo — weather (free, no key)
- OpenStreetMap Overpass — parks and routes (free)
- Strava — curated running routes
- Mapbox — maps and directions

---

## Design system

**Dark mode (primary)**
- Background: #0e0e0e
- Surface: #161616
- Accent: #c8ff57 (acid green)
- Text primary: #ffffff
- Hero: #0e0e0e

**Light mode**
- Background: #ffffff
- Surface: #f8f8f8
- Accent: #c8ff57 (same acid green)
- Hero: #1a1a1a (dark, white text)
- Text primary: #1a1a1a

**Typography:** DM Sans — heavy weights (800), tight letter spacing on headings  
**Tab bar:** Theme-aware — dark on dark mode, white on light mode  
**Icons:** Ionicons via @expo/vector-icons

---

## Design principles

1. **Three, not thirty** — show three gyms, rank hard, the top match is the answer
2. **Speed over completeness** — under 3 minutes from app open to confirmed access
3. **Invisible administration** — every piece of gym admin happens without the user knowing
4. **Honest when it can't deliver** — never pretend to offer instant access when the process is manual
5. **Offline when it matters** — downloaded routes and saved gyms work without connectivity

---

## MVP scope — 2 weeks

**In:**
- Google Places live gym data ✓ (built)
- Sort filters: match, nearest, rating, price ✓ (built)
- Real gym photos from Places API (in progress)
- Profile screen — training style, budget, distance, equipment
- Home screen — lightweight version
- Routes tab — OpenStreetMap real data
- Parks tab — OpenStreetMap real data
- Cancellation reminder — push notification sequence
- Basic 3-screen onboarding
- TestFlight build

**Out:**
- Social feed
- Full trips planning
- Walk-in guide card
- Deep link pre-fill
- Community events
- Automatic cancellation
- Payment storage
- Passport history display
- Insights dashboard

---

## Release phases

### Phase 0 — Now (2 weeks)
TestFlight with 50 invite-only users. Prove the core loop works.

**Gate:** 50 users · 40% return within 7 days · NPS 40+

### Phase 1 — Months 2–6
App Store launch. First revenue. 5–10 gym partnerships in 2 UK cities.

**Gate:** 500 MAU · £2K monthly revenue · 10 gym partners

### Phase 2 — Months 6–18
Product market fit. Seed raise. Toronto pilot. Full social and trips features.

**Gate:** 5,000 MAU · £25K monthly revenue · seed raised · Toronto live

### Phase 3 — Years 2–3
Scale. Series A. NYC launch. 20 cities across 3 countries.

**Gate:** 50,000 MAU · £240K monthly revenue · Series A raised

### Phase 4 — Years 3–5
Global. Series B. US full rollout. Southeast Asia.

**Gate:** 300,000 MAU · £1.5M monthly revenue · Series B raised

### Phase 5 — Years 5–8
Infrastructure. 1M+ MAU. IPO or acquisition. £150M–£500M valuation.

---

## Geography and expansion

| Market | Entry | First city | Why |
|--------|-------|------------|-----|
| UK | Now | Nottingham | Home market, accessible independent gyms |
| Canada | Year 2 | Toronto | English-speaking, similar to UK, less competitive than US |
| US | Year 2–3 | New York | Largest market, most acute cancellation pain, 17M digital nomads |
| Europe | Year 2–3 | Amsterdam, Berlin | High travel frequency, cross-border culture |
| Southeast Asia | Year 4+ | Singapore | Fastest growing fitness market, digital nomad hub |

**US requirements before entry:**
- Delaware C-Corp established
- UK + Canada proof of concept
- 10 NYC gym partnerships pre-signed
- US-based gym partnership hire
- Series A capital with US expansion budget

---

## Risks and mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Google Maps adds training style matching | Critical | Build access management layer fast — maps can't replicate this |
| ClassPass builds consumer travel product | Critical | Gym relationships built on trust beat relationships built on discounts |
| Gym chain builds cross-gym passport | High | Partner with chains rather than compete — FitRoam as their distribution |
| US customer acquisition cost $8–25 per install | High | Target digital nomad communities — free channels, high concentration |
| Low frequency between trips | Medium | Routes and parks create daily use without travel |
| Working capital at scale | Medium | Raise ahead of the problem, structure payments user-first |
| Solo founder execution risk | Medium | Ship MVP fast, validate before scaling, raise to hire |

---

## Open questions

1. What is the legal structure of the gym access relationship? What liability does FitRoam carry if something goes wrong?
2. How much user identity is shared with gyms at check-in? Name and photo only, or more?
3. How does FitRoam handle cities where gyms simply don't offer day passes?
4. When does automatic cancellation replace reminders — what partnerships are required first?
5. How are routes curated for quality? Raw OpenStreetMap data is not a product — curation is required.
6. What is the minimum viable gym partnership agreement — what does the gym actually sign?

---

## Revision history

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 2026 | Initial draft |
| 1.1 | April 2026 | Access passport framing, monthly pricing as flexible stay access |
| 2.0 | April 2026 | Full rewrite — simplified vision, gym partnership model, Nottingham launch city |
| 3.0 | April 2026 | US and Canada expansion integrated, complete navigation structure, social feed spec, revised monetisation, full competitive analysis, corrected valuations, routes and parks as core daily use features, threat mitigations, Phase 5 added |

---

*This document lives at `docs/PRD.md` in the fitroam repository. It is the single source of truth for what FitRoam is and is not. Any feature not described here requires a PRD update before development begins.*
