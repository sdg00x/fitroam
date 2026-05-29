import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// Helper: find user from x-user-id header. Returns null if not found.
async function findUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } })
}

// ─────────────────────────────────────────────────────────────
// POST /api/trips — create a trip with one or more legs
// ─────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clerkId = req.header('x-user-id')
    if (!clerkId) {
      res.status(401).json({ error: 'Missing x-user-id header' })
      return
    }

    const { name, reason, legs } = req.body as {
      name:    string
      reason?: string
      legs:    Array<{
        city:     string
        citySlug: string
        country?: string
        placeId?:          string
        formattedAddress?: string
        lat:      number
        lng:      number
        arriveOn: string
        departOn: string
      }>
    }

    if (!name || !legs || !Array.isArray(legs) || legs.length === 0) {
      res.status(400).json({
        error:   'Missing required fields: name, legs (must be non-empty array)',
        example: { name: 'Leeds + Manchester', legs: [{ city: 'Leeds', citySlug: 'leeds', lat: 53.8, lng: -1.5, arriveOn: '2026-06-01', departOn: '2026-06-04' }] },
      })
      return
    }

    // Validate each leg
    for (const leg of legs) {
      if (!leg.city || !leg.citySlug || leg.lat == null || leg.lng == null || !leg.arriveOn || !leg.departOn) {
        res.status(400).json({ error: 'Each leg requires: city, citySlug, lat, lng, arriveOn, departOn' })
        return
      }
    }

    const user = await findUser(clerkId)
    if (!user) {
      res.status(401).json({ error: "User not found. Sign up first." })
      return
    }

    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        name,
        reason,
        legs: {
          create: legs.map((leg, i) => ({
            city:     leg.city,
            citySlug: leg.citySlug,
            country:          leg.country,
            placeId:          leg.placeId,
            formattedAddress: leg.formattedAddress,
            lat:      leg.lat,
            lng:      leg.lng,
            arriveOn: new Date(leg.arriveOn),
            departOn: new Date(leg.departOn),
            legOrder: i,
          })),
        },
      },
      include: { legs: { orderBy: { legOrder: 'asc' } } },
    })

    res.status(201).json({ trip })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────
// GET /api/trips — list all trips for the user
// ─────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clerkId = req.header('x-user-id')
    if (!clerkId) {
      res.status(401).json({ error: 'Missing x-user-id header' })
      return
    }

    const user = await findUser(clerkId)
    if (!user) {
      res.status(401).json({ error: "User not found. Sign up first." })
      return
    }

    const trips = await prisma.trip.findMany({
      where:   { userId: user.id },
      include: {
        legs:     { orderBy: { legOrder: 'asc' } },
        tripGyms: { include: { gym: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ trips, total: trips.length })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────
// GET /api/trips/:id — single trip with legs and saved gyms
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clerkId = req.header('x-user-id')
    if (!clerkId) {
      res.status(401).json({ error: 'Missing x-user-id header' })
      return
    }

    const user = await findUser(clerkId)
    if (!user) {
      res.status(401).json({ error: "User not found. Sign up first." })
      return
    }

    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: user.id },
      include: {
        legs:     { orderBy: { legOrder: 'asc' } },
        tripGyms: { include: { gym: true } },
      },
    })

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' })
      return
    }

    res.json({ trip })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────
