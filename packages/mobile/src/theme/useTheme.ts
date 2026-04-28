import { useColorScheme } from 'react-native'
import { colors, typography, spacing, radius, shadows, animation } from './tokens'
import { useProfileStore } from '../store/profileStore'

type ThemeMode = 'dark' | 'light'

interface Theme {
  colors:     typeof colors.dark | typeof colors.light
  typography: typeof typography
  spacing:    typeof spacing
  radius:     typeof radius
  isDark:     boolean
  mode:       ThemeMode
}

export function useTheme(): Theme {
  const systemScheme   = useColorScheme()
  const userPreference = useProfileStore(s => s.themePreference)

  const resolvedMode: ThemeMode =
    userPreference === 'system'
      ? (systemScheme === 'light' ? 'light' : 'dark')
      : userPreference

  const isDark = resolvedMode === 'dark'

  return {
    colors:     isDark ? colors.dark : colors.light,
    typography,
    spacing,
    radius,
    isDark,
    mode: resolvedMode,
  }
}