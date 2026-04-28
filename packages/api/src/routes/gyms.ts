import { Router, Request, Response, NextFunction } from 'express'
import { scoreGyms, UserProfile } from '../services/matchEngine'
import { fetchNearbyGyms } from '../services/placesService'

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
      trainingStyle:      (req.query.style as string)  || 'mixed',
      equipmentNeeds:     [],
      budgetRange:        (req.query.budget as string) || '10_to_20',
      maxDistanceMinutes: parseInt(req.query.maxMins as string) || 30,
      environmentPref:    'both',
    }

    const rawGyms = await fetchNearbyGyms(lat, lng, radius)
    let   scored  = scoreGyms(profile, rawGyms)

    // Apply sort
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
        // already sorted by match score from scoreGyms
        break
    }

    res.json({
      gyms:   scored,
      total:  scored.length,
      location: { lat, lng },
      radius,
      sort,
    })
  } catch (err) {
    next(err)
  }
})

export default router