/**
 * Match engine v2 — scores gyms against a user's actual profile.
 *
 * v2 changes:
 * - Takes the real profile shape (primaryActivity, priorities, etc.)
 * - Drops budget scoring (no pricing data — see PRODUCT_v5)
 * - Wires priorities into scoring as a real factor
 * - Removes the broken "soft floor" that caused everything to cluster at 51-69%
 * - Scores spread 25-95% based on actual gym fit
 *
 * Score formula:
 *   activity fit (equipment match)   35%
 *   priorities satisfied             30%
 *   distance                         20%
 *   rating + popularity              10%
 *   open now                          5%
 */

export interface UserProfile {
  primaryActivity:    string
  activities:         string[]
  facilityTypes:      string[]
  lifestyle:          string[]
  priorities:         string[]
  maxDistanceMinutes: number
}

export interface GymReview {
  author: string
  rating: number
  text:   string
  time:   string
  avatar: string
}

export interface RawGym {
  id:              string
  name:            string
  address:         string
  lat:             number
  lng:             number
  distanceMinutes: number
  equipmentTags:   string[]
  rating:          number | null
  ratingCount?:    number | null
  openNow:         boolean
  dayPassPence:    number | null
  monthlyPence:    number | null
  openingHours?:   any
  photoUrls?:      string[]
  reviews?:        GymReview[]
  websiteUrl?:     string
}

export interface ScoredGym extends RawGym {
  matchScore:      number
  matchReasons:    string[]
  priceDisplay:    string
  priceSubDisplay: string
}

// ─── Activity → expected equipment mapping ──────────────────────────────────
// Each activity has a set of equipment we'd expect a "good" gym to have.
// Score is based on coverage — how many of the expected items are present.

const ACTIVITY_EQUIPMENT: Record<string, string[]> = {
  staying_in_shape: ['cardio', 'free_weights', 'machines', 'treadmill'],
  lifting:          ['free_weights', 'barbells', 'power_rack', 'cables', 'dumbbells'],
  powerlifting:     ['power_rack', 'deadlift_platform', 'barbells', 'bumper_plates'],
  bodybuilding:     ['machines', 'cables', 'free_weights', 'dumbbells'],
  crossfit:         ['barbells', 'pull_up_bars', 'rings', 'rowing', 'kettlebells'],
  calisthenics:     ['pull_up_bars', 'dip_bars', 'rings', 'parallettes'],
  // Legacy support — if old profiles still send these, fall back to lifting
  strength:         ['free_weights', 'barbells', 'power_rack', 'cables'],
  mixed:            ['free_weights', 'cables', 'machines', 'cardio'],
}

// ─── Priority → check function ──────────────────────────────────────────────
// Each priority either resolves YES, NO, or UNKNOWN against a gym.
// We score based on satisfied / known. Unknown priorities don't penalize.

type PriorityResult = 'yes' | 'no' | 'unknown'

function checkPriority(priority: string, gym: RawGym): PriorityResult {
  const name = gym.name.toLowerCase()
  const tags = gym.equipmentTags.map(t => t.toLowerCase())

  switch (priority) {
    case '24hr': {
      // Look at openingHours periods — if there's a period covering 24/7, yes
      const periods = gym.openingHours?.periods
      if (!periods || periods.length === 0) return 'unknown'
      // 24h gyms typically have a single period with open day=0 hour=0 and no close
      const has24h = periods.some((p: any) =>
        p.open?.hour === 0 && p.open?.minute === 0 && !p.close
      )
      return has24h ? 'yes' : 'no'
    }

    case 'deadlift':
      if (tags.includes('deadlift_platform')) return 'yes'
      // Check name for serious-lifting indicators
      if (/powerlifting|strength|barbell|strongman/.test(name)) return 'yes'
      return 'unknown' // Google data doesn't reliably tell us

    case 'equipment':
      // Equipment variety — gym has many tagged equipment types
      if (tags.length >= 6) return 'yes'
      if (tags.length >= 3) return 'unknown'
      return 'no'

    case 'pool':
      if (tags.some(t => t.includes('pool') || t.includes('swim'))) return 'yes'
      if (/pool|aquatic|swim/.test(name)) return 'yes'
      return 'no'

    case 'amenities':
      // Loose proxy — higher rating gyms tend to have better amenities
      if (gym.rating && gym.rating >= 4.3) return 'yes'
      if (gym.rating && gym.rating < 3.8) return 'no'
      return 'unknown'

    case 'beginner':
      // Avoid gyms with intense names; prefer high-rated commercial chains
      if (/powerlifting|hardcore|elite|serious|strong/.test(name)) return 'no'
      if (/puregym|the gym group|anytime fitness|jd gym/.test(name)) return 'yes'
      return 'unknown'

    case 'serious':
      if (/powerlifting|strength|barbell|strongman|hardcore|elite/.test(name)) return 'yes'
      if (/puregym|the gym group/.test(name)) return 'no'  // chain gyms generally less serious
      return 'unknown'

    // Honest: these can't be reliably scored from Google data.
    // Return unknown so they don't penalize gyms unfairly.
    case 'cleanliness':
    case 'quiet':
    case 'community':
      return 'unknown'

    default:
      return 'unknown'
  }
}

