import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { sendBookingInterestAlert } from '../lib/alerts'

const router = Router()

function getUserId(req: any): string | null {
  const id = req.header('x-user-id')
  return typeof id === 'string' && id.length > 0 ? id : null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PRICE_PENCE = 299

// Solo-founder admin gate. TODO(v1.1): move to env var ADMIN_USER_IDS for multi-admin support.
const ADMIN_USER_IDS = new Set([
  "d476b424-11cb-43c8-978b-04101b7a9f53", // Dan
])
const VALID_STATUSES = new Set(["waitlisted", "contacted", "fulfilled", "declined"])

// Record a booking interest (fake-door auto-book).
// This does NOT actually book anything. It logs intent for measurement.
router.post('/', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(400).json({ error: 'Missing x-user-id' })

    const { gymId, gymPlaceId, gymName, gymAddress, email, tripId, source } = req.body as {
      gymId?: string
      gymPlaceId?: string
      gymName?: string
      gymAddress?: string
      email?: string
      tripId?: string
      source?: string
    }

    // Two acceptable shapes:
    // 1. Verified path: gymId is a UUID matching a verified gym in our DB
    // 2. Unverified path: gymPlaceId + gymName (snapshot of a Google result the user wants verified)
    const isVerifiedPath = !!gymId && UUID_RE.test(gymId)
    const isUnverifiedPath = !gymId && !!gymPlaceId && !!gymName
    if (!isVerifiedPath && !isUnverifiedPath) {
      return res.status(400).json({
        error: 'Either gymId (UUID, verified) OR gymPlaceId+gymName (snapshot, unverified) required',
      })
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' })
    }
    if (tripId && !UUID_RE.test(tripId)) {
      return res.status(400).json({ error: 'tripId must be a valid UUID if provided' })
    }

    let gym: { id: string; name: string; verified: boolean; citySlug: string | null; dayPassUrl: string | null; dayPassPence: number | null } | null = null
    if (isVerifiedPath) {
      gym = await prisma.gym.findUnique({
        where: { id: gymId! },
      // ALERT_CONTEXT_INLINE: fetch everything needed for both validation AND the alert email.
      // Prevents re-querying Prisma inside setImmediate, which was exhausting the connection pool.
      select: {
        id: true,
        name: true,
        verified: true,
        citySlug: true,
        dayPassUrl: true,
        dayPassPence: true,
      },
      })
      if (!gym) return res.status(404).json({ error: 'Gym not found' })
      if (!gym.verified) {
        return res.status(400).json({ error: 'Verified-gym path called with an unverified gym. Use the gymPlaceId path instead.' })
      }
    }

    // Fetch user once for alert context — single query, no setImmediate re-fetch later
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })

    // Trip ownership check + capture name for alert context in same query
    let trip: { id: string; name: string } | null = null
    if (tripId) {
      trip = await prisma.trip.findFirst({
        where: { id: tripId, userId },
        select: { id: true, name: true },
      })
      if (!trip) return res.status(404).json({ error: 'Trip not found' })
    }

    const created = await prisma.bookingInterest.create({
      data: {
        userId,
        gymId: isVerifiedPath ? gymId! : null,
        gymPlaceId: isUnverifiedPath ? gymPlaceId! : null,
        gymNameSnapshot: isUnverifiedPath ? gymName! : null,
        gymAddressSnapshot: isUnverifiedPath ? (gymAddress ?? null) : null,
        tripId: tripId ?? null,
        email: email.trim().toLowerCase(),
        pricePence: isVerifiedPath ? PRICE_PENCE : 0,
        source: source ?? (isVerifiedPath ? 'gym_card' : 'verification_request'),
        status: 'waitlisted',
      },
      select: { id: true, createdAt: true },
    })

    // Fire alert (best-effort, do not await — never block the user response).
    // ZERO Prisma queries inside setImmediate — all context captured from inline fetches above.
    setImmediate(async () => {
      try {
        await sendBookingInterestAlert({
          bookingInterestId: created.id,
          isVerified: isVerifiedPath,
          userId,
          userEmail: user?.email ?? email,
          userName: user?.name,
          gymName: gym?.name ?? gymName!,
          gymCity: gym?.citySlug ?? null,
          gymDayPassUrl: gym?.dayPassUrl ?? null,
          gymDayPassPence: gym?.dayPassPence ?? null,
          source: source ?? 'gym_card',
          pricePence: PRICE_PENCE,
          tripName: trip?.name ?? null,
        })
      } catch (e) {
        console.error('[alerts] background alert failed', e)
      }
    })

    res.json({
      ok: true,
      id: created.id,
      pricePence: isVerifiedPath ? PRICE_PENCE : 0,
      gymName: isVerifiedPath ? gym!.name : gymName!,
      createdAt: created.createdAt,
    })
  } catch (err) {
    next(err)
  }
})

// List the user's existing interest entries (so the UI can show "already requested")
router.get('/', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(400).json({ error: 'Missing x-user-id' })

    const rows = await prisma.bookingInterest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        gymId: true,
        tripId: true,
        pricePence: true,
        source: true,
        status: true,
        createdAt: true,
        gym: { select: { name: true } },
      },
    })

    res.json({
      interests: rows.map((r) => ({
        id: r.id,
        gymId: r.gymId,
        gymName: r.gym?.name ?? null,
        tripId: r.tripId,
        pricePence: r.pricePence,
        source: r.source,
        status: r.status,
        createdAt: r.createdAt,
      })),
    })
  } catch (err) {
    next(err)
  }
})

// ----- ADMIN ROUTES -----
// GET all booking_interest rows across all users. Gated to ADMIN_USER_IDS.
router.get('/admin', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(400).json({ error: 'Missing x-user-id' })
    if (!ADMIN_USER_IDS.has(userId)) return res.status(403).json({ error: 'Forbidden' })

    const rows = await prisma.bookingInterest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        email: true,
        pricePence: true,
        source: true,
        status: true,
        createdAt: true,
        gym: { select: { id: true, name: true, citySlug: true, dayPassUrl: true, dayPassPence: true } },
        trip: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    res.json({
      count: rows.length,
      rows: rows.map((r) => ({
        id: r.id,
        status: r.status,
        source: r.source,
        pricePence: r.pricePence,
        createdAt: r.createdAt,
        capturedEmail: r.email,
        user: r.user,
        gym: r.gym,
        trip: r.trip,
      })),
    })
  } catch (err) {
    next(err)
  }
})

// PATCH status on a single booking_interest row. Gated to ADMIN_USER_IDS.
router.patch('/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(400).json({ error: 'Missing x-user-id' })
    if (!ADMIN_USER_IDS.has(userId)) return res.status(403).json({ error: 'Forbidden' })

    const { id } = req.params
    if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid id' })

    const { status } = req.body as { status?: string }
    if (!status || !VALID_STATUSES.has(status)) {
      return res.status(400).json({
        error: 'status must be one of: waitlisted, contacted, fulfilled, declined',
      })
    }

    const updated = await prisma.bookingInterest.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    })
    res.json({ ok: true, ...updated })
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'Booking interest not found' })
    }
    next(err)
  }
})

export default router
