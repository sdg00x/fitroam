import { Router } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

function getUserId(req: any): string | null {
  const id = req.header('x-user-id')
  return typeof id === 'string' && id.length > 0 ? id : null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PRICE_PENCE = 299

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

export default router
