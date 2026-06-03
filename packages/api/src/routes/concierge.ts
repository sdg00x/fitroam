import { Router, Request, Response, NextFunction } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '../lib/prisma'
import { CITY_SLUGS } from '../config/cities'
import { CITY_CENTROIDS } from '../config/cityCentroids'
import { findNeighborhood } from '../config/neighborhoodCentroids'
import { fetchNearbyGyms } from '../services/placesService'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

const HISTORY_LIMIT = 20
const MAX_AGENT_ITERATIONS = 6

// ---------- System prompt ----------
const SYSTEM_PROMPT = `You are FitRoam — a sharp, proactive gym concierge for travelers training in London, New York City, and Miami.

CORE BEHAVIOR: TAKE ACTION
You are an agent, not a chatbot. The user came here for results, not conversation. When you have enough info to act, ACT — don't ask another question to be polite.

- The moment the user gives you a city + dates (even tentative ones), call saveTrip. Don't wait for confirmation. "I might go to Miami June 2-7" = call saveTrip immediately. The user can edit or delete it from their Trips tab if they change their mind.
- If the user changes the dates of a trip already mentioned ("actually June 3-8 not 2-7"), call saveTrip AGAIN with the new dates. The backend detects overlap and updates the existing trip in place — it returns action: 'updated'. Tell the user the dates were updated. Never expose the word "action".
- saveTrip's response includes an "action" field: 'created' (new trip), 'updated' (existing trip's dates were changed), or 'noop' (exact same dates already saved). React naturally to each.
- NEVER call deleteTrip unless the user explicitly uses words like "delete", "remove", "cancel", "drop", or "get rid of" referring to a trip. Date changes, updates, edits, and "actually I meant..." are NEVER deletes — they are saveTrip calls. If you're not sure whether to delete, do NOT call deleteTrip.
- The moment the user gives you a city + a hint of training need (lifting / cardio / area), call searchGyms.
- Never ask permission to do something. Just do it and tell the user what you did.
- Never ask "want me to..." or "should I..." when you have enough info. Just do it.

BOOKING / "SORT IT FOR ME"
- FitRoam can record interest in handling a day-pass booking on the user's behalf for £2.99 per pass. This is a real product offering, currently waitlist-only — we will contact them to arrange it. Use the recordBookingInterest tool.
- NEVER offer this proactively or in passing. Wait for the user to ask using phrases like "sort it for me", "book it", "handle it", "can you sort that out", "I don't want to deal with it".
- When recording: confirm the gym (must be a verified DB gym — Google-fallback gyms cannot be booked) and confirm the user's email. If you don't have their email from prior context, ask for it in conversation BEFORE calling recordBookingInterest.
- After recording, confirm naturally: e.g. "Done — we'll be in touch to sort your Equinox Brickell pass. £2.99 per pass." Do NOT promise immediate booking or a specific timeframe.
- If the gym is a google-fallback (no UUID), say plainly that you can only handle bookings for gyms in your verified network, and suggest a verified alternative if one fits.

VOICE
- Conversational and warm, like a friend who travels constantly and knows every gym scene.
- Don't be terse to the point of feeling robotic, and don't ramble. 1-4 sentences usually. Match the user's energy.
- Use the user's name naturally, not in every message.
- Never expose product mechanics. No "our verified network", "our inventory", "coming soon screen", "drop your email", "waitlist". You just know what's available.

WHEN INFO IS GENUINELY MISSING
- "Hey" or "I need a gym" → ask one short question.
- City but no other detail → call searchGyms anyway with what you have, then refine with the user.
- City + dates but no training focus → save the trip first, then ask about training.

WHEN A CITY ISN'T COVERED
- You cover London, NYC, Miami only. If they mention elsewhere (Dubai, Paris, etc.), say plainly you don't help with that city yet — but if they're also going to a covered city, pivot to that.

WHEN searchGyms RETURNS NOTHING
- Don't dead-end. Offer to flex budget, look at a different area, or note you'll keep watching.
- If nothing fits and the user just wants a plan, save the trip anyway so they don't lose context.

WHEN THE USER ASKS FOR SOMETHING YOU CAN'T DO
- You can: search gyms, save/update trips, list saved trips, delete trips, list the user's gym visits (passport stamps), attach a gym to a saved trip, remove a gym from a saved trip, record interest in FitRoam handling a booking on their behalf.
- You cannot (YET): mark NEW visits, edit profile. These will come.
- If asked for something outside your tools, be honest and short: "Not wired up yet — you can do it from the [Trips/Profile/Passport] tab for now." Don't invent permanent limitations like "I only have your trip info" — that misrepresents the product. The capability is coming; for now the user does it elsewhere in the app.

OUTPUT
You communicate ONLY via the respond tool. Never write plain text. Always end your turn by calling respond with:
- "message": your conversational reply (1-4 sentences typically, more if needed)
- "gymIds": ranked gym UUIDs (empty array if not recommending gyms yet)`