// ─── Scoring factors ──────────────────────────────────────────────────────────

function scoreActivityFit(profile: UserProfile, gym: RawGym): number {
  const primary = profile.primaryActivity || 'staying_in_shape'
  const expected = ACTIVITY_EQUIPMENT[primary] || ACTIVITY_EQUIPMENT.staying_in_shape

  const tags = gym.equipmentTags.map(t => t.toLowerCase())
  const matched = expected.filter(eq =>
    tags.some(tag => tag.includes(eq) || eq.includes(tag))
  )

  // Score is matched / expected, but with a small base if SOME match
  if (matched.length === 0) return 0.1
  return matched.length / expected.length
}

function scorePriorities(profile: UserProfile, gym: RawGym): number {
  if (!profile.priorities || profile.priorities.length === 0) return 0.7
  // No priorities given — neutral score so this factor doesn't dominate

  let satisfied = 0
  let known     = 0

  for (const p of profile.priorities) {
    const result = checkPriority(p, gym)
    if (result === 'yes') { satisfied++; known++ }
    else if (result === 'no') { known++ }
    // 'unknown' doesn't count either way
  }

  if (known === 0) return 0.6  // all unknown — neutral, slightly cautious
  return satisfied / known
}

function scoreDistance(profile: UserProfile, gym: RawGym): number {
  const max = profile.maxDistanceMinutes || 20
  const actual = gym.distanceMinutes

  if (actual <= max * 0.3) return 1.0    // very close
  if (actual <= max * 0.6) return 0.85
  if (actual <= max)       return 0.65
  if (actual <= max * 1.5) return 0.3
  return 0.05  // too far
}

function scoreRating(gym: RawGym): number {
  if (gym.rating === null || gym.rating === undefined) return 0.5

  // Account for low review counts — small samples are noisy
  const count = gym.ratingCount ?? 0
  const confidence = count >= 50 ? 1 : count / 50

  // Normalize 0-5 rating to 0-1
  const normalized = (gym.rating - 2.5) / 2.5
  const score = Math.max(0, Math.min(1, normalized))

  return score * confidence + 0.5 * (1 - confidence)
}

function scoreOpenNow(gym: RawGym): number {
  return gym.openNow ? 1.0 : 0.5
}

// ─── Match reasons ───────────────────────────────────────────────────────────

function buildMatchReasons(profile: UserProfile, gym: RawGym): string[] {
  const reasons: string[] = []
  const primary  = profile.primaryActivity || 'staying_in_shape'
  const expected = ACTIVITY_EQUIPMENT[primary] || []

  const tags = gym.equipmentTags.map(t => t.toLowerCase())
  const matchedEquip = expected.filter(eq =>
    tags.some(tag => tag.includes(eq) || eq.includes(tag))
  )

  if (matchedEquip.length > 0) {
    const formatted = matchedEquip[0].replace(/_/g, ' ')
    reasons.push(formatted.charAt(0).toUpperCase() + formatted.slice(1))
  }

  if (gym.openNow)                  reasons.push('Open now')
  if (gym.distanceMinutes <= 10)    reasons.push('Under 10 min walk')
  if (gym.rating && gym.rating >= 4.5) reasons.push('Highly rated')

  return reasons.slice(0, 3)
}

// ─── Price display — honest about what we don't know ─────────────────────────

function formatPrice(gym: RawGym): { priceDisplay: string; priceSubDisplay: string } {
  if (gym.dayPassPence !== null && gym.dayPassPence !== undefined) {
    const dayPass = `£${(gym.dayPassPence / 100).toFixed(0)} day pass`
    const monthly = gym.monthlyPence
      ? `or £${(gym.monthlyPence / 100).toFixed(0)}/mo`
      : ''
    return { priceDisplay: dayPass, priceSubDisplay: monthly }
  }

  if (gym.monthlyPence !== null && gym.monthlyPence !== undefined) {
    return {
      priceDisplay:    `£${(gym.monthlyPence / 100).toFixed(0)}/mo`,
      priceSubDisplay: 'Check site for day pass',
    }
  }

  // Honest: we don't have pricing data for most gyms
  return {
    priceDisplay:    'Contact for pricing',
    priceSubDisplay: '',
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function scoreGyms(profile: UserProfile, gyms: RawGym[]): ScoredGym[] {
  const scored = gyms.map(gym => {
    const activityScore  = scoreActivityFit(profile, gym)  * 0.35
    const priorityScore  = scorePriorities(profile, gym)   * 0.30
    const distanceScore  = scoreDistance(profile, gym)     * 0.20
    const ratingScore    = scoreRating(gym)                * 0.10
    const openScore      = scoreOpenNow(gym)               * 0.05

    const raw   = activityScore + priorityScore + distanceScore + ratingScore + openScore
    const matchScore = Math.round(raw * 100)

    const { priceDisplay, priceSubDisplay } = formatPrice(gym)

    return {
      ...gym,
      matchScore,
      matchReasons: buildMatchReasons(profile, gym),
      priceDisplay,
      priceSubDisplay,
    }
  })

  return scored.sort((a, b) => b.matchScore - a.matchScore)
}
