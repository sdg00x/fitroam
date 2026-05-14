import { describe, it, expect } from 'vitest'
import { scoreGyms, UserProfile, RawGym } from './matchEngine'

const baseProfile: UserProfile = {
  trainingStyle:      'strength',
  equipmentNeeds:     ['free_weights', 'barbells'],
  budgetRange:        '10_to_20',
  maxDistanceMinutes: 20,
  environmentPref:    'both',
}

const baseGym: RawGym = {
  id:              'gym-1',
  name:            'Test Gym',
  address:         '1 Test St',
  lat:             51.5,
  lng:             -0.1,
  distanceMinutes: 10,
  equipmentTags:   ['free_weights', 'barbells', 'cables'],
  rating:          4.2,
  openNow:         true,
  dayPassPence:    800,    // £8
  monthlyPence:    3000,   // £30
}

describe('scoreGyms', () => {
  it('returns gyms sorted by match score descending', () => {
    const poorMatch: RawGym = {
      ...baseGym,
      id:            'gym-2',
      equipmentTags: ['treadmill', 'bikes'],  // cardio only — bad for strength
      distanceMinutes: 25,                    // over tolerance
      dayPassPence:  2500,                    // over budget
    }

    const results = scoreGyms(baseProfile, [poorMatch, baseGym])

    expect(results[0].id).toBe('gym-1')
    expect(results[0].matchScore).toBeGreaterThan(results[1].matchScore)
  })

  it('scores a perfect match close to 100', () => {
    const results = scoreGyms(baseProfile, [baseGym])
    expect(results[0].matchScore).toBeGreaterThan(75)
  })

  it('penalises gyms over the distance tolerance', () => {
    const farGym = { ...baseGym, distanceMinutes: 45 }
    const closeGym = { ...baseGym, id: 'gym-close', distanceMinutes: 5 }

    const results = scoreGyms(baseProfile, [farGym, closeGym])
    expect(results[0].id).toBe('gym-close')
  })

  it('formats day pass price correctly', () => {
    const results = scoreGyms(baseProfile, [baseGym])
    expect(results[0].priceDisplay).toBe('£8 day pass')
  })

  it('formats monthly-only price with per-day estimate', () => {
    const monthlyOnlyGym = { ...baseGym, dayPassPence: null, monthlyPence: 3000 }
    const results = scoreGyms(baseProfile, [monthlyOnlyGym])
    expect(results[0].priceDisplay).toBe('£30/mo')
    expect(results[0].priceSubDisplay).toContain('access for your stay')
  })

  it('returns match reasons as human-readable strings', () => {
    const results = scoreGyms(baseProfile, [baseGym])
    expect(results[0].matchReasons.length).toBeGreaterThan(0)
    expect(typeof results[0].matchReasons[0]).toBe('string')
  })
})