import { createContext, useContext, useState } from 'react'

const defaults = {
  themePreference:    'dark' as 'dark' | 'light' | 'system',
  trainingStyle:      'strength',
  budgetRange:        '10_to_20',
  maxDistanceMinutes: 20,
  equipmentNeeds:     [] as string[],
}

export function useProfileStore<T>(selector: (s: typeof defaults) => T): T {
  return selector(defaults)
}