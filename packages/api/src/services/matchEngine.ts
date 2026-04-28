/**
 * Match engine — scores gyms against a user profile.
 *
 * This is a pure function: same inputs always produce same output.
 * No database calls, no side effects. Fully unit-testable.
 *
 * Score formula (v1):
 *   style match     40%
 *   price match     25%
 *   distance match  20%
 *   equipment match 15%
 *
 * Each factor returns 0–1, multiplied by its weight.
 * Final score is 0–100, rounded to nearest integer.
 */

export interface UserProfile {
  trainingStyle:      string
  equipmentNeeds:     string[]
  budgetRange:        string   // 'under_5' | '5_to_10' | '10_to_20' | 'over_20'
  maxDistanceMinutes: number
  environmentPref:    string   // 'indoor' | 'outdoor' | 'both'
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
  openNow:         boolean
  dayPassPence:    number | null
  monthlyPence:    number | null
  photoUrls?:      string[]        // ← add this
  reviews?:        GymReview[]     // ← add this
}

export interface GymReview {
  author: string
  rating: number
  text:   string
  time:   string
  avatar: string
}

export interface ScoredGym extends RawGym {
  matchScore:      number   // 0–100
  matchReasons:    string[] // e.g. ['Free weights', 'Day pass available']
  priceDisplay:    string   // formatted for UI, e.g. '£8 day pass'
  priceSubDisplay: string   // e.g. 'or £35/mo · access for your stay'
}

// ─── Budget ranges in pence per day ──────────────────────────────────────────

const BUDGET_MAX_PENCE: Record<string, number> = {
  under_5:  500,
  '5_to_10': 1000,
  '10_to_20': 2000,
  over_20:  999999,
}

// ─── Training style → equipment mapping ──────────────────────────────────────

const STYLE_EQUIPMENT_MAP: Record<string, string[]> = {
  strength:     ['free_weights', 'barbells', 'power_rack', 'cables'],
  calisthenics: ['pull_up_bars', 'dip_bars', 'rings', 'parallettes'],
  cardio:       ['treadmill', 'bikes', 'rowing', 'elliptical'],
  crossfit:     ['barbells', 'pull_up_bars', 'rings', 'cables'],
  yoga:         ['open_space', 'mats'],
  mixed:        ['free_weights', 'cables', 'cardio'],
}

// ─── Scoring factors ──────────────────────────────────────────────────────────

function scoreStyleMatch(profile: UserProfile, gym: RawGym): number {
  const preferred = STYLE_EQUIPMENT_MAP[profile.trainingStyle] ?? []
  if (preferred.length === 0) return 0.5  // unknown style — neutral score

  const matches = preferred.filter(eq =>
    gym.equipmentTags.some(tag => tag.toLowerCase().includes(eq.toLowerCase()))
  )

  return matches.length / preferred.length
}

function scorePriceMatch(profile: UserProfile, gym: RawGym): number {
  const budgetPence = BUDGET_MAX_PENCE[profile.budgetRange] ?? 2000

  // Day pass is the ideal — if it fits budget, full score
  if (gym.dayPassPence !== null) {
    if (gym.dayPassPence <= budgetPence) return 1.0
    if (gym.dayPassPence <= budgetPence * 1.25) return 0.6  // slightly over
    return 0.2
  }

  // Monthly — estimate per-day cost over 30 days
  if (gym.monthlyPence !== null) {
    const perDayPence = Math.round(gym.monthlyPence / 30)
    if (perDayPence <= budgetPence) return 0.85  // good but not ideal (commitment)
    if (perDayPence <= budgetPence * 1.5) return 0.5
    return 0.2
  }

  return 0.3  // no price data — penalise slightly but don't exclude
}

function scoreDistanceMatch(profile: UserProfile, gym: RawGym): number {
  const max = profile.maxDistanceMinutes
  const actual = gym.distanceMinutes

  if (actual <= max * 0.5) return 1.0   // well within tolerance
  if (actual <= max)       return 0.75  // within tolerance
  if (actual <= max * 1.3) return 0.4   // slightly over
  return 0.1                            // too far
}

function scoreEquipmentMatch(profile: UserProfile, gym: RawGym): number {
  if (profile.equipmentNeeds.length === 0) return 1.0

  const matched = profile.equipmentNeeds.filter(need =>
    gym.equipmentTags.some(tag => tag.toLowerCase().includes(need.toLowerCase()))
  )

  return matched.length / profile.equipmentNeeds.length
}

// ─── Match reasons — human-readable explanation of the score ─────────────────

function buildMatchReasons(profile: UserProfile, gym: RawGym): string[] {
  const reasons: string[] = []
  const preferred = STYLE_EQUIPMENT_MAP[profile.trainingStyle] ?? []

  const matchedEquip = preferred.filter(eq =>
    gym.equipmentTags.some(tag => tag.toLowerCase().includes(eq.toLowerCase()))
  )

  if (matchedEquip.length > 0) {
    // Capitalise first letter for display
    const formatted = matchedEquip[0].replace(/_/g, ' ')
    reasons.push(formatted.charAt(0).toUpperCase() + formatted.slice(1))
  }

  if (gym.dayPassPence !== null) reasons.push('Day pass available')
  if (gym.openNow)               reasons.push('Open now')
  if (gym.distanceMinutes <= 10) reasons.push('Under 10 min walk')

  return reasons.slice(0, 3)  // max 3 reasons shown in UI
}

// ─── Price display formatting ─────────────────────────────────────────────────

function formatPrice(gym: RawGym): { priceDisplay: string; priceSubDisplay: string } {
  if (gym.dayPassPence !== null) {
    const dayPass = `£${(gym.dayPassPence / 100).toFixed(0)} day pass`
    const monthly = gym.monthlyPence !== null
      ? `or £${(gym.monthlyPence / 100).toFixed(0)}/mo · access for your stay`
      : ''
    return { priceDisplay: dayPass, priceSubDisplay: monthly }
  }

  if (gym.monthlyPence !== null) {
    const perDay = Math.round(gym.monthlyPence / 30 / 100)
    return {
      priceDisplay:    `£${(gym.monthlyPence / 100).toFixed(0)}/mo`,
      priceSubDisplay: `~£${perDay}/day · access for your stay`,
    }
  }

  return {
    priceDisplay:    'Contact for pricing',
    priceSubDisplay: '',
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function scoreGyms(profile: UserProfile, gyms: RawGym[]): ScoredGym[] {
  const scored = gyms.map(gym => {
    const styleScore    = scoreStyleMatch(profile, gym)    * 0.40
    const priceScore    = scorePriceMatch(profile, gym)    * 0.25
    const distanceScore = scoreDistanceMatch(profile, gym) * 0.20
    const equipScore    = scoreEquipmentMatch(profile, gym)* 0.15

    const rawScore   = styleScore + priceScore + distanceScore + equipScore
    const matchScore = Math.round(rawScore * 100)

    const { priceDisplay, priceSubDisplay } = formatPrice(gym)

    return {
      ...gym,
      matchScore,
      matchReasons: buildMatchReasons(profile, gym),
      priceDisplay,
      priceSubDisplay,
    }
  })

  // Sort by match score descending
  return scored.sort((a, b) => b.matchScore - a.matchScore)
}