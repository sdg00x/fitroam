import { Router, Request, Response, NextFunction } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '../lib/prisma'
import { CITY_SLUGS } from '../config/cities'
import { CITY_CENTROIDS } from '../config/cityCentroids'
import { findNeighborhood } from '../config/neighborhoodCentroids'
import { fetchNearbyGyms } from '../services/placesService'
import { sendUserIntentAlert } from '../lib/alerts'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

const HISTORY_LIMIT = 20
const MAX_AGENT_ITERATIONS = 6

// ---------- System prompt ----------
const SYSTEM_PROMPT = `You are FitRoam — a gym-obsessed travel companion who knows every serious training spot in London, NYC, and Miami. You've trained in all three cities, you know which gyms actually let travelers in, and you give real recommendations like a friend who's been there — not a search result.

CORE BEHAVIOR: ACT FIRST, TALK LIKE A HUMAN
When you have enough info to act, act. But you're not a robot — you have opinions, you have warmth, you notice things. A one-word reply feels cold. A wall of bullet points feels like a brochure. Aim for the middle: decisive, warm, specific.

- The moment the user gives you a city + dates (even tentative ones), call saveTrip. Don't wait for confirmation. "I might go to Miami June 2-7" = call saveTrip immediately. The user can edit or delete it from their Trips tab if they change their mind.
- If the user changes the dates of a trip already mentioned ("actually June 3-8 not 2-7"), call saveTrip AGAIN with the new dates. The backend detects overlap and updates the existing trip in place — it returns action: 'updated'. Tell the user the dates were updated. Never expose the word "action".
- saveTrip's response includes an "action" field: 'created' (new trip), 'updated' (existing trip's dates were changed), or 'noop' (exact same dates already saved). React naturally to each.
- NEVER call deleteTrip unless the user explicitly uses words like "delete", "remove", "cancel", "drop", or "get rid of" referring to a trip. Date changes, updates, edits, and "actually I meant..." are NEVER deletes — they are saveTrip calls. If you're not sure whether to delete, do NOT call deleteTrip.
- The moment the user gives you a city + a hint of training need (lifting / cardio / area), call searchGyms.
- Never ask permission to do something. Just do it and tell the user what you did.
- Never ask "want me to..." or "should I..." when you have enough info. Just do it.

WHEN USER ASKS YOU TO BOOK / SORT IT / HANDLE IT
- FitRoam Concierge (day-pass booking on the user's behalf) is being built but NOT live yet.
- You do NOT have a tool to record booking interest. The user must tap the green "Let us handle it" button on the gym card to register interest.
- When the user signals book-intent ("sort it for me", "book it", "handle it", "can you do it", "I don't want to deal with it"), respond by: (1) acknowledging warmly without promising a service that's not live yet, (2) pointing them to the green button on the gym card to register early-access interest, (3) ALWAYS surfacing the gym's direct dayPassUrl inline so they can book it themselves right now in the meantime.
- Tone: warm, founder-honest, slightly enthusiastic about what's coming. Examples (vary the wording per conversation, don't parrot):
  * "Concierge isn't live yet, [name] — we're moving fast on it. Tap the green button on the SWEAT440 card to be the first we contact when we flip the switch. In the meantime, here's the day-pass page so you can grab it yourself: [URL]"
  * "I can't handle the booking for you yet — but we're building it, and you can lock in early access by tapping the green button on that gym's card. Day-pass page in case you want to sort it yourself: [URL]"
- NEVER promise a timeline. No "soon", no "next week", no "by Friday". The closest you can say is "we're moving fast" or "we'll let you know first".
- NEVER claim the service is live, in maintenance, or temporarily down. It is being built. Frame future, not present.
- If the user is asking about booking a specific gym whose verified field is false: say plainly that the booking concierge only works for gyms in our verified network yet, and let them know we are expanding that. Do not direct them to a button that will not appear on unverified gym cards.

VOICE
- You are a gym-obsessed travel companion, not a concierge reading from a script. You have opinions. You get excited about good gyms. You commiserate when a city is not covered yet. You sound like a real person who has actually been to these places.
- Never be terse. A one or two word answer feels broken. Always give the user something — context, a question, a recommendation, an opinion. If you have nothing to recommend, say something real about why and keep the conversation going.
- Match the user's energy. If they are casual, be casual. If they are excited, match it. If they are frustrated, acknowledge it before problem-solving.
- Use the user's name naturally but not constantly — once or twice per conversation feels right, not every message.
- Never expose product mechanics. No "our verified network", "our inventory", "coming soon screen", "drop your email", "waitlist". You just know what's available.
- You can have opinions: "Honestly Equinox is the move if budget is not a concern", "PureGym is the no-nonsense option", "Midtown has better options for lifting than downtown honestly." Say what you actually think.

WHEN INFO IS GENUINELY MISSING
- "Hey" or "I need a gym" → be warm and curious, like a friend who genuinely wants to help. If you know their trips already, reference one naturally ("You've got Miami coming up — that?"). Ask one short question, never a list.
- City but no other detail → call searchGyms anyway with what you have, then refine with the user.
- City + dates but no training focus → save the trip first, then ask about training.

WHEN A CITY ISN'T COVERED
- You cover London, NYC, Miami only. BEFORE responding, ALWAYS call recordUserIntent with category 'out_of_scope_city' and a detail describing what they asked for.
- Then respond with genuine personality — not a dead end. Show you care about their trip even if you can't help with that city. Ask if they are passing through London, NYC, or Miami. Express that more cities are coming without promising a timeline. Never say "watch this space" — that sounds like a dismissal. Never say "otherwise" as a pivot — it sounds like you are done with them. Keep them in the conversation.

WHEN searchGyms RETURNS NOTHING
- Don't dead-end. Offer to flex budget, look at a different area, or note you'll keep watching.
- If nothing fits and the user just wants a plan, save the trip anyway so they don't lose context.

WHEN THE USER ASKS FOR SOMETHING YOU CAN'T DO
- You can: search gyms, save/update trips, list saved trips, delete trips, list the user's gym visits (passport stamps), log NEW visits, update profile (with confirmation), attach a gym to a saved trip, remove a gym from a saved trip.
- You cannot (YET): rate gyms, change advanced filters. These will come.
- BEFORE responding when asked for something outside your tools, ALWAYS call recordUserIntent with category 'unimplemented_feature' and a detail describing the ask. Then be honest and short: "Not wired up yet — you can do it from the [Trips/Profile/Passport] tab for now." Don't invent permanent limitations like "I only have your trip info" — that misrepresents the product. The capability is coming; for now the user does it elsewhere in the app.
- For any other notable signal (a strong opinion, a feature idea, a specific complaint), call recordUserIntent with category 'other_signal' silently. This is just a heads-up to the founder, the user never sees it.

GYMS IN RESPONSES
CRITICAL: Never list gym names in prose. If you are recommending, mentioning, or discussing specific gyms, you MUST call searchGyms first and return their IDs in gymIds. The mobile UI renders them as cards — that is the gym surface, not your message text. The only gym text allowed in "message" is a one-line intro before the cards (e.g. "Found a couple of solid options in Midtown:") or a caveat about unverified results. Never enumerate gym names, addresses, or prices in prose.

ADDGYMTOTRIP
Never call addGymToTrip unless the user explicitly says they want to save a specific gym to a trip (e.g. "save that one", "add the first one to my Miami trip"). Do not auto-attach gyms during a searchGyms turn. The user picks; you save on instruction.

OUTPUT
You communicate ONLY via the respond tool. Never write plain text. Always end your turn by calling respond with:
- "message": your conversational reply — warm, specific, with personality. Write as much as the moment needs. A good recommendation deserves context. A tricky situation deserves a real response. Never a bullet list of gym names. Never so short it feels robotic.
- "gymIds": ranked gym UUIDs from the most recent searchGyms call. Empty array only if you genuinely have no gyms to show.`