// ---------- Tools ----------
const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'searchGyms',
    description: 'Search gyms in a launch city. Use as soon as the user gives you a city + any training hint. Pass `neighborhood` (e.g. "Brickell", "Soho", "Midtown") when the user mentions one — it narrows the search to that area. Returns { source, center, gyms[] }. `source: "verified-db"` means these are FitRoam-verified day-pass gyms (the moat — surface enthusiastically with day pass details). `source: "google-fallback"` means we don\'t have verified gyms in that area yet — return results from Google but tell the user honestly: "I haven\'t verified these myself — call ahead about day passes." `source: "empty"` means nothing found at all.',
    input_schema: {
      type: 'object' as const,
      properties: {
        citySlug: { type: 'string', enum: CITY_SLUGS },
        activity: { type: 'string', description: 'Primary activity (e.g. "lifting", "crossfit", "cardio").' },
        maxBudgetPence: { type: 'number', description: 'Max day pass price in pence. Omit if no budget given.' },
        neighborhood: { type: 'string', description: 'Area within the city (e.g. "Midtown", "Soho").' },
      },
      required: ['citySlug'],
    },
  },
  {
    name: 'saveTrip',
    description: 'Save or update a trip in the user\'s Trips tab. Call PROACTIVELY when the user mentions a destination + dates. Also call when the user changes dates of an existing trip — the backend detects overlap and updates the existing trip in place. Returns { action: "created" | "updated" | "noop", tripId }. Only skip calling if the exact same dates were already saved this turn.',
    input_schema: {
      type: 'object' as const,
      properties: {
        citySlug: {
          type: 'string',
          enum: CITY_SLUGS,
          description: 'Launch city slug.',
        },
        startDate: {
          type: 'string',
          description: 'ISO date YYYY-MM-DD. If the user said "this weekend" or "next week", resolve to actual dates using today as anchor.',
        },
        endDate: {
          type: 'string',
          description: 'ISO date YYYY-MM-DD. If only one date given, use it for both start and end.',
        },
        reason: {
          type: 'string',
          description: 'Short note about why (e.g. "lifting trip", "work trip"). Optional.',
        },
      },
      required: ['citySlug', 'startDate', 'endDate'],
    },
  },
  {
    name: 'listTrips',
    description: 'Get the user\'s saved trips with dates, destinations, and trip IDs. Use this BEFORE asking the user about their trips — never say "I don\'t know your trips" without checking. Also use before deleting a trip so you have the right ID.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'listVisits',
    description: 'List the user\'s gym visits / passport stamps. Returns up to 50 most-recent visits with gym name, city, date, status (pending/confirmed/denied), and access type. Use when the user asks about their visits, stamps, passport history, where they\'ve trained, or which gyms they\'ve been to.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'deleteTrip',
    description: 'PERMANENTLY delete a trip. Only call when the user EXPLICITLY uses words like "delete", "remove", "cancel", "drop", or "get rid of". Do NOT call as part of an update, edit, or date-change flow — those are saveTrip calls, not deletes. Do NOT call alongside saveTrip in the same turn. If unsure, do not call. Always call listTrips first if you don\'t already have the trip ID in this conversation. Confirm what you deleted in your reply.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tripId: { type: 'string', description: 'The UUID of the trip to delete (from listTrips results).' },
      },
      required: ['tripId'],
    },
  },
  {
    name: 'addGymToTrip',
    description: "Attach a gym to one of the user's saved trips. Use after searchGyms when the user picks a gym (e.g. 'save the first one to my Miami trip') or when context makes it obvious which trip is meant. Call listTrips first if you don't know the tripId.",
    input_schema: {
      type: 'object' as const,
      properties: {
        tripId: { type: 'string', description: 'UUID of the trip from listTrips or saveTrip.' },
        gymId: { type: 'string', description: 'UUID of the gym from searchGyms. Only verified DB gyms (UUIDs) work — google-fallback gyms cannot be attached.' },
        legId: { type: 'string', description: 'Optional UUID of a specific trip leg. Omit if attaching at trip level.' },
        notes: { type: 'string', description: "Optional short note about why this gym (e.g. 'best lifting in Brickell')." },
      },
      required: ['tripId', 'gymId'],
    },
  },
  {
    name: 'removeGymFromTrip',
    description: "Detach a gym from a saved trip. Only use on explicit user request (e.g. 'remove the Equinox from my Miami trip'). Call listTrips first to get tripId and to confirm the gym is attached.",
    input_schema: {
      type: 'object' as const,
      properties: {
        tripId: { type: 'string' },
        gymId: { type: 'string' },
      },
      required: ['tripId', 'gymId'],
    },
  },
  {
    name: 'recordBookingInterest',
    description: "Record that the user wants FitRoam to handle buying a day pass on their behalf. This is a fake-door test — we do NOT actually book anything. Use ONLY when the user explicitly says they want us to 'sort it', 'book it', 'handle it', or similar. The price is £2.99 per pass. Confirm the user's email in conversation first if you don't already have it from context.",
    input_schema: {
      type: 'object' as const,
      properties: {
        gymId: { type: 'string', description: 'UUID of the verified gym they want booked. Google-fallback gyms cannot be booked.' },
        email: { type: 'string', description: "User's email for the waitlist confirmation." },
        tripId: { type: 'string', description: 'Optional UUID of the related trip.' },
      },
      required: ['gymId', 'email'],
    },
  },
  {
    name: 'respond',
    description: 'Send your final reply to the user. Always end your turn with this — never write text outside a tool call.',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: { type: 'string', description: 'Conversational reply, 1-4 sentences typically. No markdown.' },
        gymIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Gym UUIDs from searchGyms results, ranked. Empty if not recommending yet.',
        },
      },
      required: ['message', 'gymIds'],
    },
  },
]

