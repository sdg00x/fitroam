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

    const requiredEquipment = (req.query.requiredEquipment as string)
      ?.split(',').filter(Boolean) || []

    const rawGyms = await fetchNearbyGyms(lat, lng, radius)
    let   scored  = scoreGyms(profile, rawGyms)

    // If requiredEquipment is set, filter to gyms that have ANY of the required tags
    // (requiring ALL is too strict — most gyms won't have every item tagged)
    if (requiredEquipment.length > 0) {
      scored = scored.filter(gym => {
        const tags = gym.equipmentTags.map(t => t.toLowerCase())
        return requiredEquipment.some(req =>
          tags.some(tag => tag.includes(req.toLowerCase()) || req.toLowerCase().includes(tag))
        )
      })
    }

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

    console.log('[Access] looking for user id:', userId)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      res.status(401).json({ error: "User not found. Sign up first." })
      return
    }

    const access = await prisma.gymAccess.create({
      data: {
        userId:          user.id,
        gymId:           gym.id,
        accessType,
        citySlug:        citySlug ?? 'unknown',
        expectedEndDate: new Date(expectedEndDate),
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


router.get("/:id/visits", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.headers["x-user-id"] as string

    if (!userId) {
      res.status(400).json({ error: "Missing x-user-id header" })
      return
    }

    const visits = await prisma.gymAccess.findMany({
      where:   { gymId: id, userId },
      orderBy: { activatedAt: "desc" },
      select: {
        id:               true,
        accessType:       true,
        activatedAt:      true,
        expectedEndDate:  true,
        status:           true,
        notes:            true,
      },
    })

    res.json({ visits, total: visits.length })
  } catch (err) {
    next(err)
  }
})


// PATCH /api/gyms/:gymId/visits/:visitId — confirm or deny a visit
router.patch("/:gymId/visits/:visitId", async (req, res, next) => {
  try {
    const { gymId, visitId } = req.params
    const userId = req.headers["x-user-id"] as string
    const { status } = req.body

    if (!userId) {
      res.status(400).json({ error: "Missing x-user-id header" })
      return
    }
    if (!status || !["pending", "confirmed", "denied"].includes(status)) {
      res.status(400).json({ error: "status must be pending, confirmed, or denied" })
      return
    }

    // Verify visit belongs to this user
    const visit = await prisma.gymAccess.findFirst({
      where: { id: visitId, userId, gymId },
    })
    if (!visit) {
      res.status(404).json({ error: "Visit not found" })
      return
    }

    const updated = await prisma.gymAccess.update({
      where: { id: visitId },
      data: {
        status,
        confirmedAt: status === "confirmed" ? new Date() : null,
      },
    })

    res.json({ visit: updated })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/gyms/:gymId/visits/:visitId — remove a visit from passport
router.delete("/:gymId/visits/:visitId", async (req, res, next) => {
  try {
    const { gymId, visitId } = req.params
    const userId = req.headers["x-user-id"] as string

    if (!userId) {
      res.status(400).json({ error: "Missing x-user-id header" })
      return
    }

    const visit = await prisma.gymAccess.findFirst({
      where: { id: visitId, userId, gymId },
    })
    if (!visit) {
      res.status(404).json({ error: "Visit not found" })
      return
    }

    await prisma.gymAccess.delete({ where: { id: visitId } })
    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
})

export default router
