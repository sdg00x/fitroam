# FitRoam — Project Handoff Document
*Paste this at the start of a new Claude chat to restore full context*

---

## Who I am
I'm building FitRoam as a personal project and potential startup. I'm a developer who has been away from coding and is using this project to rebuild proficiency and build a strong portfolio. I want to do everything the right way — proper documentation, good Git discipline, tested code, professional structure.

## What FitRoam is
A mobile app for fitness-active travellers. Solves the problem of finding gyms, running routes, calisthenics parks, and local fitness communities in new cities — filtered to your training style, budget, and stay length.

Core insight: not just gym discovery, but an **access passport**. Monthly gym fees reframed as "access for your stay" with automatic cancellation reminders before departure. One profile, seamless access across cities.

## What we've built so far

### Documentation (in ~/fitroam repo)
- `docs/PRD.md` — full product requirements, user stories, feature specs (v1.1)
- `docs/ARCHITECTURE.md` — system architecture, three-layer design, request flow
- `docs/DATABASE.md` — full schema with Prisma, all 12 tables documented
- Architecture decision records referenced in ARCHITECTURE.md

### Backend API (~/fitroam/packages/api) — FULLY WORKING
- Node.js + Express + TypeScript
- Prisma ORM connected to live Supabase PostgreSQL database
- All 12 tables live: users, user_profiles, gyms, gym_access, routes, parks, community_groups, trips, trip_gyms, trip_routes, saved_gyms, price_reports
- PostGIS enabled for spatial queries
- `GET /health` endpoint confirmed working
- `GET /api/gyms` endpoint working — returns scored, ranked gyms
- `POST /api/gyms/:id/access` — creates gym_access passport record
- Match engine (src/services/matchEngine.ts) — 6 passing tests
- Seed data — 4 London gyms with price reports in database
- Error handler middleware
- Prisma client singleton

### Match engine scoring (confirmed working)
- style match 40%, price match 25%, distance match 20%, equipment match 15%
- Price display: day pass if known, monthly with "access for your stay" framing if not
- Returns matchScore (0-100), matchReasons array, priceDisplay, priceSubDisplay

### Mobile app (~/fitroam-mobile) — SEPARATE STANDALONE REPO
- Fresh Expo app, NOT inside monorepo (monorepo caused React version conflicts)
- expo-router with 4 tabs working: Discover, Routes, Parks, Profile
- Dark theme: black #0e0e0e background, acid green #c8ff57 accent
- Light mode planned: warm cream #faf7f2 background, forest green #2b4a39 accent
- All placeholder screens currently showing "coming soon"
- Confirmed working on iOS simulator

### Two GitHub repos
1. `github.com/sdg00x/fitroam` — backend, docs, monorepo structure
2. `github.com/sdg00x/fitroam-mobile` — standalone Expo mobile app

## Design direction chosen
Direction B — Bold/Dark mode first with warm light mode option:
- Dark: pure black base (#0e0e0e), acid green accent (#c8ff57), heavy weight typography
- Light: warm cream (#faf7f2), forest green (#2b4a39), same structure
- Feels like Nike Training / Strava dark mode
- Typography: SF Pro, heavy weights (800), tight letter spacing on headings
- Key UI: hero header showing city name, filter chips, featured gym card + compact list

## Design tokens (to be created in fitroam-mobile/src/theme/tokens.ts)
Dark palette: background #0e0e0e, surface #161616, surfaceRaised #1a1a1a, surfaceFooter #111111, accent #c8ff57, accentText #0e0e0e, textPrimary #fff, textSecondary #666, textMuted #444, border #252525, scoreBg #c8ff57, scoreText #0e0e0e
Light palette: background #faf7f2, surface #fff, surfaceRaised #f5f0e8, surfaceFooter #f0ebe0, heroBackground #2b4a39, accent #2b4a39, accentText #fff, textPrimary #1a1410, textSecondary #9a8f82, textMuted #b8ae9f, border #e8e0d4

## Tech stack
- Mobile: React Native + Expo (standalone, not in monorepo)
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + PostGIS on Supabase
- ORM: Prisma
- Auth: Clerk (not yet implemented)
- Cache: Redis via Upstash (not yet implemented)
- Maps: Mapbox (not yet implemented)
- External APIs: Google Places (not yet implemented — using seeded data)

## What needs building next (in order)
1. Design token system in fitroam-mobile (tokens.ts + useTheme hook)
2. GymCard component (featured + compact variants)
3. FilterChip component
4. MatchBadge component
5. Discover screen — fetches from API, renders ranked gym list
6. Make sure API is reachable from simulator (localhost:3000)
7. Auth with Clerk
8. Real location detection
9. Google Places integration (need to add API key to .env)

## API base URL for development
`http://localhost:3000` — API runs locally, simulator can reach it on same machine

## Key files in backend
- `packages/api/src/services/matchEngine.ts` — core scoring logic
- `packages/api/src/services/placesService.ts` — Google Places integration (ready but needs API key)
- `packages/api/src/routes/gyms.ts` — gym endpoints
- `packages/api/src/lib/prisma.ts` — database client
- `packages/api/src/lib/seed.ts` — seed script (already run, data in DB)
- `packages/api/prisma/schema.prisma` — full database schema

## Important context
- I am building this to rebuild coding proficiency AND as a potential startup
- Everything should be done the right way — documented, tested, committed properly
- I want to understand WHY decisions are made, not just copy-paste code
- Portfolio is important — code should look professional on GitHub
- Avoid monorepo complexity for mobile — keep fitroam-mobile standalone
- Do NOT put mobile back into the monorepo under any circumstances

## Current blockers / known issues
- Google Places API key not yet added (using seeded gym data for now)
- Auth (Clerk) not yet implemented — API has placeholder x-user-id header
- Redis not yet set up — caching layer not active
- No real location detection yet — hardcoded London coords in dev

## Personality / working style preferences
- Wants honest assessments, not flattery
- Wants to understand the why behind decisions
- Gets frustrated with circular debugging — always diagnose root cause first
- Prefers to see things working before adding complexity
- Values clean Git history and professional documentation