// ---------- Tool implementations ----------
async function searchGymsImpl(args: {
  citySlug: string
  activity?: string
  maxBudgetPence?: number
  neighborhood?: string
}) {
  const city = CITY_CENTROIDS[args.citySlug]
  if (!city) {
    return { gyms: [], error: `Unknown city: ${args.citySlug}` }
  }

  // Choose search center: neighborhood centroid if recognised, else city centroid.
  const hood = findNeighborhood(args.neighborhood, args.citySlug)
  const center = hood ?? { lat: city.lat, lng: city.lng, name: city.city }
  const RADIUS_METERS = 5000

  // Raw SQL: ST_DWithin against gyms within RADIUS_METERS of center.
  // verified DESC, day_pass DESC, rating_count DESC -> moat first, then day-pass first, then popular.
  // dayPass stays a soft preference (ranked), NOT a hard filter, so verified-but-day-pass-unknown gyms still surface.
  type DbRow = {
    id: string
    name: string
    address: string
    day_pass: boolean
    day_pass_pence: number | null
    day_pass_url: string | null
    equipment_tags: string[] | null
    verified: boolean
    rating: number | null
    distance_m: number
  }
  const budgetGuard = typeof args.maxBudgetPence === 'number' ? args.maxBudgetPence : null

  const rows = await prisma.$queryRaw<DbRow[]>`
    SELECT
      id,
      name,
      address,
      day_pass,
      day_pass_pence,
      day_pass_url,
      equipment_tags,
      verified,
      rating,
      ST_DistanceSphere(
        ST_MakePoint(lng, lat),
        ST_MakePoint(${center.lng}, ${center.lat})
      ) AS distance_m
    FROM gyms
    WHERE city_slug = ${args.citySlug}
      AND ST_DWithin(
        ST_MakePoint(lng, lat)::geography,
        ST_MakePoint(${center.lng}, ${center.lat})::geography,
        ${RADIUS_METERS}
      )
      AND (
        ${budgetGuard}::int IS NULL
        OR day_pass_pence IS NULL
        OR day_pass_pence <= ${budgetGuard}::int
      )
    ORDER BY verified DESC, day_pass DESC, rating_count DESC NULLS LAST
    LIMIT 10
  `

  if (rows.length > 0) {
    return {
      source: 'verified-db' as const,
      center: { name: center.name, lat: center.lat, lng: center.lng },
      gyms: rows.map((g) => ({
        id: g.id,
        name: g.name,
        address: g.address,
        dayPass: g.day_pass,
        dayPassPence: g.day_pass_pence,
        dayPassUrl: g.day_pass_url,
        equipment: g.equipment_tags ?? [],
        verified: g.verified,
        rating: g.rating,
        distanceM: Math.round(g.distance_m),
      })),
    }
  }

  // ── Fallback: live Google Places, tagged unverified ──
  try {
    const raw = await fetchNearbyGyms(center.lat, center.lng, RADIUS_METERS)
    const top = raw.slice(0, 10)
    return {
      source: 'google-fallback' as const,
      center: { name: center.name, lat: center.lat, lng: center.lng },
      gyms: top.map((g: any) => ({
        id: g.id ?? g.placeId ?? g.place_id ?? null,
        name: g.name,
        address: g.address ?? g.formattedAddress ?? null,
        dayPass: false,
        dayPassPence: null,
        dayPassUrl: null,
        equipment: g.equipmentTags ?? [],
        verified: false,
        rating: g.rating ?? null,
        distanceM: null,
      })),
    }
  } catch (err) {
    console.warn('[concierge] Google fallback failed:', err)
    return {
      source: 'empty' as const,
      center: { name: center.name, lat: center.lat, lng: center.lng },
      gyms: [],
    }
  }
}

