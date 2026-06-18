import { Router, Request, Response, NextFunction } from 'express'

const router = Router()

// In-memory cache, keyed by rounded lat/lng (to 2 decimal places = ~1km granularity)
// Entries expire after 15 minutes. Saves API calls when many users in the same area.
interface CacheEntry { data: any; expiresAt: number }
const cache = new Map<string, CacheEntry>()
const TTL_MS = 15 * 60 * 1000

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`
}

// GET /api/weather?lat=...&lng=...
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string)
    const lng = parseFloat(req.query.lng as string)
    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'lat and lng required' })
      return
    }

    const key = cacheKey(lat, lng)
    const cached = cache.get(key)
    if (cached && cached.expiresAt > Date.now()) {
      res.json(cached.data)
      return
    }

    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) throw new Error('OPENWEATHER_API_KEY not set')

    // Free tier: current weather endpoint
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`
    const r = await fetch(url)
    if (!r.ok) {
      const txt = await r.text()
      console.error('Weather API error:', r.status, txt)
      res.status(502).json({ error: 'Weather API error' })
      return
    }
    const w = await r.json() as any

    const result = {
      tempC:       Math.round(w.main?.temp ?? 0),
      feelsLikeC:  Math.round(w.main?.feels_like ?? 0),
      condition:   w.weather?.[0]?.main || 'Clear',         // e.g. 'Clear', 'Clouds', 'Rain'
      description: w.weather?.[0]?.description || '',       // e.g. 'few clouds'
      icon:        w.weather?.[0]?.icon || '01d',           // OpenWeatherMap icon code
      city:        w.name || '',
      country:     w.sys?.country || '',
    }

    cache.set(key, { data: result, expiresAt: Date.now() + TTL_MS })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
