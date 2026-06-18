import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/visits/pending — visits past their date awaiting confirmation
router.get('/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      res.status(400).json({ error: 'Missing x-user-id header' })
      return
    }

    // Find pending visits where the visit date has passed
    const visits = await prisma.gymAccess.findMany({
      where: {
        userId,
        status: 'pending',
        activatedAt: { lt: new Date() },
      },
      include: {
        gym: { select: { id: true, name: true, address: true, photoUrls: true } },
      },
      orderBy: { activatedAt: 'desc' },
    })

    res.json({ visits, total: visits.length })
  } catch (err) {
    next(err)
  }
})

// GET /api/visits/all — all visits for this user (for Passport)
router.get('/all', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      res.status(400).json({ error: 'Missing x-user-id header' })
      return
    }

    const rows = await prisma.gymAccess.findMany({
      where:   { userId },
      include: { gym: { select: { id: true, name: true, address: true } } },
      orderBy: { activatedAt: 'desc' },
    })

    // Shape for mobile consumption
    const visits = rows.map((r: any) => ({
      id:          r.id,
      gymId:       r.gymId,
      gymName:     r.gym.name,
      gymAddress:  r.gym.address,
      accessType:  r.accessType,
      status:      r.status,
      visitedAt:   r.activatedAt.toISOString(),
      confirmedAt: r.confirmedAt?.toISOString() ?? null,
    }))

    res.json({ visits })
  } catch (err) {
    next(err)
  }
})

export default router