async function saveTripImpl(
  userId: string,
  args: { citySlug: string; startDate: string; endDate: string; reason?: string },
) {
  const centroid = CITY_CENTROIDS[args.citySlug]
  if (!centroid) {
    return { ok: false, error: `Unknown city: ${args.citySlug}` }
  }
  const start = new Date(args.startDate)
  const end = new Date(args.endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { ok: false, error: 'Invalid date format' }
  }

  // Dedupe: don't create if a trip already exists for this user + city + overlapping dates
  const existing = await prisma.trip.findFirst({
    where: {
      userId,
      legs: {
        some: {
          citySlug: args.citySlug,
          arriveOn: { lte: end },
          departOn: { gte: start },
        },
      },
    },
    select: { id: true, name: true },
  })
  if (existing) {
    const oldLeg = await prisma.tripLeg.findFirst({
      where: { tripId: existing.id },
      orderBy: { legOrder: 'asc' },
    })
    const sameDay = (a: Date, b: Date) =>
      a.getUTCFullYear() === b.getUTCFullYear() &&
      a.getUTCMonth() === b.getUTCMonth() &&
      a.getUTCDate() === b.getUTCDate()
    const formatRangeLocal = (s2: Date, e2: Date) => {
      const fmt = (d: Date) =>
        d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      return s2.getTime() === e2.getTime() ? fmt(s2) : `${fmt(s2)} – ${fmt(e2)}`
    }
    if (oldLeg && sameDay(oldLeg.arriveOn, start) && sameDay(oldLeg.departOn, end)) {
      return { ok: true, action: 'noop', tripId: existing.id, tripName: existing.name }
    }
    if (oldLeg) {
      const previousDates = formatRangeLocal(oldLeg.arriveOn, oldLeg.departOn)
      const newName = `${centroid.city}, ${formatRangeLocal(start, end)}`
      const updated = await prisma.$transaction(async (tx) => {
        await tx.tripLeg.update({
          where: { id: oldLeg.id },
          data: { arriveOn: start, departOn: end },
        })
        return tx.trip.update({
          where: { id: existing.id },
          data: { name: newName, ...(args.reason ? { reason: args.reason } : {}) },
          select: { id: true, name: true },
        })
      })
      return {
        ok: true,
        action: 'updated',
        tripId: updated.id,
        tripName: updated.name,
        previousDates,
        newDates: formatRangeLocal(start, end),
      }
    }
    return { ok: true, action: 'noop', tripId: existing.id, tripName: existing.name }
  }

  const formatRange = (s: Date, e: Date) => {
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    return s.getTime() === e.getTime() ? fmt(s) : `${fmt(s)} – ${fmt(e)}`
  }
  const name = `${centroid.city}, ${formatRange(start, end)}`

  const trip = await prisma.trip.create({
    data: {
      userId,
      name,
      reason: args.reason ?? null,
      legs: {
        create: {
          city: centroid.city,
          citySlug: centroid.citySlug,
          country: centroid.country,
          lat: centroid.lat,
          lng: centroid.lng,
          arriveOn: start,
          departOn: end,
          legOrder: 0,
        },
      },
    },
    select: { id: true, name: true },
  })
  return { ok: true, action: 'created', tripId: trip.id, tripName: trip.name }
}

