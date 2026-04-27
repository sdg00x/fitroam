import { prisma } from '../lib/prisma'
import { RawGym } from './matchEngine'

const PLACES_API_BASE = 'https://places.googleapis.com/v1'
const CACHE_TTL_HOURS = 24

interface PlacesNearbyResult {
  id:               string
  displayName:      { text: string }
  formattedAddress: string
  location:         { latitude: number; longitude: number }
  rating?:          number
  userRatingCount?: number
  currentOpeningHours?: { openNow: boolean }
  regularOpeningHours?: { periods: any[] }
}

export async function fetchNearbyGyms(
  lat: number,
  lng: number,
  radiusMetres: number = 2000
): Promise<RawGym[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    console.log('[Places] No API key — falling back to database')
    return fetchFromDatabase(lat, lng, radiusMetres)
  }

  const cached = await getCachedGyms(lat, lng, radiusMetres)
  if (cached.length > 0) {
    console.log(`[Places] Cache hit — ${cached.length} gyms from DB`)
    return cached
  }

  console.log('[Places] Cache miss — calling Google Places API')
  const places = await callPlacesAPI(lat, lng, radiusMetres, apiKey)
  await upsertGyms(places)
  return places.map(p => placeToRawGym(p, lat, lng))
}

async function fetchFromDatabase(
  lat: number,
  lng: number,
  radiusMetres: number
): Promise<RawGym[]> {
  const gyms = await prisma.gym.findMany({
    take: 20,
    include: {
      priceReports: {
        where:   { verified: true },
        orderBy: { createdAt: 'desc' },
        take:    1,
      },
    },
  })

  return gyms
    .map(gym => {
      const distanceKm      = haversineKm(lat, lng, gym.lat, gym.lng)
      const distanceMinutes = Math.round(distanceKm / 0.08)
      const latestPrice     = gym.priceReports[0]

      return {
        id:              gym.id,
        name:            gym.name,
        address:         gym.address,
        lat:             gym.lat,
        lng:             gym.lng,
        distanceMinutes,
        equipmentTags:   gym.equipmentTags,
        rating:          gym.rating,
        openNow:         true,
        dayPassPence:    latestPrice?.dayPassPence  ?? null,
        monthlyPence:    latestPrice?.monthlyPence  ?? null,
      }
    })
    .filter(g => haversineKm(lat, lng, g.lat, g.lng) * 1000 <= radiusMetres)
}

async function getCachedGyms(
  lat: number,
  lng: number,
  radiusMetres: number
): Promise<RawGym[]> {
  const cutoff      = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000)
  const degreesLat  = radiusMetres / 111000
  const degreesLng  = radiusMetres / (111000 * Math.cos(lat * Math.PI / 180))

  const gyms = await prisma.gym.findMany({
    where: {
      lat:          { gte: lat - degreesLat, lte: lat + degreesLat },
      lng:          { gte: lng - degreesLng, lte: lng + degreesLng },
      lastFetchedAt: { gte: cutoff },
    },
    include: {
      priceReports: {
        where:   { verified: true },
        orderBy: { createdAt: 'desc' },
        take:    1,
      },
    },
  })

  return gyms.map(gym => {
    const latestPrice     = gym.priceReports[0]
    const distanceKm      = haversineKm(lat, lng, gym.lat, gym.lng)
    const distanceMinutes = Math.round(distanceKm / 0.08)

    return {
      id:              gym.id,
      name:            gym.name,
      address:         gym.address,
      lat:             gym.lat,
      lng:             gym.lng,
      distanceMinutes,
      equipmentTags:   gym.equipmentTags,
      rating:          gym.rating,
      openNow:         true,
      dayPassPence:    latestPrice?.dayPassPence  ?? null,
      monthlyPence:    latestPrice?.monthlyPence  ?? null,
    }
  })
}

async function callPlacesAPI(
  lat: number,
  lng: number,
  radiusMetres: number,
  apiKey: string
): Promise<PlacesNearbyResult[]> {
  const response = await fetch(`${PLACES_API_BASE}/places:searchNearby`, {
    method: 'POST',
    headers: {
      'Content-Type':     'application/json',
      'X-Goog-Api-Key':   apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.userRatingCount',
        'places.currentOpeningHours',
        'places.regularOpeningHours',
      ].join(','),
    },
    body: JSON.stringify({
      includedTypes:       ['gym', 'fitness_center'],
      maxResultCount:      20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMetres,
        },
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Google Places API error ${response.status}: ${body}`)
  }

  const data = await response.json()
  return data.places ?? []
}

async function upsertGyms(places: PlacesNearbyResult[]): Promise<void> {
  for (const place of places) {
    await prisma.gym.upsert({
      where:  { placesId: place.id },
      update: {
        name:          place.displayName.text,
        address:       place.formattedAddress,
        lat:           place.location.latitude,
        lng:           place.location.longitude,
        rating:        place.rating        ?? null,
        ratingCount:   place.userRatingCount ?? null,
        lastFetchedAt: new Date(),
        openingHours:  place.regularOpeningHours ?? null,
      },
      create: {
        placesId:      place.id,
        name:          place.displayName.text,
        address:       place.formattedAddress,
        lat:           place.location.latitude,
        lng:           place.location.longitude,
        rating:        place.rating        ?? null,
        ratingCount:   place.userRatingCount ?? null,
        lastFetchedAt: new Date(),
        openingHours:  place.regularOpeningHours ?? null,
        equipmentTags: [],
      },
    })
  }
  console.log(`[Places] Upserted ${places.length} gyms to DB`)
}

function placeToRawGym(
  place: PlacesNearbyResult,
  userLat: number,
  userLng: number
): RawGym {
  const distanceKm      = haversineKm(userLat, userLng, place.location.latitude, place.location.longitude)
  const distanceMinutes = Math.round(distanceKm / 0.08)

  return {
    id:              place.id,
    name:            place.displayName.text,
    address:         place.formattedAddress,
    lat:             place.location.latitude,
    lng:             place.location.longitude,
    distanceMinutes,
    equipmentTags:   [],
    rating:          place.rating ?? null,
    openNow:         place.currentOpeningHours?.openNow ?? true,
    dayPassPence:    null,
    monthlyPence:    null,
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}