import { prisma } from '../lib/prisma'
import { RawGym } from './matchEngine'

const PLACES_API_BASE = 'https://places.googleapis.com/v1'
const CACHE_TTL_HOURS = 24

/**
 * Fetch nearby gyms from Google Places API (New)
 * Uses textSearch for better gym-specific results
 * then fetches full details for each result
 */

interface PlaceResult {
  id:               string
  displayName:      { text: string; languageCode: string }
  formattedAddress: string
  location:         { latitude: number; longitude: number }
  rating?:          number
  userRatingCount?: number
  currentOpeningHours?: { openNow: boolean }
  regularOpeningHours?: { periods: any[] }
  reviews?:         PlaceReview[]
  photos?:          PlacePhoto[]
  websiteUri?:      string
  nationalPhoneNumber?: string
  types?:           string[]
}

interface PlaceReview {
  name:             string
  relativePublishTimeDescription: string
  rating:           number
  text:             { text: string; languageCode: string }
  authorAttribution: { displayName: string; photoUri: string }
}

interface PlacePhoto {
  name:             string
  widthPx:          number
  heightPx:         number
  authorAttributions: any[]
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function fetchNearbyGyms(
  lat:          number,
  lng:          number,
  radiusMetres: number = 2000
): Promise<RawGym[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not set')

  // Check cache first
  const cached = await getCachedGyms(lat, lng, radiusMetres)
  if (cached.length >= 10) {
    console.log(`[Places] Cache hit — ${cached.length} gyms from DB`)
    return cached
  }

  console.log(`[Places] Cache miss — calling Google Places API`)

  // Use text search for better gym-specific results
  const places = await searchGymsNearby(lat, lng, radiusMetres, apiKey)

  // Filter out hotels and non-gym venues
  const gymsOnly = places.filter(p => isActualGym(p))

  console.log(`[Places] ${places.length} results → ${gymsOnly.length} after filtering hotels/spas`)

  // Fetch full details for each gym including photos and reviews
  const detailedGyms = await fetchDetailsForGyms(gymsOnly, apiKey)

  // Store in DB
  await upsertGyms(detailedGyms)

  return detailedGyms.map(p => placeToRawGym(p, lat, lng))
}

// ─── Filter out non-gyms ──────────────────────────────────────────────────────

function isActualGym(place: PlaceResult): boolean {
  const name = place.displayName.text.toLowerCase()
  const types = place.types ?? []

  // Exclude hotels, spas, and leisure centres masquerading as gyms
  const excludeKeywords = [
    'hotel', 'spa', 'plaza', 'marriott', 'hilton', 'holiday inn',
    'novotel', 'ibis', 'premier inn', 'travelodge', 'radisson',
    'swimming', 'pool', 'leisure centre', 'village hotel',
    'parkinn', 'park inn', 'doubletree', 'sheraton',
  ]

  const hasExcludedKeyword = excludeKeywords.some(kw => name.includes(kw))
  if (hasExcludedKeyword) return false

  // Must have gym-related type or name
  const gymTypes = ['gym', 'fitness_centre', 'health', 'sport']
  const gymKeywords = [
    'gym', 'fitness', 'sport', 'crossfit', 'puregym', 'pure gym',
    'jd gym', 'the gym', 'gym group', 'anytime fitness', 'snap fitness',
    'david lloyd', 'virgin active', 'nuffield', 'bannatyne', 'everyone active',
    'better gym', 'total fitness', 'bodybuilding', 'weights', 'strength',
    'box', 'functional', 'powerlifting', 'barbell',
  ]

  const hasGymName = gymKeywords.some(kw => name.includes(kw))
  const hasGymType = types.some(t => gymTypes.some(gt => t.includes(gt)))

  return hasGymName || hasGymType
}

// ─── Text search for gyms ─────────────────────────────────────────────────────

async function searchGymsNearby(
  lat:     number,
  lng:     number,
  radius:  number,
  apiKey:  string
): Promise<PlaceResult[]> {

  // Run two searches — one for gyms, one for fitness centres — then deduplicate
  const searches = [
    searchText('gym', lat, lng, radius, apiKey),
    searchText('fitness centre', lat, lng, radius, apiKey),
    searchText('crossfit box', lat, lng, radius, apiKey),
  ]

  const results = await Promise.all(searches)
  const all     = results.flat()

  // Deduplicate by place ID
  const seen = new Set<string>()
  return all.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

async function searchText(
  query:   string,
  lat:     number,
  lng:     number,
  radius:  number,
  apiKey:  string
): Promise<PlaceResult[]> {
  const response = await fetch(`${PLACES_API_BASE}/places:searchText`, {
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
        'places.types',
      ].join(','),
    },
    body: JSON.stringify({
      textQuery:          query,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radius,
        },
      },
      maxResultCount: 20,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`[Places] Text search error ${response.status}:`, body)
    return []
  }