async function listTripsImpl(userId: string) {
  const trips = await prisma.trip.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { legs: { orderBy: { legOrder: 'asc' } } },
  })
  return trips.map((t) => ({
    id: t.id,
    name: t.name,
    reason: t.reason,
    legs: t.legs.map((l) => ({
      city: l.city,
      citySlug: l.citySlug,
      country: l.country,
      arriveOn: l.arriveOn.toISOString().split('T')[0],
      departOn: l.departOn.toISOString().split('T')[0],
    })),
  }))
}

async function listVisitsImpl(userId: string) {
  const rows = await prisma.gymAccess.findMany({
    where: { userId },
    include: { gym: { select: { id: true, name: true, address: true } } },
    orderBy: { activatedAt: 'desc' },
    take: 50,
  })
  return rows.map((r) => ({
    id: r.id,
    gymId: r.gymId,
    gymName: r.gym.name,
    gymAddress: r.gym.address,
    citySlug: r.citySlug,
    accessType: r.accessType,
    status: r.status,
    visitedAt: r.activatedAt.toISOString().split('T')[0],
    confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString().split('T')[0] : null,
  }))
}

async function deleteTripImpl(userId: string, args: { tripId: string }) {
  const trip = await prisma.trip.findFirst({
    where: { id: args.tripId, userId },
    select: { id: true, name: true },
  })
  if (!trip) {
    return { ok: false, error: 'Trip not found or not owned by user' }
  }
  await prisma.trip.delete({ where: { id: trip.id } })
  return { ok: true, deletedTripId: trip.id, deletedName: trip.name }
}

// ---------- Helpers ----------
function getUserId(req: Request): string | null {
  const id = req.headers['x-user-id']
  return typeof id === 'string' && id.length ? id : null
}

async function addGymToTripImpl(
  userId: string,
  args: { tripId: string; gymId: string; legId?: string; notes?: string },
) {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(args.gymId)) {
    return { ok: false, error: "gymId must be a verified DB gym UUID. Google-fallback gyms cannot be attached." };
  }
  if (!UUID_RE.test(args.tripId)) {
    return { ok: false, error: "tripId must be a valid UUID." };
  }

  // Ownership check
  const trip = await prisma.trip.findFirst({
    where: { id: args.tripId, userId },
    select: { id: true },
  });
  if (!trip) return { ok: false, error: "Trip not found or not owned by user." };

  // Gym existence check
  const gym = await prisma.gym.findUnique({
    where: { id: args.gymId },
    select: { id: true, name: true },
  });
  if (!gym) return { ok: false, error: "Gym not found in verified DB." };

  // Optional leg check — must belong to this trip
  if (args.legId) {
    if (!UUID_RE.test(args.legId)) return { ok: false, error: "legId must be a valid UUID." };
    const leg = await prisma.tripLeg.findFirst({
      where: { id: args.legId, tripId: args.tripId },
      select: { id: true },
    });
    if (!leg) return { ok: false, error: "Leg not found on this trip." };
  }

  // Dedupe: same gym + same trip + same legId already attached?
  const existing = await prisma.tripGym.findFirst({
    where: {
      tripId: args.tripId,
      gymId: args.gymId,
      legId: args.legId ?? null,
    },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, action: "noop", tripGymId: existing.id, gymName: gym.name };
  }

  const created = await prisma.tripGym.create({
    data: {
      tripId: args.tripId,
      gymId: args.gymId,
      legId: args.legId ?? null,
      matchScore: 0, // AI-attached gyms don't go through match engine in v1
      notes: args.notes ?? null,
    },
    select: { id: true },
  });

  return { ok: true, action: "created", tripGymId: created.id, gymName: gym.name };
}

