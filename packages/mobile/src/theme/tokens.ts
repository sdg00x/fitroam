export const colors = {
  dark: {
    background:     '#0e0e0e',
    surface:        '#161616',
    surfaceRaised:  '#1a1a1a',
    surfaceFooter:  '#111111',
    heroBackground: '#0e0e0e',
    accent:         '#c8ff57',
    accentPressed:  '#a8e03a',
    accentText:     '#0e0e0e',
    textPrimary:    '#ffffff',
    textSecondary:  '#666666',
    textMuted:      '#444444',
    border:         '#252525',
    borderStrong:   '#333333',
    scoreBg:        '#c8ff57',
    scoreText:      '#0e0e0e',
    success:        '#4ade80',
    warning:        '#facc15',
    error:          '#f87171',
    info:           '#60a5fa',
  },
  light: {
    background:     '#faf7f2',
    surface:        '#ffffff',
    surfaceRaised:  '#f5f0e8',
    surfaceFooter:  '#f0ebe0',
    heroBackground: '#2b4a39',
    accent:         '#2b4a39',
    accentPressed:  '#1e3a2f',
    accentText:     '#ffffff',
    textPrimary:    '#1a1410',
    textSecondary:  '#9a8f82',
    textMuted:      '#b8ae9f',
    border:         '#e8e0d4',
    borderStrong:   '#d8cfc4',
    scoreBg:        '#2b4a39',
    scoreText:      '#ffffff',
    success:        '#16a34a',
    warning:        '#d97706',
    error:          '#dc2626',
    info:           '#2563eb',
  },
} as const

export type ColorPalette = typeof colors.dark

export const typography = {
  size: {
    cityTitle: 27,
    pageTitle: 22,
    cardTitle: 15,
    body:      14,
    bodySmall: 13,
    cardMeta:  12,
    label:     11,
    tag:       10,
    micro:      9,
  },
  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    heavy:    '800' as const,
  },
  tracking: {
    tight:  -1,
    normal:  0,
    wide:    0.04,
    wider:   0.07,
    widest:  0.1,
  },
  leading: {
    tight:  1.1,
    normal: 1.4,
    loose:  1.6,
  },
} as const

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  screenHorizontal: 18,
  screenTop:        16,
  screenBottom:     24,
  cardPadding:      12,
  sectionGap:       14,
  itemGap:           9,
  tagGap:            4,
} as const

export const radius = {
  tag:     6,
  button:  7,
  input:   8,
  listRow: 10,
  card:    14,
  screen:  16,
  pill:    100,
} as const

export const shadows = {
  card: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  4,
    elevation:     2,
  },
  none: {
    shadowColor:   'transparent',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius:  0,
    elevation:     0,
  },
} as const

export const animation = {
  durationFast:   150,
  durationNormal: 250,
  durationSlow:   400,
} as const