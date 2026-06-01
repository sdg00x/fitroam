// City-center coordinates used when the AI auto-creates a trip leg.
// User can refine later in the Trips UI; this is the "good enough" anchor
// so saveTrip doesn't need a geocoding round-trip.

export interface CityCentroid {
  citySlug: string
  city: string
  country: string
  lat: number
  lng: number
}

export const CITY_CENTROIDS: Record<string, CityCentroid> = {
  'london-gb': {
    citySlug: 'london-gb',
    city: 'London',
    country: 'United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
  },
  'newyork-us': {
    citySlug: 'newyork-us',
    city: 'New York City',
    country: 'United States',
    lat: 40.7128,
    lng: -74.0060,
  },
  'miami-us': {
    citySlug: 'miami-us',
    city: 'Miami',
    country: 'United States',
    lat: 25.7617,
    lng: -80.1918,
  },
}