async function removeGymFromTripImpl(
  userId: string,
  args: { tripId: string; gymId: string },
) {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(args.tripId) || !UUID_RE.test(args.gymId)) {
    return { ok: false, error: "tripId and gymId must be valid UUIDs." };
  }

  // Ownership check via trip
  const trip = await prisma.trip.findFirst({
    where: { id: args.tripId, userId },
    select: { id: true },
  });
  if (!trip) return { ok: false, error: "Trip not found or not owned by user." };

  const result = await prisma.tripGym.deleteMany({
    where: { tripId: args.tripId, gymId: args.gymId },
  });

  if (result.count === 0) {
    return { ok: false, error: "That gym is not attached to this trip." };
  }
  return { ok: true, removed: result.count };
}

async function recordBookingInterestImpl(
  userId: string,
  args: { gymId: string; email: string; tripId?: string },
) {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(args.gymId)) {
    return { ok: false, error: "gymId must be a verified DB gym UUID." };
  }
  if (!args.email || !args.email.includes("@")) {
    return { ok: false, error: "A valid email is required." };
  }
  if (args.tripId && !UUID_RE.test(args.tripId)) {
    return { ok: false, error: "tripId must be a valid UUID if provided." };
  }

  const gym = await prisma.gym.findUnique({
    where: { id: args.gymId },
    select: { id: true, name: true },
  });
  if (!gym) return { ok: false, error: "Gym not found." };

  if (args.tripId) {
    const trip = await prisma.trip.findFirst({
      where: { id: args.tripId, userId },
      select: { id: true },
    });
    if (!trip) return { ok: false, error: "Trip not found or not owned by user." };
  }

  const created = await prisma.bookingInterest.create({
    data: {
      userId,
      gymId: args.gymId,
      tripId: args.tripId ?? null,
      email: args.email.trim().toLowerCase(),
      pricePence: 299,
      source: "ai_chat",
      status: "waitlisted",
    },
    select: { id: true },
  });

  return { ok: true, bookingInterestId: created.id, gymName: gym.name, pricePence: 299 };
}

async function loadUserContext(userId: string): Promise<string> {
  const [user, profile, recentTrips] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { legs: { orderBy: { legOrder: 'asc' } } },
    }),
  ])
  const todayStr = new Date().toISOString().split('T')[0]
  const tripsLine = recentTrips.length
    ? recentTrips
        .map((t) => {
          const leg = t.legs[0]
          if (!leg) return t.name
          const a = leg.arriveOn.toISOString().split('T')[0]
          const d = leg.departOn.toISOString().split('T')[0]
          return `${leg.city} (${a} to ${d})`
        })
        .join('; ')
    : 'none'

  return `Today's date: ${todayStr}
User: ${user?.name ?? 'unknown'}
Home city: ${profile?.citySlug ?? 'unknown'}
Primary activity: ${profile?.primaryActivity ?? 'unknown'}
Priorities: ${profile?.priorities?.join(', ') || 'none'}
Recent trips on file: ${tripsLine}`
}

async function hydrateGyms(gymIds: string[]) {
  if (!gymIds.length) return []
  const gyms = await prisma.gym.findMany({
    where: { id: { in: gymIds } },
    select: {
      id: true, name: true, address: true,
      dayPassPence: true, dayPassUrl: true, equipmentTags: true,
      photoUrls: true, verified: true, rating: true,
    },
  })
  const orderMap = new Map(gymIds.map((id, i) => [id, i]))
  gyms.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))
  return gyms
}

