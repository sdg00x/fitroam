import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// Shape the profile for the API response (snake_case → camelCase already handled by Prisma)
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
    onboarded:          p.onboarded,
  }
}

// ─── POST /api/auth/signup ─────────────────────────────────────────
// Creates a real user + default profile. Returns 409 if email exists.
router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, phone } = req.body
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'email is required' })
      return
    }
    const normalizedEmail = email.trim().toLowerCase()

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      res.status(409).json({
        error: 'An account with this email already exists',
        action: 'signin',
      })
      return
    }

    // Create user + default profile in one transaction
    const user = await prisma.user.create({
      data: {
        clerkId: normalizedEmail,
        email:   normalizedEmail,
        name:    name?.trim() || null,
        phone:   phone?.trim() || null,
        profile: {
          create: {}, // all defaults from schema (onboarded: false, etc.)
        },
      },
      include: { profile: true },
    })

    res.status(201).json({
      user: {
        id:        user.id,
        email:     user.email,
        name:      user.name,
        phone:     user.phone,
        createdAt: user.createdAt.toISOString(),
      },
      profile: user.profile ? serializeProfile(user.profile) : null,
    })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/auth/signin ─────────────────────────────────────────
// PRE-LAUNCH BLOCKER: email-only auth, replace with magic codes.
router.post('/signin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'email is required' })
      return
    }
    const normalizedEmail = email.trim().toLowerCase()

    const user = await prisma.user.findUnique({
      where:   { email: normalizedEmail },
      include: { profile: true },
    })
    if (!user) {
      res.status(404).json({
        error: 'No account found with this email',
        action: 'signup',
      })
      return
    }

    // Safety: if user somehow has no profile row, create one now
    let profile = user.profile
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: { userId: user.id },
      })
    }

    res.json({
      user: {
        id:        user.id,
        email:     user.email,
        name:      user.name,
        phone:     user.phone,
        createdAt: user.createdAt.toISOString(),
      },
      profile: serializeProfile(profile),
    })
  } catch (err) {
    next(err)
  }
})

export default router
