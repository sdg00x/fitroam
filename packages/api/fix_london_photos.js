const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '/Users/sdg1/fitroam/packages/api/.env' })

const prisma = new PrismaClient()
const API_KEY = process.env.GOOGLE_PLACES_API_KEY
const FAKE_ID_RE = /^[A-Z0-9_]+_[A-Za-z]+[0-9]+$|^(PG|TGG|AF|VA|NH|MW|BT|CF|PF|EQ|ff|BT|GH|1R|SBB|AN|IP|BB|GymAge|MW)_/

async function searchPlace(name, address) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.photos',
    },
    body: JSON.stringify({ textQuery: `${name} ${address}`, maxResultCount: 1 }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.places?.[0] ?? null
}

async function main() {
  const gyms = await prisma.gym.findMany({
    where: {
      verified: true,
      citySlug: 'london-gb',
      OR: [
        { photoUrls: { isEmpty: true } },
        { photoUrls: { equals: [] } },
      ]
    },
    select: { id: true, name: true, address: true, placesId: true }
  })

  console.log(`Found ${gyms.length} London gyms with empty photos`)
  let updated = 0

  for (const gym of gyms) {
    await new Promise(r => setTimeout(r, 200))
    const place = await searchPlace(gym.name, gym.address)
    if (!place?.photos?.length) {
      console.log(`NOT FOUND: ${gym.name}`)
      continue
    }
    const photoUrls = place.photos.slice(0, 4).map(p =>
      `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=400&maxWidthPx=600&key=${API_KEY}`
    )
    try {
      if (FAKE_ID_RE.test(gym.placesId)) {
        await prisma.gym.update({ where: { id: gym.id }, data: { placesId: place.id, photoUrls } })
        console.log(`UPDATED: ${gym.name} → ${place.id}`)
      } else {
        await prisma.gym.update({ where: { id: gym.id }, data: { photoUrls } })
        console.log(`PHOTOS ONLY: ${gym.name}`)
      }
      updated++
    } catch (err) {
      await prisma.gym.update({ where: { id: gym.id }, data: { photoUrls } })
      console.log(`PHOTOS ONLY (conflict): ${gym.name}`)
      updated++
    }
  }

  console.log(`\nDone. Updated: ${updated}`)
  await prisma.$disconnect()
}

main()
