import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { scoreGyms, UserProfile } from '../services/matchEngine'
import { fetchNearbyGyms } from '../services/placesService'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat    = parseFloat(req.query.lat as string)
    const lng    = parseFloat(req.query.lng as string)
    const radius = parseInt(req.query.radius as string) || 2000

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
      maxDistanceMinutes: parseInt(req.query.maxMins as string) || 20,
      environmentPref:    'both',
    }

    const rawGyms = await fetchNearbyGyms(lat, lng, radius)
    const scored  = scoreGyms(profile, rawGyms)

    res.json({
      gyms:     scored,
      total:    scored.length,
      location: { lat, lng },
      radius,
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/access', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id }                                     = req.params
    const { expectedEndDate, accessType, citySlug }  = req.body

    if (!expectedEndDate || !accessType || !citySlug) {
      res.status(400).json({
        error: 'Required fields: expectedEndDate, accessType, citySlug',
      })
      return
    }

    const gym = await prisma.gym.findUnique({ where: { id } })
    if (!gym) {
      res.status(404).json({ error: 'Gym not found' })
      return
    }

    const PLACEHOLDER_USER_ID = req.headers['x-user-id'] as string
    if (!PLACEHOLDER_USER_ID) {
      res.status(401).json({ error: 'x-user-id header required' })
      return
    }

    const access = await prisma.gymAccess.create({
      data: {
        userId:          PLACEHOLDER_USER_ID,
        gymId:           id,
        citySlug,
        accessType,
        expectedEndDate: new Date(expectedEndDate),
        status:          'active',
      },
    })

    res.status(201).json({
      message: "Access recorded. We'll remind you to cancel before you leave.",
      access,
    })
  } catch (err) {
    next(err)
  }
})

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export default router
