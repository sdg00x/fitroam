const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '/Users/sdg1/fitroam/packages/api/.env' })

const prisma = new PrismaClient()
const API_KEY = process.env.GOOGLE_PLACES_API_KEY
const FAKE_ID_RE = /^[A-Z0-9_]+_[A-Za-z]+[0-9]+$|^(PG|TGG|AF|VA|NH|MW|BT|CF|PF|EQ|TMPL|DP|LT|YMCA|CP|BAC|IS|MAC|AN|IP|BB|SBB|CF|1R|MW|BT|GH|GS|IP|SB)_/

async function searchPlace(name, address) {
  const query = `${name} ${address}`
  const url = `https://places.googleapis.com/v1/places:searchText`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.photos',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.places?.[0] ?? null
}

async function main() {
  const gyms = await prisma.gym.findMany({
    where: {
      verified: true,
      citySlug: { in: ['london-gb', 'newyork-us', 'miami-us'] },
      OR: [
        { photoUrls: { isEmpty: true } },
        { photoUrls: { equals: [] } },
      ]
    },
    select: { id: true, name: true, address: true, placesId: true }
  })

  console.log(`Found ${gyms.length} gyms with empty photos`)

  let updated = 0
  let failed = 0

  for (const gym of gyms) {
    if (!FAKE_ID_RE.test(gym.placesId)) {
      console.log(`SKIP (real Place ID): ${gym.name}`)
      continue
    }

    try {
      await new Promise(r => setTimeout(r, 200))
      const place = await searchPlace(gym.name, gym.address)
      if (!place) {
        console.log(`NOT FOUND: ${gym.name}`)
        failed++
        continue
      }

      const photoUrls = (place.photos ?? []).slice(0, 4).map(p =>
        `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=400&maxWidthPx=600&key=${API_KEY}`
      )

      await prisma.gym.update({
        where: { id: gym.id },
        data: {
          placesId: place.id,
          photoUrls,
        }
      })

      console.log(`UPDATED: ${gym.name} → ${place.id} (${photoUrls.length} photos)`)
      updated++
    } catch (err) {
      console.log(`ERROR: ${gym.name} — ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone. Updated: ${updated}, Failed/skipped: ${failed}`)
  await prisma.$disconnect()
}

main()