// ---------- Anthropic retry helper ----------
function isTransientUpstreamError(err: any): boolean {
  if (!err) return false
  const status = err.status ?? err.statusCode
  if (typeof status === 'number' && status >= 500 && status < 600) return true
  if (status === 429) return true
  const code = err.code ?? err.cause?.code
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ECONNREFUSED' || code === 'EAI_AGAIN') return true
  if (err.name === 'APIConnectionError' || err.name === 'APIConnectionTimeoutError') return true
  return false
}

async function callAnthropicWithRetry(
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
): Promise<Anthropic.Messages.Message> {
  try {
    return await anthropic.messages.create(params)
  } catch (err) {
    if (!isTransientUpstreamError(err)) throw err
    await new Promise((r) => setTimeout(r, 500))
    return await anthropic.messages.create(params)
  }
}

// ---------- Agent loop ----------
interface ToolTurn {
  assistantContent: Anthropic.Messages.ContentBlock[]
  toolResults: Anthropic.Messages.ToolResultBlockParam[]
}

interface AgentResult {
  message: string
  gymIds: string[]
  savedTripIds: string[]
  toolTurns: ToolTurn[]
}

async function runAgent(
  userId: string,
  history: Anthropic.Messages.MessageParam[],
): Promise<AgentResult> {
  const savedTripIds: string[] = []
  const toolTurns: ToolTurn[] = []

  for (let i = 0; i < MAX_AGENT_ITERATIONS; i++) {
    const response = await callAnthropicWithRetry({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: history,
    })

    if (response.stop_reason !== 'tool_use') {
      const text = response.content.find((b) => b.type === 'text') as Anthropic.Messages.TextBlock | undefined
      return {
        message: text?.text ?? "Something went sideways. Try rephrasing?",
        gymIds: [],
        savedTripIds,
        toolTurns,
      }
    }

    // Process ALL tool_use blocks in this response (Claude can call multiple in one turn).
    const toolUses = response.content.filter((b) => b.type === 'tool_use') as Anthropic.Messages.ToolUseBlock[]

    // If respond is one of them, we're done — extract and return.
    const respondBlock = toolUses.find((t) => t.name === 'respond')
    if (respondBlock) {
      const input = respondBlock.input as { message?: string; gymIds?: string[] }
      return {
        message: typeof input.message === 'string' ? input.message : '',
        gymIds: Array.isArray(input.gymIds) ? input.gymIds.filter((x) => typeof x === 'string') : [],
        savedTripIds,
        toolTurns,
      }
    }

    // Execute tool calls and feed results back.
    history.push({ role: 'assistant', content: response.content })

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
    for (const tu of toolUses) {
      let result: any
      if (tu.name === 'searchGyms') {
        result = await searchGymsImpl(tu.input as any)
      } else if (tu.name === 'saveTrip') {
        const saved = await saveTripImpl(userId, tu.input as any)
        if (saved.ok && saved.tripId) savedTripIds.push(saved.tripId)
        result = saved
      } else if (tu.name === 'listTrips') {
        result = await listTripsImpl(userId)
      } else if (tu.name === 'listVisits') {
        result = await listVisitsImpl(userId)
      } else if (tu.name === 'deleteTrip') {
        result = await deleteTripImpl(userId, tu.input as any)
      } else if (tu.name === 'addGymToTrip') {
        result = await addGymToTripImpl(userId, tu.input as any)
      } else if (tu.name === 'removeGymFromTrip') {
        result = await removeGymFromTripImpl(userId, tu.input as any)
      } else if (tu.name === 'recordBookingInterest') {
        result = await recordBookingInterestImpl(userId, tu.input as any)
      } else {
        result = { error: `Unknown tool: ${tu.name}` }
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: JSON.stringify(result),
      })
    }
    history.push({ role: 'user', content: toolResults })
    toolTurns.push({
      assistantContent: response.content,
      toolResults,
    })
  }

  return {
    message: "I'm having trouble narrowing this down. Could you rephrase?",
    gymIds: [],
    savedTripIds,
    toolTurns,
  }
}

// ---------- Routes ----------

router.get('/threads', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(400).json({ error: 'Missing x-user-id' })
    const threads = await prisma.chatThread.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      select: { id: true, title: true, createdAt: true, lastMessageAt: true },
    })
    res.json({ threads })
  } catch (err) {
    next(err)
  }
})

