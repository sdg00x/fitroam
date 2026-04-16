# FitRoam — System Architecture

**Version:** 1.0  
**Status:** Draft  
**Author:** [Your Name]  
**Last Updated:** April 2026  
**Companion doc:** `docs/PRD.md`

---

## Overview

FitRoam is a three-layer system: a React Native mobile client, a Node.js REST API backend, and a set of consumed third-party services. This document describes each layer, how they connect, and the reasoning behind each structural decision.

This document should be updated any time a new service is added, a data store changes, or the request flow is significantly altered.

---

## Layer 1 — Mobile client

**Technology:** React Native + Expo  
**Language:** TypeScript  
**Platforms:** iOS 15+, Android 11+

### Responsibilities

The mobile client is responsible for:
- Rendering all user-facing screens (discovery, routes, parks, community, profile)
- Detecting and managing device location permissions
- Storing JWT tokens securely (using `expo-secure-store`)
- Caching the last-fetched gym and route results for offline access
- Sending typed REST requests to the backend API

### What the client does NOT do

The client contains no business logic. It does not score gyms, calculate match percentages, or call third-party APIs directly. All of that happens in the backend. This is a deliberate architectural decision — it keeps the client thin and testable, and means business logic changes don't require an app store release.

### Key libraries

| Library | Purpose |
|---------|---------|
| `expo-router` | File-based navigation |
| `expo-secure-store` | Encrypted JWT storage |
| `expo-location` | Device GPS access |
| `@tanstack/react-query` | Server state, caching, background refetch |
| `zustand` | Local UI state (profile, filters) |
| `react-native-maps` | Map rendering (Mapbox integration) |
| `@shopify/flash-list` | Performant gym list rendering |

---

## Layer 2 — Backend API

**Technology:** Node.js + Express  
**Language:** TypeScript  
**Hosting:** Railway (start), scalable to AWS/GCP  
**Process manager:** PM2

### API gateway

Every inbound request passes through the gateway before reaching any service. The gateway handles:

- JWT verification (via Clerk SDK)
- Rate limiting (100 requests / minute per user, using `express-rate-limit`)
- Request logging (structured JSON via `pino`)
- CORS headers

No business logic lives in the gateway.

### Core services

The backend is organised into four service modules. Each service owns its own route handlers, validation logic, and calls to its relevant external APIs or database tables.

#### Gym service (`/api/gyms`)

- Accepts a location (lat/lng) and radius from the client
- Checks Redis cache first (TTL: 1 hour, keyed by geohash + radius)
- On cache miss: calls Google Places API for nearby gyms
- Enriches results with opening hours, equipment tags (from our own DB where available)
- Passes raw gym list to the Match Engine
- Returns scored, ranked list to the client
- Writes results to Redis cache for subsequent requests

#### Route service (`/api/routes`)

- Accepts a city name or bounding box
- Queries our PostgreSQL `routes` table for pre-fetched route data
- On empty result: calls Strava Route API and stores result in DB
- Returns routes with distance, elevation, surface type, and GPX download URL

#### Profile service (`/api/profile`)

- Handles CRUD for user fitness profiles
- Validates profile field values against enum allowlists
- Syncs profile to PostgreSQL `users` table
- Profile changes invalidate cached gym recommendations for that user

#### Community service (`/api/community`)

- Calls Meetup API with city + fitness-related keywords
- Filters by "visitors welcome" flag (where available in API response)
- Returns groups sorted by next event date
- Results cached in Redis for 6 hours (community data changes slowly)

### Match engine

The match engine is a pure function — it takes a user profile and an array of raw gym objects and returns the same array sorted by a computed score.

**Score formula (v1):**

```
score = (style_match × 0.40)
      + (price_match × 0.25)
      + (distance_match × 0.20)
      + (equipment_match × 0.15)
```

Each factor is normalised to 0–1 before weighting. The final score is expressed as a percentage (0–100).

Because the match engine is a pure function with no side effects, it is fully unit-testable. This is intentional — the match algorithm is the core IP of the product and must have test coverage from day one.

### Database

**Primary store:** PostgreSQL 15 with PostGIS extension  
**ORM:** Prisma  
**Hosting:** Supabase (managed PostgreSQL)

PostGIS is the key extension. It enables spatial queries like:

```sql
SELECT * FROM gyms
WHERE ST_DWithin(
  location::geography,
  ST_MakePoint($lng, $lat)::geography,
  $radius_metres
)
ORDER BY ST_Distance(location::geography, ST_MakePoint($lng, $lat)::geography);
```

This is a single indexed query that replaces what would otherwise be application-level distance filtering across thousands of rows.

**Core tables:**

