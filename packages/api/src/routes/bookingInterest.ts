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

    const { gymId, email, tripId, source } = req.body as {
      gymId?: string
      email?: string
      tripId?: string
      source?: string
    }

    if (!gymId || !UUID_RE.test(gymId)) {
      return res.status(400).json({ error: 'gymId must be a valid UUID' })
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' })
    }
    if (tripId && !UUID_RE.test(tripId)) {
      return res.status(400).json({ error: 'tripId must be a valid UUID if provided' })
    }

    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
      select: { id: true, name: true, verified: true },
    })
    if (!gym) return res.status(404).json({ error: 'Gym not found' })
    if (!gym.verified) {
      return res.status(400).json({ error: 'We only handle bookings for verified gyms.' })
    }

    if (tripId) {
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId },
        select: { id: true },
      })
      if (!trip) return res.status(404).json({ error: 'Trip not found' })
    }

    const created = await prisma.bookingInterest.create({
      data: {
        userId,
        gymId,
        tripId: tripId ?? null,
        email: email.trim().toLowerCase(),
        pricePence: PRICE_PENCE,
        source: source ?? 'gym_card',
        status: 'waitlisted',
      },
      select: { id: true, createdAt: true },
    })

    // Fire alert (best-effort, do not await — never block the user response)
    setImmediate(async () => {
      try {
        const [fullGym, user] = await Promise.all([
          prisma.gym.findUnique({
            where: { id: gymId },
            select: { name: true, citySlug: true, dayPassUrl: true, dayPassPence: true },
          }),
          prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
        ])
        const trip = tripId
          ? await prisma.trip.findUnique({ where: { id: tripId }, select: { name: true } })
          : null
        await sendBookingInterestAlert({
          bookingInterestId: created.id,
          userId,
          userEmail: user?.email ?? email,
          userName: user?.name,
          gymName: fullGym?.name ?? gym.name,
          gymCity: fullGym?.citySlug ?? null,
          gymDayPassUrl: fullGym?.dayPassUrl ?? null,
          gymDayPassPence: fullGym?.dayPassPence ?? null,
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
      pricePence: PRICE_PENCE,
      gymName: gym.name,
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
        gymName: r.gym.name,
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
        user: { select: { id: true, name: true, email: true } },
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