router.post('/threads', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(400).json({ error: 'Missing x-user-id' })
    const thread = await prisma.chatThread.create({
      data: { userId },
      select: { id: true, title: true, createdAt: true, lastMessageAt: true },
    })
    res.json({ thread })
  } catch (err) {
    next(err)
  }
})

router.get('/threads/:id/messages', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(400).json({ error: 'Missing x-user-id' })

    const thread = await prisma.chatThread.findFirst({
      where: { id: req.params.id, userId },
    })
    if (!thread) return res.status(404).json({ error: 'Thread not found' })

    const rows = await prisma.chatMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'asc' },
    })

    const allIds = new Set<string>()
    for (const m of rows) {
      if (Array.isArray(m.gymIds)) {
        for (const id of m.gymIds as string[]) allIds.add(id)
      }
    }
    const hydrated = await hydrateGyms([...allIds])
    const byId = new Map(hydrated.map((g) => [g.id, g]))

    const messages = rows.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      gyms: Array.isArray(m.gymIds) ? (m.gymIds as string[]).map((id) => byId.get(id)).filter(Boolean) : [],
      createdAt: m.createdAt,
    }))

    res.json({ thread, messages })
  } catch (err) {
    next(err)
  }
})

router.post('/threads/:id/messages', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(400).json({ error: 'Missing x-user-id' })

    const { content } = req.body as { content?: string }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Missing content' })
    }

    const thread = await prisma.chatThread.findFirst({
      where: { id: req.params.id, userId },
    })
    if (!thread) return res.status(404).json({ error: 'Thread not found' })

    const userMsg = await prisma.chatMessage.create({
      data: { threadId: thread.id, role: 'user', content: content.trim() },
    })

    const priorRows = await prisma.chatMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'asc' },
      take: HISTORY_LIMIT,
    })

    const userContext = await loadUserContext(userId)
    const history: Anthropic.Messages.MessageParam[] = []
    for (const m of priorRows) {
      if (m.role === 'assistant' && m.toolResults && Array.isArray(m.toolResults)) {
        const turns = m.toolResults as unknown as ToolTurn[]
        for (const turn of turns) {
          history.push({ role: 'assistant', content: turn.assistantContent as any })
          history.push({ role: 'user', content: turn.toolResults as any })
        }
        history.push({ role: 'assistant', content: m.content })
      } else {
        history.push({
          role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: m.content,
        })
      }
    }
    const firstUserIdx = history.findIndex((m) => m.role === 'user')
    if (firstUserIdx >= 0 && typeof history[firstUserIdx].content === 'string') {
      history[firstUserIdx] = {
        role: 'user',
        content: `${userContext}\n\n---\n\n${history[firstUserIdx].content as string}`,
      }
    }

    const parsed = await runAgent(userId, history)

    // Filter to UUIDs only. Google fallback gyms have Place IDs (not UUIDs) and
    // can't be hydrated later via prisma.gym.findMany — they're surfaced in prose
    // by the AI but not persisted as gym cards.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const persistableGymIds = parsed.gymIds.filter((id) => UUID_RE.test(id))

    const [assistantMsg] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          role: 'assistant',
          content: parsed.message,
          gymIds: persistableGymIds.length ? (persistableGymIds as any) : null,
          toolResults: parsed.toolTurns.length ? (parsed.toolTurns as any) : null,
        },
      }),
      prisma.chatThread.update({
        where: { id: thread.id },
        data: {
          lastMessageAt: new Date(),
          ...(thread.title ? {} : { title: content.trim().slice(0, 60) }),
        },
      }),
    ])

    const gyms = await hydrateGyms(persistableGymIds)

    res.json({
      userMessage: { id: userMsg.id, role: 'user', content: userMsg.content, gyms: [], createdAt: userMsg.createdAt },
      assistantMessage: {
        id: assistantMsg.id,
        role: 'assistant',
        content: assistantMsg.content,
        gyms,
        createdAt: assistantMsg.createdAt,
      },
      savedTripIds: parsed.savedTripIds,
    })
  } catch (err) {
    next(err)
  }
})

export default router
