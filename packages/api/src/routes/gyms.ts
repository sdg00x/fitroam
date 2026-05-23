import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { scoreGyms, UserProfile } from '../services/matchEngine'
import { fetchNearbyGyms } from '../services/placesService'
import { fetchPlaceDetails, upsertGyms } from "../services/placesService"

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat    = parseFloat(req.query.lat as string)
    const lng    = parseFloat(req.query.lng as string)
    const radius = parseInt(req.query.radius as string) || 2000
    const sort   = (req.query.sort as string) || 'match'

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        error:   'Missing required query params: lat, lng',
        example: '/api/gyms?lat=51.5074&lng=-0.1278',
      })
      return
    }

    const profile: UserProfile = {
      primaryActivity:    (req.query.primaryActivity as string) || 'staying_in_shape',
      activities:         (req.query.activities    as string)?.split(',').filter(Boolean) || [],
      facilityTypes:      (req.query.facilityTypes as string)?.split(',').filter(Boolean) || [],
      lifestyle:          (req.query.lifestyle     as string)?.split(',').filter(Boolean) || [],
      priorities:         (req.query.priorities    as string)?.split(',').filter(Boolean) || [],
      maxDistanceMinutes: parseInt(req.query.maxDistanceMinutes as string) || 20,
    }

    const rawGyms = await fetchNearbyGyms(lat, lng, radius)
    let   scored  = scoreGyms(profile, rawGyms)

    switch (sort) {
      case 'nearest':
        scored = scored.sort((a, b) => a.distanceMinutes - b.distanceMinutes)
        break
      case 'rating':
        scored = scored.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        break
      case 'price':
        scored = scored.sort((a, b) => {
          const aPrice = a.dayPassPence ?? a.monthlyPence ?? 99999
          const bPrice = b.dayPassPence ?? b.monthlyPence ?? 99999
          return aPrice - bPrice
        })
        break
      case 'match':
      default:
        break
    }

    res.json({
      gyms:     scored,
      total:    scored.length,
      location: { lat, lng },
      radius,
      sort,
    })
  } catch (err) {
    next(err)
  }
})


router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gymId = req.params.id
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gymId)

    // 1. If it is a UUID, look it up by id
    if (isUUID) {
      const gym = await prisma.gym.findUnique({ where: { id: gymId } })
      if (!gym) {
        res.status(404).json({ error: "Gym not found" })
        return
      }
      res.json({ gym })
      return
    }

    // 2. Otherwise treat as Google Places ID — try cache first
    const cached = await prisma.gym.findUnique({ where: { placesId: gymId } })
    if (cached) {
      res.json({ gym: cached })
      return
    }

    // 3. Not cached — fetch from Google, upsert, return
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      res.status(500).json({ error: "GOOGLE_PLACES_API_KEY not set" })
      return
    }
    const place = await fetchPlaceDetails(gymId, apiKey)
    await upsertGyms([place])
    const fresh = await prisma.gym.findUnique({ where: { placesId: gymId } })
    if (!fresh) {
      res.status(500).json({ error: "Upsert failed" })
      return
    }
    res.json({ gym: fresh })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/access', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gymId  = req.params.id
    const userId = req.header('x-user-id')

    if (!userId) {
      res.status(401).json({ error: 'Missing x-user-id header' })
      return
    }

    const { accessType, citySlug, expectedEndDate } = req.body as {
      accessType:      'day_pass' | 'monthly'
      citySlug?:       string
      expectedEndDate: string
    }

    if (!accessType || !expectedEndDate) {
      res.status(400).json({ error: 'Missing required fields: accessType, expectedEndDate' })
      return
    }

    const gym = await prisma.gym.findUnique({ where: { id: gymId } })
    if (!gym) {
      res.status(404).json({ error: 'Gym not found' })
      return
    }

    // Find or create the placeholder user by clerkId (since we don't have real auth yet)
    let user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email:   `${userId}@placeholder.local`,
        },
      })
    }

    const access = await prisma.gymAccess.create({
      data: {
        userId:          user.id,
        gymId:           gym.id,
        accessType,
        citySlug:        citySlug ?? 'unknown',
        expectedEndDate: new Date(expectedEndDate),
        status:          'active',
      },
    })

    res.status(201).json({
      access: {
        id:              access.id,
        gymId:           access.gymId,
        accessType:      access.accessType,
        expectedEndDate: access.expectedEndDate,
        status:          access.status,
      },
      gym: { id: gym.id, name: gym.name },
    })
  } catch (err) {
    next(err)
  }
})

export default router