  const data = await response.json() as any
  return data.places ?? []
}

// ─── Fetch full details for each gym ─────────────────────────────────────────

async function fetchDetailsForGyms(
  places: PlaceResult[],
  apiKey: string
): Promise<PlaceResult[]> {
  const detailed: PlaceResult[] = []

  // Fetch details in parallel batches of 5
  const batchSize = 5
  for (let i = 0; i < places.length; i += batchSize) {
    const batch   = places.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(p => fetchPlaceDetails(p.id, apiKey).catch(() => p))
    )
    detailed.push(...results)
  }

  return detailed
}

export async function fetchPlaceDetails(
  placeId: string,
  apiKey:  string
): Promise<PlaceResult> {
  const fields = [
    'id',
    'displayName',
    'formattedAddress',
    'location',
    'rating',
    'userRatingCount',
    'currentOpeningHours',
    'regularOpeningHours',
    'reviews',
    'photos',
    'websiteUri',
    'nationalPhoneNumber',
    'types',
  ].join(',')

  const response = await fetch(
    `${PLACES_API_BASE}/places/${placeId}?fields=${fields}`,
    {
      headers: {
        'X-Goog-Api-Key': apiKey,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Place details fetch failed for ${placeId}`)
  }

  return response.json() as Promise<PlaceResult>
}
// ─── Infer equipment tags from gym name and types ─────────────────────────────

function inferEquipmentTags(place: PlaceResult): string[] {
  const name  = place.displayName.text.toLowerCase()
  const tags: string[] = []

  // Most gyms have these
  if (!name.includes('yoga') && !name.includes('pilates') && !name.includes('dance')) {
    tags.push('free_weights', 'treadmill', 'cables')
  }

  // Specific equipment by gym type/name
  if (name.includes('puregym') || name.includes('pure gym') || name.includes('jd gym') ||
      name.includes('gym group') || name.includes('snap') || name.includes('anytime')) {
    tags.push('barbells', 'power_rack', 'bikes')
  }

  if (name.includes('crossfit') || name.includes('box') || name.includes('functional')) {
    tags.push('pull_up_bars', 'rings', 'barbells', 'rowing')
  }

  if (name.includes('david lloyd') || name.includes('virgin') || name.includes('nuffield') ||
      name.includes('bannatyne') || name.includes('everyone active')) {
    tags.push('barbells', 'pool', 'bikes', 'classes')
  }

  if (name.includes('calisthenics') || name.includes('street workout')) {
    tags.push('pull_up_bars', 'dip_bars', 'rings', 'parallettes')
  }

  if (name.includes('strength') || name.includes('powerlifting') || name.includes('barbell')) {
    tags.push('barbells', 'power_rack', 'deadlift_platform')
  }

  return [...new Set(tags)] // deduplicate
}

// ─── Get photo URLs ───────────────────────────────────────────────────────────

export function getPhotoUrls(
  photos:  PlacePhoto[] | undefined,
  apiKey:  string,
  maxPhotos: number = 4
): string[] {
  if (!photos || photos.length === 0) return []

  return photos.slice(0, maxPhotos).map(photo => {
    const photoName = photo.name
    return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=600&key=${apiKey}`
  })
}

// ─── Store in DB ──────────────────────────────────────────────────────────────

export async function upsertGyms(places: PlaceResult[]): Promise<void> {
  for (const place of places) {
    const equipmentTags = inferEquipmentTags(place)
    const photoUrls     = getPhotoUrls(
      place.photos,
      process.env.GOOGLE_PLACES_API_KEY ?? '',
      4
    )
    
    const reviews = (place.reviews ?? []).slice(0, 3)
  .filter(r => r.text?.text && r.authorAttribution?.displayName)
  .map(r => ({
    author: r.authorAttribution.displayName,
    rating: r.rating,
    text:   r.text.text,
    time:   r.relativePublishTimeDescription ?? '',
    avatar: r.authorAttribution.photoUri     ?? '',
  }))

    // Store both opening hours and reviews in the JSON column
        const gymData = {
        periods: place.regularOpeningHours?.periods ?? [],
        reviews,
        }

    await prisma.gym.upsert({
      where:  { placesId: place.id },
            update: {
        name:          place.displayName.text,
        address:       place.formattedAddress,
        lat:           place.location.latitude,
        lng:           place.location.longitude,
        rating:        place.rating         ?? null,
        ratingCount:   place.userRatingCount ?? null,
        lastFetchedAt: new Date(),
        openingHours:  gymData,
        equipmentTags,
        photoUrls,
        websiteUrl:    place.websiteUri ?? null,    // ← add this
        },
    create: {
  placesId:      place.id,
  name:          place.displayName.text,
  address:       place.formattedAddress,
  lat:           place.location.latitude,
  lng:           place.location.longitude,
  rating:        place.rating         ?? null,
  ratingCount:   place.userRatingCount ?? null,
  lastFetchedAt: new Date(),
  openingHours:  gymData,
  equipmentTags,
  photoUrls,
  websiteUrl:    place.websiteUri ?? null,    // ← add this
},
    })
  }
  console.log(`[Places] Upserted ${places.length} gyms with photos and reviews`)
}

// ─── Cache check ──────────────────────────────────────────────────────────────

async function getCachedGyms(
  lat:          number,
  lng:          number,
  radiusMetres: number
): Promise<RawGym[]> {
  const cutoff      = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000)
  const degreesLat  = radiusMetres / 111000
  const degreesLng  = radiusMetres / (111000 * Math.cos(lat * Math.PI / 180))

  const gyms = await prisma.gym.findMany({
    where: {
      lat:           { gte: lat - degreesLat, lte: lat + degreesLat },
      lng:           { gte: lng - degreesLng, lte: lng + degreesLng },
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

  if (gyms.length === 0) return []

  return gyms.map((gym: any) => {
  const latestPrice     = gym.priceReports[0]
  const distanceKm      = haversineKm(lat, lng, gym.lat, gym.lng)
  const distanceMinutes = Math.round(distanceKm / 0.08)
  const gymData         = gym.openingHours as any
  const reviews         = gymData?.reviews ?? []

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
    dayPassPence:    latestPrice?.dayPassPence ?? null,
    monthlyPence:    latestPrice?.monthlyPence ?? null,
    photoUrls:       (gym as any).photoUrls   ?? [],
    reviews,
    websiteUrl:      gym.websiteUrl ?? undefined,
  }
})
}

// ─── Shape converter ──────────────────────────────────────────────────────────

function placeToRawGym(
  place:   PlaceResult,
  userLat: number,
  userLng: number
): RawGym {
  const distanceKm      = haversineKm(userLat, userLng, place.location.latitude, place.location.longitude)
  const distanceMinutes = Math.round(distanceKm / 0.08)
  const equipmentTags   = inferEquipmentTags(place)
  const photoUrls       = getPhotoUrls(
    place.photos,
    process.env.GOOGLE_PLACES_API_KEY ?? '',
    4
  )

  return {
    id:              place.id,
    name:            place.displayName.text,
    address:         place.formattedAddress,
    lat:             place.location.latitude,
    lng:             place.location.longitude,
    distanceMinutes,
    equipmentTags,
    rating:          place.rating ?? null,
    openNow:         place.currentOpeningHours?.openNow ?? true,
    dayPassPence:    null,
    monthlyPence:    null,
    photoUrls,
    reviews: (place.reviews ?? []).slice(0, 3)
  .filter(r => r.text?.text && r.authorAttribution?.displayName)
  .map(r => ({
    author: r.authorAttribution.displayName,
    rating: r.rating,
    text:   r.text.text,
    time:   r.relativePublishTimeDescription ?? '',
    avatar: r.authorAttribution.photoUri     ?? '',
  })),
  websiteUrl:      place.websiteUri,
  }
}

// ─── Haversine ────────────────────────────────────────────────────────────────

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