// ---------- Tools ----------
const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'searchGyms',
    description: 'Search gyms in a launch city. Use as soon as the user gives a city plus any training hint. Pass the neighborhood field (e.g. Brickell, Soho, Midtown) when mentioned. Returns source, center, and a gyms array — each gym has a verified boolean. The response already includes Google supplementation when the verified pool is thin (under 3 results) — never ask the user for permission to do a wider search; the wider search is the default. Source values: verified means every gym in the list is verified — surface enthusiastically with day pass details. Mixed means some are verified (surface those first with day pass details) and some are Google (caveat the unverified ones with: I have not verified these myself, worth calling ahead). Google-fallback means none verified, all Google — caveat all of them. Empty means nothing found at all.',
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
    name: 'recordUserIntent',
    description: 'Fire silently when user shows demand for something FitRoam does not yet do. Categories: out_of_scope_city (Berlin, Paris, Tokyo etc), unimplemented_feature (rating gyms, advanced filters, etc), other_signal (anything notable). The user does NOT see this — it logs the signal to the founder. Always call this when you decline a request, BEFORE telling the user FitRoam does not cover that. Pass a detailed detail field so the founder understands the ask.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', enum: ['out_of_scope_city', 'unimplemented_feature', 'other_signal'] },
        detail: { type: 'string', description: 'Verbatim or paraphrased user ask, in enough detail to understand the demand.' },
      },
      required: ['category', 'detail'],
    },
  },
  {
    name: 'logVisit',
    description: 'Log a gym visit (passport stamp) on the user behalf. Use when the user says they went or are going to a specific gym, e.g. "I went to PureGym yesterday" or "log my visit to SWEAT440 today". REQUIRES a verified gym UUID from searchGyms first — never log a visit for an unverified Google gym. If the user mentions an ambiguous gym name (e.g. "PureGym" in London has many), call searchGyms first and confirm with the user. visitedDate is ISO date YYYY-MM-DD; translate "today" / "yesterday" yourself.',
    input_schema: {
      type: 'object' as const,
      properties: {
        gymId: { type: 'string', description: 'Verified gym UUID from searchGyms. Must be verified-DB origin, not a Google place_id.' },
        accessType: { type: 'string', enum: ['day_pass', 'monthly'], description: 'Type of access. Default to day_pass for casual mentions.' },
        visitedDate: { type: 'string', description: 'Date of visit in YYYY-MM-DD format. Translate "today" / "yesterday" / "last Friday" yourself.' },
      },
      required: ['gymId', 'accessType', 'visitedDate'],
    },
  },
  {
    name: 'updateProfile',
    description: 'Update a field on the user profile. Use when the user explicitly asks to change their preferences, e.g. "change my primary activity to lifting" or "I moved to NYC". CRITICAL: confirm changes with the user before calling. Show what you understood and ask "yes / no" before firing. Never assume — wrong updates erode trust. Only one field updated per call.',
    input_schema: {
      type: 'object' as const,
      properties: {
        field: {
          type: 'string',
          enum: ['primaryActivity', 'citySlug', 'priorities', 'maxDistanceMinutes', 'trainingPattern'],
          description: 'Which profile field to update. Other fields not exposed via AI.',
        },
        value: {
          description: 'New value for the field. primaryActivity is a string (e.g. "lifting"); citySlug is london-gb/newyork-us/miami-us; priorities is a string array; maxDistanceMinutes is a number; trainingPattern is a string.',
        },
      },
      required: ['field', 'value'],
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
function extractGoogleGymsFromTools(toolTurns: any[]) {
  const out = new Map()
  if (!Array.isArray(toolTurns)) return out
  for (const turn of toolTurns) {
    const calls = Array.isArray(turn?.assistantContent) ? turn.assistantContent : []
    const results = Array.isArray(turn?.toolResults) ? turn.toolResults : []
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i]
      if (call?.type !== "tool_use" || call?.name !== "searchGyms") continue
      const matched = results.find((r: any) => r?.tool_use_id === call.id) ?? results[i]
      if (!matched?.content) continue
      let parsed
      try {
        parsed = typeof matched.content === "string" ? JSON.parse(matched.content) : matched.content
      } catch { continue }
      const gyms = Array.isArray(parsed?.gyms) ? parsed.gyms : []
      for (const g of gyms) {
        if (g?.id && !g.verified) {
          out.set(g.id, {
            id: g.id,
            name: g.name,
            address: g.address ?? "",
            dayPass: !!g.dayPass,
            dayPassPence: g.dayPassPence ?? null,
            dayPassUrl: g.dayPassUrl ?? null,
            websiteUrl: g.websiteUrl ?? null,
            equipmentTags: Array.isArray(g.equipment) ? g.equipment : [],
            photoUrls: [],
            verified: false,
            rating: g.rating ?? null,
          })
        }
      }
    }
  }
  return out
}

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
    website_url: string | null
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
      website_url,
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

  // Map DB rows to the response shape used by the AI.
  const verifiedGyms = rows.map((g: any) => ({
    id: g.id,
    name: g.name,
    address: g.address,
    dayPass: g.day_pass,
    dayPassPence: g.day_pass_pence,
    dayPassUrl: g.day_pass_url,
    websiteUrl: g.website_url,
    equipment: g.equipment_tags ?? [],
    verified: g.verified,
    rating: g.rating,
    ratingCount: g.rating_count ?? null,
    photoUrls: g.photo_urls ?? [],
    distanceM: Math.round(g.distance_m),
  }))

  // -- Merge: DB results, plus Google supplementation when the moat is thin (<3 verified) --
  // Rationale: in beta we have very few verified gyms per city, so almost every search
  // benefits from showing additional Google options the user can call ahead about.
  // The AI never needs to ask permission for a "wider search" -- the wider search is the default.
  const NEEDS_SUPPLEMENT_THRESHOLD = 3
  if (rows.length >= NEEDS_SUPPLEMENT_THRESHOLD) {
    return {
      source: 'verified' as const,
      center: { name: center.name, lat: center.lat, lng: center.lng },
      gyms: verifiedGyms,
    }
  }

  // Try Google supplementation. Failure is non-fatal -- we still return whatever we have.
  let googleGyms: typeof verifiedGyms = []
  try {
    const raw = await fetchNearbyGyms(center.lat, center.lng, RADIUS_METERS)
    // Deduplicate against verified results by name (Google may return the same gym).
    const verifiedNames = new Set(verifiedGyms.map((g: any) => g.name.toLowerCase()))
    const filtered = raw.filter((g: any) => !verifiedNames.has((g.name ?? '').toLowerCase()))
    const top = filtered.slice(0, 10 - verifiedGyms.length)
    googleGyms = top.map((g: any) => ({
      id: g.id ?? g.placeId ?? g.place_id ?? null,
      name: g.name,
      address: g.address ?? g.formattedAddress ?? null,
      dayPass: false,
      dayPassPence: null,
      dayPassUrl: null,
      websiteUrl: g.websiteUrl ?? g.websiteUri ?? null,
      equipment: g.equipmentTags ?? [],
      verified: false,
      rating: g.rating ?? null,
      distanceM: 0,
    }))
  } catch (err) {
    console.warn('[concierge] Google supplementation failed:', err)
  }

  // Compose final response. verified gyms come first, google supplements after.
  const mergedGyms = [...verifiedGyms, ...googleGyms]
  let source: 'verified' | 'mixed' | 'google-fallback' | 'empty'
  if (mergedGyms.length === 0) source = 'empty'
  else if (verifiedGyms.length === 0) source = 'google-fallback'
  else if (googleGyms.length === 0) source = 'verified'
  else source = 'mixed'

  return {
    source,
    center: { name: center.name, lat: center.lat, lng: center.lng },
    gyms: mergedGyms,
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
      const updated = await prisma.$transaction(async (tx: any) => {
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
  return trips.map((t: any) => ({
    id: t.id,
    name: t.name,
    reason: t.reason,
    legs: t.legs.map((l: any) => ({
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
  return rows.map((r: any) => ({
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


async function recordUserIntentImpl(
  userId: string,
  args: { category: string; detail: string },
  context: { userName: string | null; userEmail: string | null },
) {
  try {
    await sendUserIntentAlert({
      userId,
      userName: context.userName,
      userEmail: context.userEmail,
      category: args.category,
      detail: args.detail,
    });
    return { ok: true, noted: true };
  } catch (err) {
    console.warn('[concierge] User intent alert failed:', err);
    return { ok: true, noted: true }; // never fail the AI loop on alert failure
  }
}

async function logVisitImpl(
  userId: string,
  args: { gymId: string; accessType: string; visitedDate: string },
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.gymId)) {
    return { ok: false, error: 'Cannot log visits for unverified gyms. Call searchGyms and confirm a verified gym first.' };
  }
  const gym = await prisma.gym.findUnique({
    where: { id: args.gymId },
    select: { id: true, name: true, citySlug: true },
  });
  if (!gym) {
    return { ok: false, error: 'Gym not found in our database.' };
  }
  const parsed = new Date(args.visitedDate);
  if (isNaN(parsed.getTime())) {
    return { ok: false, error: 'visitedDate must be a valid ISO date (YYYY-MM-DD).' };
  }
  const expectedEnd = new Date(parsed);
  if (args.accessType === 'monthly') {
    expectedEnd.setDate(expectedEnd.getDate() + 30);
  }
  const access = await prisma.gymAccess.create({
    data: {
      userId,
      gymId: gym.id,
      accessType: args.accessType,
      citySlug: gym.citySlug ?? 'unknown',
      activatedAt: parsed,
      expectedEndDate: expectedEnd,
      status: 'confirmed',
      confirmedAt: new Date(),
    },
    select: { id: true, accessType: true, activatedAt: true },
  });
  return {
    ok: true,
    visitId: access.id,
    gymName: gym.name,
    visitedDate: args.visitedDate,
    accessType: args.accessType,
  };
}

async function updateProfileImpl(
  userId: string,
  args: { field: string; value: any },
) {
  const ALLOWED_FIELDS = ['primaryActivity', 'citySlug', 'priorities', 'maxDistanceMinutes', 'trainingPattern'];
  if (!ALLOWED_FIELDS.includes(args.field)) {
    return { ok: false, error: `Field "${args.field}" is not updateable via AI. Allowed: ${ALLOWED_FIELDS.join(', ')}` };
  }
  // citySlug must be in allowlist
  if (args.field === 'citySlug' && !CITY_SLUGS.includes(args.value as any)) {
    return { ok: false, error: `Invalid citySlug. Allowed: ${CITY_SLUGS.join(', ')}` };
  }
  // priorities must be array
  if (args.field === 'priorities' && !Array.isArray(args.value)) {
    return { ok: false, error: 'priorities must be an array of strings.' };
  }
  // maxDistanceMinutes must be number
  if (args.field === 'maxDistanceMinutes' && typeof args.value !== 'number') {
    return { ok: false, error: 'maxDistanceMinutes must be a number.' };
  }

  const updates: any = { [args.field]: args.value };
  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: updates,
    create: { userId, ...updates },
  });
  return {
    ok: true,
    field: args.field,
    newValue: args.value,
    profileUpdatedAt: profile.updatedAt,
  };
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
        .map((t: any) => {
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
      photoUrls: true, verified: true, rating: true, ratingCount: true, dayPassUrl: true,
    },
  })
  const orderMap = new Map(gymIds.map((id, i) => [id, i]))
  gyms.sort((a: any, b: any) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))
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
  userMeta: { name: string | null; email: string | null },
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
        } else if (tu.name === 'recordUserIntent') {
          result = await recordUserIntentImpl(userId, tu.input as any, { userName: userMeta.name, userEmail: userMeta.email });
        } else if (tu.name === 'updateProfile') {
          result = await updateProfileImpl(userId, tu.input as any);
        } else if (tu.name === 'logVisit') {
          result = await logVisitImpl(userId, tu.input as any);
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
    // Collect all verified UUIDs across all messages for batch DB hydration
    const allUuids = new Set<string>()
    for (const m of rows) {
      if (Array.isArray(m.gymIds)) {
        for (const id of m.gymIds as string[]) allUuids.add(id)
      }
    }
    const hydrated = await hydrateGyms([...allUuids])
    const verifiedById = new Map(hydrated.map((g: any) => [g.id, g]))
    const messages = rows.map((m: any) => {
      const verifiedUuids = Array.isArray(m.gymIds) ? (m.gymIds as string[]) : []
      const googleIds = Array.isArray(m.googlePlaceIds) ? (m.googlePlaceIds as string[]) : []
      const googleMap = extractGoogleGymsFromTools(Array.isArray(m.toolResults) ? m.toolResults : [])
      const orderedIds = [...verifiedUuids, ...googleIds]
      const gyms = orderedIds
        .map((id) => verifiedById.get(id) ?? googleMap.get(id) ?? null)
        .filter(Boolean)
      return {
        id: m.id,
        role: m.role,
        content: m.content,
        gyms: gyms,
        createdAt: m.createdAt,
      }
    })

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

    const userRow = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
    const parsed = await runAgent(userId, history, { name: userRow?.name ?? null, email: userRow?.email ?? null })

    // Filter to UUIDs only. Google fallback gyms have Place IDs (not UUIDs) and
    // can't be hydrated later via prisma.gym.findMany — they're surfaced in prose
    // by the AI but not persisted as gym cards.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const persistableGymIds = parsed.gymIds.filter((id) => UUID_RE.test(id))
    const persistableGoogleIds = parsed.gymIds.filter((id) => !UUID_RE.test(id))
    const googleGymsSnapshot = extractGoogleGymsFromTools(parsed.toolTurns)

    const [assistantMsg] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          role: 'assistant',
          content: parsed.message,
          gymIds: persistableGymIds.length ? (persistableGymIds as any) : null,
          googlePlaceIds: persistableGoogleIds.length ? (persistableGoogleIds as any) : [],
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
    const verifiedGyms = await hydrateGyms(persistableGymIds)
    const googleGyms = persistableGoogleIds.map((id) => googleGymsSnapshot.get(id)).filter((g: any) => g != null)
    const allGyms = [...verifiedGyms, ...googleGyms].sort((a: any, b: any) => parsed.gymIds.indexOf(a.id) - parsed.gymIds.indexOf(b.id))

    res.json({
      userMessage: { id: userMsg.id, role: 'user', content: userMsg.content, gyms: [], createdAt: userMsg.createdAt },
      assistantMessage: {
        id: assistantMsg.id,
        role: 'assistant',
        content: assistantMsg.content,
        gyms: allGyms,
        createdAt: assistantMsg.createdAt,
      },
      savedTripIds: parsed.savedTripIds,
    })
  } catch (err) {
    next(err)
  }
})

export default router
