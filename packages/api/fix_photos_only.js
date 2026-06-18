const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '/Users/sdg1/fitroam/packages/api/.env' })

const prisma = new PrismaClient()
const API_KEY = process.env.GOOGLE_PLACES_API_KEY

const FAILED_GYMS = [
  { id: null, name: 'Manhattan Athletic Club', address: '630 Lexington Avenue, New York, NY 10022' },
  { id: null, name: 'PureGym London West India Quay', address: '5 Hertsmere Road, London E14 4AN' },
  { id: null, name: 'Equinox Flatiron', address: '897 Broadway, New York, NY 10003' },
  { id: null, name: "TMPL Hell's Kitchen", address: '610 West 56th Street, New York, NY 10019' },
  { id: null, name: 'TMPL West Village', address: '315 Hudson Street, New York, NY 10013' },
  { id: null, name: 'TMPL 53rd & Lexington', address: '888 Lexington Avenue, New York, NY 10065' },
  { id: null, name: 'TMPL Avenue A', address: '605 East 6th Street, New York, NY 10009' },
  { id: null, name: 'Dogpound Upper East Side', address: '137 E 62nd Street, New York, NY 10065' },
  { id: null, name: 'Crunch Fitness Times Square', address: '1675 Broadway, New York, NY 10019' },
  { id: null, name: 'Crunch Fitness Midtown West', address: '555 W 42nd Street, New York, NY 10036' },
  { id: null, name: 'Crunch Fitness Wynwood', address: '2750 NW 3rd Avenue, Miami, FL 33127' },
  { id: null, name: 'Crunch Fitness Brickell', address: '1451 S Miami Avenue, Miami, FL 33130' },
]

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
  for (const gym of FAILED_GYMS) {
    await new Promise(r => setTimeout(r, 200))
    const place = await searchPlace(gym.name, gym.address)
    if (!place?.photos?.length) {
      console.log(`NOT FOUND: ${gym.name}`)
      continue
    }
    const photoUrls = place.photos.slice(0, 4).map(p =>
      `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=400&maxWidthPx=600&key=${API_KEY}`
    )
    // Update photos only — don't touch Place ID
    await prisma.gym.updateMany({
      where: { name: gym.name, verified: true },
      data: { photoUrls }
    })
    console.log(`UPDATED photos: ${gym.name} (${photoUrls.length} photos)`)
  }
  console.log('Done')
  await prisma.$disconnect()
}

main()
