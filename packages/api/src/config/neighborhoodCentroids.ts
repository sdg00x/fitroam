// Neighborhood centroids — used when the AI's searchGyms call includes a
// `neighborhood` parameter. Falls back to city centroid in concierge.ts if no
// match. Keys are lowercased and stripped of punctuation for forgiving lookup.

export interface NeighborhoodCentroid {
  citySlug: string
  name: string
  lat: number
  lng: number
}

export const NEIGHBORHOOD_CENTROIDS: Record<string, NeighborhoodCentroid> = {
  // ─── London ─────────────────────────────────────────────────────────────
  soho: { citySlug: 'london-gb', name: 'Soho', lat: 51.5136, lng: -0.1365 },
  shoreditch: { citySlug: 'london-gb', name: 'Shoreditch', lat: 51.5256, lng: -0.0784 },
  mayfair: { citySlug: 'london-gb', name: 'Mayfair', lat: 51.5118, lng: -0.1473 },
  kensington: { citySlug: 'london-gb', name: 'Kensington', lat: 51.4988, lng: -0.1749 },
  canarywharf: { citySlug: 'london-gb', name: 'Canary Wharf', lat: 51.5054, lng: -0.0235 },

  // ─── New York City ──────────────────────────────────────────────────────
  midtown: { citySlug: 'newyork-us', name: 'Midtown', lat: 40.7549, lng: -73.9840 },
  soholowernyc: { citySlug: 'newyork-us', name: 'Soho', lat: 40.7233, lng: -74.0029 },
  brooklyn: { citySlug: 'newyork-us', name: 'Brooklyn', lat: 40.6782, lng: -73.9442 },
  williamsburg: { citySlug: 'newyork-us', name: 'Williamsburg', lat: 40.7081, lng: -73.9571 },
  uppereastside: { citySlug: 'newyork-us', name: 'Upper East Side', lat: 40.7736, lng: -73.9566 },

  // ─── Miami ──────────────────────────────────────────────────────────────
  brickell: { citySlug: 'miami-us', name: 'Brickell', lat: 25.7617, lng: -80.1918 },
  wynwood: { citySlug: 'miami-us', name: 'Wynwood', lat: 25.8010, lng: -80.1991 },
  southbeach: { citySlug: 'miami-us', name: 'South Beach', lat: 25.7825, lng: -80.1340 },
  miamibeach: { citySlug: 'miami-us', name: 'Miami Beach', lat: 25.7907, lng: -80.1300 },
  midtownmiami: { citySlug: 'miami-us', name: 'Midtown Miami', lat: 25.8000, lng: -80.1900 },
}

// Forgiving lookup: lowercase, strip non-alphanumerics, then match.
export function findNeighborhood(
  query: string | undefined,
  citySlug: string,
): NeighborhoodCentroid | null {
  if (!query) return null
  const key = query.toLowerCase().replace(/[^a-z0-9]/g, '')
  // Note "soho" and "soholowernyc" disambiguate by citySlug — caller must pass it.
  // Try exact match first.
  const exact = NEIGHBORHOOD_CENTROIDS[key]
  if (exact && exact.citySlug === citySlug) return exact
  // Fall back: scan all entries that match citySlug for a name substring match.
  for (const entry of Object.values(NEIGHBORHOOD_CENTROIDS)) {
    if (entry.citySlug !== citySlug) continue
    const entryKey = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (entryKey.includes(key) || key.includes(entryKey)) return entry
  }
  return null
}
