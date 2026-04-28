import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { scoreGyms, RawGym, UserProfile } from '../services/matchEngine'

const router = Router()

/**
 * GET /api/gyms
 *
 * Query params:
 *   lat      - user latitude  (required)
 *   lng      - user longitude (required)
 *   radius   - search radius in metres (default: 2000)
 *
 * Returns gyms near the user's location, scored against their profile.
 *
 * v1: fetches from our local gyms table (seeded manually or via Places API).
 * The Google Places integration comes next — this establishes the contract.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat    = parseFloat(req.query.lat as string)
    const lng    = parseFloat(req.query.lng as string)
    const radius = parseInt(req.query.radius as string) || 2000

    // Validate required params
    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        error: 'Missing required query params: lat, lng',
        example: '/api/gyms?lat=51.5074&lng=-0.1278',
      })
      return
    }

    // Build a default profile for unauthenticated requests
    // When auth is wired up, this comes from the JWT claims
    const profile: UserProfile = {
      trainingStyle:      (req.query.style as string)    || 'mixed',
      equipmentNeeds:     [],
      budgetRange:        (req.query.budget as string)   || '10_to_20',
      maxDistanceMinutes: parseInt(req.query.maxMins as string) || 20,
      environmentPref:    'both',
    }

    // Fetch gyms from our database
    // PostGIS spatial query will replace this raw fetch in the next iteration
    const gymsFromDb = await prisma.gym.findMany({
      take: 20,
      include: {
        priceReports: {
          where:   { verified: true },
          orderBy: { createdAt: 'desc' },
          take:    1,
        },
      },
    })

    // Shape database records into the RawGym format the match engine expects
    const rawGyms: RawGym[] = gymsFromDb.map(gym => {
      const latestPrice = gym.priceReports[0]

      // Rough distance estimate using Haversine formula
      const distanceKm     = haversineKm(lat, lng, gym.lat, gym.lng)
      const distanceMinutes = Math.round(distanceKm / 0.08) // ~80m per minute walking

      return {
        id:              gym.id,
        name:            gym.name,
        address:         gym.address,
        lat:             gym.lat,
        lng:             gym.lng,
        distanceMinutes,
        equipmentTags:   gym.equipmentTags,
        rating:          gym.rating,
        openNow:         true,   // placeholder until opening hours logic is added
        dayPassPence:    latestPrice?.dayPassPence   ?? null,
        monthlyPence:    latestPrice?.monthlyPence   ?? null,
      }
    })

    // Filter to radius before scoring
    const inRadius = rawGyms.filter(g => {
      const distanceM = haversineKm(lat, lng, g.lat, g.lng) * 1000
      return distanceM <= radius
    })

    // Score and rank
    const scored = scoreGyms(profile, inRadius)

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

/**
 * POST /api/gyms/:id/access
 *
 * Records that a user intends to access a gym (the "I'm going here" tap).
 * Creates a gym_access record which drives the cancellation reminder.
 */
router.post('/:id/access', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id }              = req.params
    const { expectedEndDate, accessType, citySlug } = req.body

    if (!expectedEndDate || !accessType || !citySlug) {
      res.status(400).json({
        error: 'Required fields: expectedEndDate, accessType, citySlug',
      })
      return
    }

    // Confirm gym exists
    const gym = await prisma.gym.findUnique({ where: { id } })
    if (!gym) {
      res.status(404).json({ error: 'Gym not found' })
      return
    }

    // Placeholder user ID until auth is wired up
    const PLACEHOLDER_USER_ID = req.headers['x-user-id'] as string
    if (!PLACEHOLDER_USER_ID) {
      res.status(401).json({ error: 'x-user-id header required (temporary until auth)' })
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
      message: 'Access recorded. We\'ll remind you to cancel before you leave.',
      access,
    })
  } catch (err) {
    next(err)
  }
})

// ─── Haversine distance formula ───────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371  // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export default router