// PATCH /api/trips/:id — update trip name/reason or add a leg
// ─────────────────────────────────────────────────────────────
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clerkId = req.header('x-user-id')
    if (!clerkId) {
      res.status(401).json({ error: 'Missing x-user-id header' })
      return
    }

    const user = await findUser(clerkId)
    if (!user) {
      res.status(401).json({ error: "User not found. Sign up first." })
      return
    }

    const existing = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: user.id },
    })
    if (!existing) {
      res.status(404).json({ error: 'Trip not found' })
      return
    }

    const { name, reason, addLeg } = req.body as {
      name?:   string
      reason?: string
      addLeg?: {
        placeId?:          string
        formattedAddress?: string
        city:     string
        citySlug: string
        country?: string
        placeId?:          string
        formattedAddress?: string
        lat:      number
        lng:      number
        arriveOn: string
        departOn: string
      }
    }

    // Update scalar fields
    if (name !== undefined || reason !== undefined) {
      await prisma.trip.update({
        where: { id: existing.id },
        data:  {
          ...(name !== undefined   && { name }),
          ...(reason !== undefined && { reason }),
        },
      })
    }

    // Add a new leg at the end
    if (addLeg) {
      const existingLegs = await prisma.tripLeg.count({ where: { tripId: existing.id } })
      await prisma.tripLeg.create({
        data: {
          tripId:   existing.id,
          city:     addLeg.city,
          citySlug: addLeg.citySlug,
          country:          addLeg.country,
          placeId:          addLeg.placeId,
          formattedAddress: addLeg.formattedAddress,
          lat:      addLeg.lat,
          lng:      addLeg.lng,
          arriveOn: new Date(addLeg.arriveOn),
          departOn: new Date(addLeg.departOn),
          legOrder: existingLegs,
        },
      })
    }

    const trip = await prisma.trip.findUnique({
      where:   { id: existing.id },
      include: {
        legs:     { orderBy: { legOrder: 'asc' } },
        tripGyms: { include: { gym: true } },
      },
    })

    res.json({ trip })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────
// DELETE /api/trips/:id — remove a trip and all its legs/gyms
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clerkId = req.header('x-user-id')
    if (!clerkId) {
      res.status(401).json({ error: 'Missing x-user-id header' })
      return
    }

    const user = await findUser(clerkId)
    if (!user) {
      res.status(401).json({ error: "User not found. Sign up first." })
      return
    }

    const existing = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: user.id },
    })
    if (!existing) {
      res.status(404).json({ error: 'Trip not found' })
      return
    }

    await prisma.trip.delete({ where: { id: existing.id } })
    res.json({ ok: true, deletedId: existing.id })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────
// POST /api/trips/:id/legs/:legId/gyms — attach a gym to a leg
// ─────────────────────────────────────────────────────────────
router.post('/:id/legs/:legId/gyms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clerkId = req.header('x-user-id')
    if (!clerkId) {
      res.status(401).json({ error: 'Missing x-user-id header' })
      return
    }

    const { gymId, matchScore, notes } = req.body as {
      gymId:       string
      matchScore?: number
      notes?:      string
    }

    if (!gymId) {
      res.status(400).json({ error: 'Missing required field: gymId' })
      return
    }

    const user = await findUser(clerkId)
    if (!user) {
      res.status(401).json({ error: "User not found. Sign up first." })
      return
    }

    // Verify trip + leg ownership
    const trip = await prisma.trip.findFirst({
      where:   { id: req.params.id, userId: user.id },
      include: { legs: { where: { id: req.params.legId } } },
    })
    if (!trip || trip.legs.length === 0) {
      res.status(404).json({ error: 'Trip or leg not found' })
      return
    }

    // Verify gym exists
    const gym = await prisma.gym.findUnique({ where: { id: gymId } })
    if (!gym) {
      res.status(404).json({ error: 'Gym not found' })
      return
    }

    const tripGym = await prisma.tripGym.create({
      data: {
        tripId:     trip.id,
        legId:      req.params.legId,
        gymId:      gym.id,
        matchScore: matchScore ?? 0,
        notes,
      },
      include: { gym: true },
    })

    res.status(201).json({ tripGym })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────
// DELETE /api/trips/:id/gyms/:tripGymId — remove a saved gym from a trip
// ─────────────────────────────────────────────────────────────
router.delete('/:id/gyms/:tripGymId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clerkId = req.header('x-user-id')
    if (!clerkId) {
      res.status(401).json({ error: 'Missing x-user-id header' })
      return
    }

    const user = await findUser(clerkId)
    if (!user) {
      res.status(401).json({ error: "User not found. Sign up first." })
      return
    }

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: user.id },
    })
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' })
      return
    }

    await prisma.tripGym.delete({ where: { id: req.params.tripGymId } })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