| Table | Contents |
|-------|---------|
| `users` | Auth ID, profile fields, preferences |
| `gyms` | Cached gym records from Places API + community contributions |
| `routes` | Running routes with GPX paths, metadata |
| `parks` | Outdoor fitness spaces from OSM + community |
| `community_groups` | Cached Meetup group data |
| `price_reports` | Crowdsourced day pass prices (user-submitted) |

### Cache layer

**Technology:** Redis (via Upstash — serverless Redis, free tier sufficient for Alpha)

Redis sits in front of all expensive external API calls. Cache keys are structured as:

```
gyms:{geohash6}:{radius_m}          TTL: 3600s
routes:{city_slug}                   TTL: 86400s
community:{city_slug}                TTL: 21600s
profile:{user_id}                    TTL: 300s
```

Geohash-based cache keys mean nearby searches (within ~1km of each other) share the same cached result, dramatically reducing Google Places API calls.

---

## Layer 3 — External services

These are third-party APIs consumed exclusively by the backend. The mobile client never calls them directly.

| Service | Used for | Pricing concern |
|---------|---------|----------------|
| Google Places API | Gym discovery, names, hours, ratings | $17/1000 requests — cache aggressively |
| Mapbox | Map tiles, geocoding, reverse geocoding | Free tier: 50k loads/month |
| Strava Route API | Curated running routes | Free for read access |
| Komoot API | Supplemental trail routes | Partnership needed for commercial use |
| OpenStreetMap / Overpass | Calisthenics parks, outdoor gyms | Free and open |
| Meetup API | Community group discovery | Free tier: limited requests |
| Clerk | User authentication, JWT issuance | Free tier: 10k monthly active users |

---

## Request flow — gym discovery

This is the critical path. Every optimisation decision in the architecture traces back to making this fast.

```
1. App sends GET /api/gyms?lat=51.5&lng=-0.1&radius=2000
2. Gateway validates JWT and rate limit
3. Gym service computes geohash for lat/lng
4. Redis checked for cache key `gyms:{geohash}:{radius}`
   └─ Cache HIT  → skip to step 7
   └─ Cache MISS → continue
5. Google Places API called: nearbySearch(lat, lng, radius, type=gym)
6. Results written to Redis cache (TTL 1 hour)
7. Match engine scores each gym against user profile (from JWT claims)
8. Sorted results returned as JSON to client
9. Client renders ranked list; caches to local storage for offline access
```

**Target latency:**
- Cache hit path: < 200ms end-to-end
- Cache miss path: < 1500ms end-to-end (Google Places SLA ~400ms + processing)

---

## Security decisions

| Concern | Decision |
|---------|---------|
| Authentication | Clerk-issued JWTs, verified on every request at gateway |
| API keys | All third-party keys stored as environment variables, never in code |
| User data | Profile data stored in our DB, not in JWT payload |
| GDPR | Users can request full data export and deletion — Prisma schema supports soft-delete |
| HTTPS | All traffic TLS-encrypted; HTTP redirects to HTTPS at infrastructure level |
| Rate limiting | 100 req/min per authenticated user; 20 req/min unauthenticated |

---

## Scalability path

The current architecture is designed for a single-server deployment (Railway) but structured so that scaling requires no rewrites:

- **Database:** Supabase → managed PostgreSQL → read replicas when needed
- **Cache:** Upstash Redis → Redis Cluster when needed
- **API:** Single Express process → multiple processes behind a load balancer → containerised with Docker
- **Services:** Each service module can be extracted into a separate microservice if load requires it — but this should not be done prematurely

The rule: do not add infrastructure complexity until a specific metric (response time, error rate, cost) demands it.

---

## Architecture decision records

Full ADRs are in `docs/adr/`. Key decisions summarised:

| ADR | Decision | Reason |
|-----|---------|--------|
| ADR-001 | React Native over Flutter | Larger talent pool, JavaScript familiarity, faster to hire |
| ADR-002 | PostgreSQL over MongoDB | Relational model fits our data; PostGIS is essential for geo queries |
| ADR-003 | Prisma over raw SQL | Type safety, migration tooling, readable query syntax |
| ADR-004 | Redis for caching | Reduces Google Places cost; sub-millisecond cache reads |
| ADR-005 | Clerk over custom auth | Auth is not our product; Clerk handles edge cases we don't want to own |
| ADR-006 | REST over GraphQL (v1) | Simpler to build and debug; can layer GraphQL later if client needs evolve |

---

## Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 2026 | [Your Name] | Initial architecture draft |

---

*This document lives at `docs/ARCHITECTURE.md`. Update it before merging any PR that changes how services communicate, adds a new data store, or modifies the request flow.*
