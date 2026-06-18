import { Router, Request, Response, NextFunction } from 'express'

const router = Router()

// GET /api/places/autocomplete?q=...
router.get('/autocomplete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string)?.trim()
    if (!q || q.length < 2) {
      res.json({ predictions: [] })
      return
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not set')

    const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method:  'POST',
      headers: {
        'Content-Type':   'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input: q,
        includedPrimaryTypes: [
          'locality',
          'sublocality',
          'postal_town',
          'street_address',
          'premise',
        ],
      }),
    })

    if (!r.ok) {
      const txt = await r.text()
      console.error('Places autocomplete error:', r.status, txt)
      res.status(502).json({ error: 'Places API error' })
      return
    }

    const data = await r.json() as any
    const predictions = (data.suggestions ?? []).map((s: any) => ({
      placeId:   s.placePrediction?.placeId,
      mainText:  s.placePrediction?.structuredFormat?.mainText?.text,
      secondary: s.placePrediction?.structuredFormat?.secondaryText?.text,
      fullText:  s.placePrediction?.text?.text,
    })).filter((p: any) => p.placeId)

    res.json({ predictions })
  } catch (err) {
    next(err)
  }
})

// GET /api/places/details/:placeId
router.get('/details/:placeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const placeId = req.params.placeId
    const apiKey  = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not set')

    const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key':   apiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents',
      },
    })

    if (!r.ok) {
      const txt = await r.text()
      console.error('Places details error:', r.status, txt)
      res.status(502).json({ error: 'Places API error' })
      return
    }

    const data = await r.json() as any

    let country: string | undefined
    let city:    string | undefined
    for (const comp of data.addressComponents ?? []) {
      if (comp.types?.includes('country')) country = comp.shortText
      if (comp.types?.includes('locality') || comp.types?.includes('postal_town')) {
        city = comp.longText
      }
    }

    res.json({
      place: {
        placeId:          data.id,
        name:             data.displayName?.text,
        formattedAddress: data.formattedAddress,
        lat:              data.location?.latitude,
        lng:              data.location?.longitude,
        city,
        country,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
