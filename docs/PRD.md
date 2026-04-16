# FitRoam — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Author:** [Your Name]  
**Last Updated:** April 2026  
**Repository:** `fitroam/`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Goals and Success Metrics](#4-goals-and-success-metrics)
5. [Non-Goals](#5-non-goals)
6. [User Personas](#6-user-personas)
7. [User Stories](#7-user-stories)
8. [Feature Requirements](#8-feature-requirements)
9. [External API Dependencies](#9-external-api-dependencies)
10. [Technical Constraints](#10-technical-constraints)
11. [Design Principles](#11-design-principles)
12. [Release Phases](#12-release-phases)
13. [Risks and Mitigations](#13-risks-and-mitigations)
14. [Open Questions](#14-open-questions)
15. [Revision History](#15-revision-history)

---

## 1. Overview

FitRoam is a mobile application for fitness-active travellers who want to maintain their training routine while moving between cities and countries. It removes the friction of finding, comparing, and choosing gyms, running routes, outdoor training spaces, and local fitness communities — all filtered through the user's personal training profile and travel timeline.

The core insight: **a traveller's fitness needs are not generic**. Someone who trains calisthenics needs rings and bars, not treadmills. Someone on a 3-day layover needs a day pass, not a monthly membership. FitRoam makes the right match automatic.

---

## 2. Problem Statement

Fitness-active travellers currently face the following compounding friction points:

- **Discovery is fragmented.** Finding gyms requires Google searches, individual website visits, and manual price comparisons — repeated for every new city.
- **Day pass pricing is opaque.** Most gyms do not publish day pass or short-stay rates online. Users must call or walk in.
- **No training-style filtering exists.** Generic maps show all gyms equally. A powerlifter and a yoga practitioner see the same list with no relevance ranking.
- **Running routes require separate tools.** Apps like Strava show routes but are not integrated with gym discovery or trip planning. Users must context-switch between apps.
- **Outdoor and calisthenics spaces are invisible.** Free outdoor training parks, pull-up bars, and open fields are not surfaced by any mainstream fitness app.
- **Local fitness communities are hard to find.** Meetup groups, run clubs, and workout crews exist in every major city but require separate research to locate.

The cumulative effect is that many travelling athletes either skip training, pay over the odds for convenience, or spend significant time on research that should take minutes.

---

## 3. Target Users

**Primary:** Fitness-active solo travellers — digital nomads, business travellers, backpackers, and frequent flyers — who train regularly (3+ times per week) and want to maintain their routine while abroad. They are self-directed, comfortable with mobile apps, and value efficiency.

**Secondary:** Travelling athletes (team sports, martial arts, competitive fitness) who need specialist equipment or coaching access when away from their home gym.

**Out of scope for v1:** Group travellers, fitness tourism (holidays planned around fitness destinations), gym operators and partners.

---

## 4. Goals and Success Metrics

### Product goals

| Goal | Description |
|------|-------------|
| Reduce discovery friction | A user should go from landing in a new city to a confirmed gym visit in under 3 minutes |
| Personalised matching | At least 80% of recommended gyms should be rated as relevant by the user after visiting |
| Pre-trip planning | Users can research and plan their fitness options before they travel, not only on arrival |
| Community connection | Users find at least one relevant local fitness group per destination |

### Success metrics (v1 launch targets)

| Metric | Target |
|--------|--------|
| Time-to-gym (discovery to decision) | < 3 minutes |
| Profile completion rate at onboarding | > 70% |
| Weekly active users / monthly active users (WAU/MAU) | > 40% |
| Gym match rating (user-rated relevance) | > 4.0 / 5.0 |
| 30-day retention | > 35% |

---

## 5. Non-Goals

The following are explicitly out of scope for v1 and should not be built unless the scope changes through a formal revision:

- **Gym booking or payment processing.** FitRoam surfaces gyms and links out — it does not handle transactions.
- **In-app class scheduling.** Class booking is a separate product vertical.
- **Gym partner dashboards.** A gym management or listing portal is a future B2B product.
- **Nutrition or meal planning.** Not relevant to the core travel fitness problem.
- **Wearable device integration.** May be added post-v1 based on user demand.
- **Social features (in-app messaging, friend lists).** Community discovery is in scope; a social network is not.

---

## 6. User Personas

### Persona A — The Digital Nomad (Primary)

**Name:** Adaeze, 29  
**Situation:** Works remotely as a UX designer. Moves cities every 3–8 weeks. Trains strength + calisthenics 4x per week.  
**Pain points:** Every city requires 30–60 minutes of gym research. Day passes are often £15–25 at tourist-facing gyms. Can never find outdoor calisthenics parks.  
**What she needs:** Fast, pre-trip gym shortlist matched to her style and budget. Offline access to routes once downloaded.

### Persona B — The Business Traveller (Primary)

**Name:** Marcus, 36  
**Situation:** Sales lead at a tech company. Travels 10–15 nights per month. Runs 3x per week and lifts 2x.  
**Pain points:** Hotels recommend hotel gyms (poor equipment) or expensive nearby gyms. Has no time to research; needs answers immediately.  
**What he needs:** One-tap gym suggestion on arrival. Running routes pre-planned for the next morning. No commitment pricing.

### Persona C — The Extended Traveller (Secondary)

**Name:** Priya, 24  
**Situation:** Travelling Southeast Asia for 6 months. Budget-conscious. Trains bodyweight and runs.  
**Pain points:** Monthly gym memberships are commitment she can't use. Free outdoor alternatives are invisible on maps.  
**What she needs:** Free and low-cost options surfaced prominently. Calisthenics parks. Community runs she can join without knowing anyone.

---

## 7. User Stories

User stories follow the format: *As a [persona], I want to [action], so that [outcome].*

### Onboarding

- As a new user, I want to set my training style, budget, and preferred gym features once, so that all future recommendations are automatically personalised.
- As a new user, I want to see why each question matters during onboarding, so that I understand the value of providing the information.

### Gym discovery

- As a travelling user, I want to see a ranked list of gyms near my current location filtered by my training profile, so that I don't have to manually compare irrelevant options.
- As a travelling user, I want to see day pass, weekly, and short-stay pricing for each gym, so that I can choose based on my actual stay length.
- As a travelling user, I want to understand how far each gym is in walking and transit time (not just distance), so that I can make a realistic decision.
- As a travelling user, I want each gym rated for its match to my training style, so that I immediately know which is most relevant to me.
- As a travelling user, I want to save gyms I like to a favourites list, so that I can return to them on future visits.

### Route planning

- As a travelling user, I want to see curated running routes in my destination city before I arrive, so that I can plan my morning run without researching on the day.
- As a travelling user, I want routes filtered by distance, terrain type (road, trail, track), and safety profile, so that I find a route that matches my preference.
- As a travelling user, I want to download routes for offline use, so that I don't need mobile data while running.

### Parks and outdoor spaces

- As a calisthenics trainer, I want to find outdoor bars, rings, and parallettes near me, so that I can train without paying for a gym.
- As an outdoor fitness enthusiast, I want to find open fields, tracks, and quiet public spaces suitable for training, so that I can exercise in an environment I prefer.

### Community

- As a solo travelling athlete, I want to find local fitness meetups and run clubs in my destination city, so that I can train with people who share my style.
- As a visitor, I want to filter community groups by "visitors welcome" or "open to drop-ins", so that I don't feel like an outsider joining a tight-knit group.

### Pre-trip planning

- As a user planning an upcoming trip, I want to enter a destination and travel dates and receive a full fitness briefing for that city, so that I arrive prepared.

---

## 8. Feature Requirements

Each feature is tagged with its release phase (see Section 12) and a priority level: **P0** (must ship), **P1** (should ship), **P2** (nice to have).

---

### F-01: Fitness Profile

**Phase:** Alpha | **Priority:** P0

The fitness profile is the engine behind all personalisation. It must be completed at onboarding and editable at any time from settings.

**Required profile fields:**

| Field | Options | Purpose |
|-------|---------|---------|
| Training style | Strength, calisthenics, cardio, crossfit, yoga/mobility, mixed | Primary filter for gym type matching |
| Equipment needs | Free weights, barbells, machines, bodyweight only, pool | Secondary filter |
| Budget (per day) | Under £5, £5–10, £10–20, £20+ | Filters day pass pricing |
| Acceptable travel distance | 5 min, 10 min, 20 min, 30 min, any | Radius filter for search |
| Preferred environment | Indoor gym, outdoor only, both | Top-level split |
| Stay length preference | Day pass, 2–3 day, weekly, flexible | Surfaces correct pricing tier |

**Acceptance criteria:**
- Profile can be completed in under 2 minutes
- All recommendations reflect current profile settings immediately on save
- Profile persists across sessions and devices (cloud-synced)

---

### F-02: Gym Finder

**Phase:** Alpha | **Priority:** P0

The core feature. Surfaces gyms near the user's current or searched location, ranked by a match score derived from their profile.

**Match score algorithm (v1):**

The match score (0–100) is calculated as a weighted sum:

| Factor | Weight |
|--------|--------|
| Training style alignment | 40% |
| Pricing within budget | 25% |
| Distance within tolerance | 20% |
| Equipment match | 15% |

**Data displayed per gym:**

- Name, address, distance (walking and transit minutes)
- Day pass price, weekly price, monthly price (where available)
- Equipment tags (free weights, barbells, cables, etc.)
- Opening hours and whether currently open
- Match score percentage and primary match reason ("Matched: free weights + day pass")
- User reviews pulled from Google Places

**Acceptance criteria:**
- Results load within 3 seconds of location detection
- Day pass price shown where available in data source
- Results update immediately when profile is changed
- Works offline for last-searched location (cached results)

---

### F-03: Running Route Planner

**Phase:** Alpha | **Priority:** P1

Surfaces curated running routes in any city, sourced from Strava Route API and Komoot, with filters matched to user preference.

**Route metadata displayed:**

- Name and brief description
- Distance and estimated duration
- Elevation profile (flat, moderate, hilly)
- Surface type (road, trail, track, mixed)
- Safety rating (traffic exposure, lighting)
- Best time of day (morning, any, avoid at night)
- Download for offline use

**Acceptance criteria:**
- At least 3 routes available for any city with population > 500,000
- Routes downloadable before travel (pre-trip mode)
- Offline maps available after download (no data required while running)

---

### F-04: Outdoor and Calisthenics Parks

**Phase:** Alpha | **Priority:** P1

Discovers free and low-cost outdoor fitness infrastructure near the user.

**Space types surfaced:**

- Calisthenics parks (pull-up bars, dip stations, monkey bars)
- Outdoor gym installations
- Athletic tracks (400m running tracks)
- Open fields suitable for training
- Beach access points suitable for running or bodyweight training

**Data sources:** OpenStreetMap (`leisure=outdoor_gym`, `sport=calisthenics`), Street Workout global map API, Google Places (outdoor gym category).

**Acceptance criteria:**
- Spaces shown on map with equipment tags
- Filter by equipment type (bars, dips, rings, track)
- "Free only" filter surfaces no-cost options exclusively

---

### F-05: Community Discovery

**Phase:** Beta | **Priority:** P1

Surfaces local fitness groups, run clubs, and workout communities in the destination city.

**Group metadata displayed:**

- Group name, type (run club, calisthenics crew, CrossFit affiliate, etc.)
- Next scheduled meetup (date, time, location)
- Attendee count
- Visitors welcome flag
- Link to Meetup or Facebook Group page

**Data sources:** Meetup API, manual curation for cities with strong fitness communities but low Meetup usage.

**Acceptance criteria:**
- At least 2 relevant groups surfaced per major city
- "Visitors welcome" filter is accurate and verified
- Groups sorted by next upcoming event date

---

### F-06: Pre-Trip Planner

**Phase:** Beta | **Priority:** P1

Allows users to enter an upcoming destination and travel dates and receive a packaged fitness briefing before they travel.

**Briefing contents:**

- Top 3 matched gyms for the stay length
- 2 recommended running routes (downloadable)
- Nearest calisthenics park
- Upcoming community events during travel window

**Acceptance criteria:**
- Available for any destination, not only current location
- Briefing exportable as a saved "trip" accessible offline

---

## 9. External API Dependencies

| API | Purpose | Pricing model | Risk |
|-----|---------|--------------|------|
| Google Places API | Gym discovery, reviews, opening hours | Pay per request (free tier: $200/month credit) | Day pass pricing not available — requires crowdsourcing layer |
| Mapbox | Maps, routing, geocoding | Free tier: 50,000 map loads/month | Low |
| Strava Route API | Running route data | Free for read access | Route data quality varies by city |
| Komoot API | Running routes (especially trail/outdoor) | Partnership required for commercial use | Requires agreement for v1 |
| OpenStreetMap / Overpass API | Outdoor gym and calisthenics park data | Free and open | Data quality inconsistent in some regions |
| Meetup API | Community group discovery | Free tier limited; paid plan for production | Limited coverage outside Western markets |

**Known gap — day pass pricing:** No API currently provides reliable day pass pricing data. This is the most significant data gap in v1. Mitigation strategy: (1) crowdsource from users post-visit, (2) build a gym partner portal in v2 where gyms self-report pricing, (3) display "contact for day pass rate" where data is unavailable.

---

## 10. Technical Constraints

- The app must work on iOS 15+ and Android 11+.
- Core discovery features must function with degraded or no network connectivity (offline-first for cached data).
- Location permissions are required for core functionality. The app must gracefully handle permission denial with a manual search fallback.
- All user data storage must comply with GDPR (EU) and UK GDPR. A privacy policy must be published before any public testing.
- The backend must be designed to scale horizontally — the architecture should not require a full rewrite to go from 100 users to 100,000 users.

---

## 11. Design Principles

These principles should be referenced when making product decisions, especially under time pressure or ambiguity.

**1. Speed over completeness.** A fast, relevant shortlist is more valuable than an exhaustive list. Never show more than 5–7 gyms at once. Rank hard, truncate confidently.

**2. Profile-first, location-second.** The match score matters more than distance. A 25-minute gym that perfectly matches the user's training style is a better result than a 5-minute gym with no free weights.

**3. Reduce decisions, don't multiply them.** Every screen should leave the user with fewer decisions to make, not more. Avoid surfacing filters or options the user didn't ask for.

**4. Offline is not a feature, it's a requirement.** Travellers are often without reliable data. Any screen that a user would need while out training must work without connectivity.

**5. Trust through transparency.** If data is uncertain (e.g. day pass price not confirmed), say so clearly. Never display stale or unverified data as if it is confirmed.

---

## 12. Release Phases

### Alpha (internal, invite-only — target: Month 4)

Build the core loop. Enough to validate the main hypothesis: that profile-based matching meaningfully reduces gym discovery time.

- F-01: Fitness Profile
- F-02: Gym Finder (basic match score, Google Places data)
- F-03: Running Route Planner (read-only, no offline)
- F-04: Outdoor Parks (basic map view)

**Success gate:** 10 real travellers use it in a real city. At least 7 rate gym suggestions as relevant.

### Beta (closed beta — target: Month 7)

Add depth and community features. Validate retention.

- F-05: Community Discovery
- F-06: Pre-Trip Planner
- Offline route downloads
- Profile-to-result feedback loop (user rates gym visit, score improves)
- Crowdsourced day pass price contributions

**Success gate:** 100 MAU, 40% WAU/MAU, NPS > 30.

### v1.0 Public Launch (target: Month 10)

Stable, polished, App Store and Google Play listed.

- All features from Alpha and Beta
- Onboarding redesign based on Beta feedback
- Partner gym data (direct integrations for day pass booking links)
- Marketing site live

---

## 13. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Day pass pricing data is unavailable for most gyms | High | High | Crowdsourcing layer from day one; label unconfirmed data clearly |
| Google Places API costs exceed budget at scale | Medium | High | Cache aggressively; implement request batching; set hard spend limits |
| Strava / Komoot route data is sparse for emerging cities | Medium | Medium | Supplement with OpenStreetMap routes; allow user-submitted routes in Beta |
| App Store review rejection due to location permissions | Low | Medium | Follow Apple/Google guidelines exactly; provide clear permission rationale copy |
| Low retention if users don't travel frequently | Medium | High | Ensure the app is useful even locally (local gym discovery is also a valid use case) |

---

## 14. Open Questions

These questions are unresolved and should be answered before Beta launch.

1. **Day pass pricing strategy:** Should we build a crowdsourcing incentive model (e.g., reward users who contribute verified prices)? Or pursue gym partnerships from the start?

2. **Monetisation:** What is the business model? Options to evaluate: (a) freemium with premium profile features, (b) affiliate commission from gym day pass bookings, (c) gym partner subscriptions for featured placement. This must be decided before v1.0.

3. **Data freshness:** How often do we re-query Google Places for updated gym data? What is the acceptable staleness window?

4. **Emerging markets:** Is the initial scope limited to Western Europe and North America where data quality is highest? Or do we launch globally from the start?

5. **User-submitted gyms:** Should users be able to add gyms that are not in Google Places? If yes, what is the moderation workflow?

---

## 15. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 2026 | [Your Name] | Initial draft |

---

*This document lives at `docs/PRD.md` in the FitRoam repository. Any change to product scope must be reflected here with a version bump and revision entry. Features built without a corresponding PRD entry should be treated as undocumented behaviour.*
