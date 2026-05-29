// Single source of truth for launch cities.
// Slug convention: {city}-{country}, lowercase — matches existing gym_access data.
// Adding a city later = add one entry here. Nothing else hardcodes the list.

export const CITIES = [
  { slug: 'london-gb', label: 'London',   country: 'GB' },
  { slug: 'newyork-us', label: 'New York', country: 'US' },
  { slug: 'miami-us',  label: 'Miami',    country: 'US' },
] as const

export type CitySlug = (typeof CITIES)[number]['slug']

export const CITY_SLUGS: CitySlug[] = CITIES.map(c => c.slug)

export function isValidCitySlug(slug: unknown): slug is CitySlug {
  return typeof slug === 'string' && CITY_SLUGS.includes(slug as CitySlug)
}
