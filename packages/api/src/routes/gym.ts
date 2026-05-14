import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { scoreGyms, UserProfile } from '../services/matchEngine'
import { fetchNearbyGyms } from '../services/placesService'

const router = Router()

// ─── GET /api/gyms ────────────────────────────────────────────────────────────

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
      trainingStyle:      (req.query.style as string)  || 'mixed',
      equipmentNeeds:     [],
      budgetRange:        (req.query.budget as string) || '10_to_20',
      maxDistanceMinutes: parseInt(req.query.maxMins as string) || 30,
      environmentPref:    'both',
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

// ─── POST /api/gyms/:id/access ────────────────────────────────────────────────

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

    const user = await prisma.user.upsert({
      where:  { id: userId },
      update: {},
      create: {
        id:    userId,
        email: `${userId}@placeholder.local`,
      },
    })

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