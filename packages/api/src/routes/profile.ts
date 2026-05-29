import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { isValidCitySlug, CITY_SLUGS } from '../config/cities'

const router = Router()

function serializeProfile(p: any) {
  return {
    primaryActivity:    p.primaryActivity,
    activities:         p.activities,
    facilityTypes:      p.facilityTypes,
    lifestyle:          p.lifestyle,
    priorities:         p.priorities,
    monthlyBudget:      p.monthlyBudget,
    travelDailyBudget:  p.travelDailyBudget,
    maxDistanceMinutes: p.maxDistanceMinutes,
    trainingPattern:    p.trainingPattern,
    themePreference:    p.themePreference,
    citySlug:           p.citySlug,
    onboarded:          p.onboarded,
  }
}

// GET /api/profile — return current user's profile
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      res.status(400).json({ error: 'Missing x-user-id header' })
      return
    }

    const profile = await prisma.userProfile.findUnique({ where: { userId } })
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }

    res.json({ profile: serializeProfile(profile) })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/profile — update fields
router.patch('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      res.status(400).json({ error: 'Missing x-user-id header' })
      return
    }

    // Allow only known fields through
    const allowed = [
      'primaryActivity', 'activities', 'facilityTypes', 'lifestyle',
      'priorities', 'monthlyBudget', 'travelDailyBudget',
      'maxDistanceMinutes', 'trainingPattern', 'themePreference',
      'onboarded', 'citySlug',
    ]
    if ('citySlug' in req.body && isValidCitySlug(req.body.citySlug) === false) {
      res.status(400).json({ error: 'Invalid citySlug', allowed: CITY_SLUGS })
      return
    }
    const updates: any = {}
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key]
    }

    const profile = await prisma.userProfile.upsert({
      where:  { userId },
      update: updates,
      create: { userId, ...updates },
    })

    res.json({ profile: serializeProfile(profile) })
  } catch (err) {
    next(err)
  }
})

export default router
