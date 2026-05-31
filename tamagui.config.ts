import { createAnimations } from '@tamagui/animations-react-native'
import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui } from 'tamagui'

// ─── Animation driver (React Native Animated — no Reanimated needed) ─────────
const animations = createAnimations({
  fast:   { type: 'spring', damping: 22, mass: 1,   stiffness: 280 },
  medium: { type: 'spring', damping: 14, mass: 1,   stiffness: 120 },
  slow:   { type: 'spring', damping: 20, mass: 1.2, stiffness: 60  },
})

// ─── SMC brand theme variables ────────────────────────────────────────────────
// These override the default Tamagui v4 theme variables per mode.
// Use $background, $color, $borderColor etc. in components automatically.
// Use $smcPrimary, $smcCard etc. for brand-specific values.

const lightTheme = {
  ...defaultConfig.themes.light,
  // Surface
  background:         '#F9FAFB',
  backgroundHover:    '#F1F8E9',
  backgroundPress:    '#E8F5E9',
  backgroundFocus:    '#E8F5E9',
  backgroundStrong:   '#FFFFFF',
  // Text
  color:              '#1C1B1F',
  colorHover:         '#2E7D32',
  colorPress:         '#1B5E20',
  colorFocus:         '#2E7D32',
  placeholderColor:   '#79747E',
  // Border
  borderColor:        '#CAC4D0',
  borderColorHover:   '#2E7D32',
  borderColorFocus:   '#2E7D32',
  // SMC brand extras
  smcPrimary:         '#2E7D32',
  smcPrimaryDark:     '#1B5E20',
  smcPrimaryLight:    '#4CAF50',
  smcPrimaryContainer:'#A5D6A7',
  smcOnPrimary:       '#FFFFFF',
  smcCard:            '#FFFFFF',
  smcSurface:         '#FFFFFF',
  smcSurfaceVariant:  '#F1F8E9',
  smcOnSurface:       '#1C1B1F',
  smcOnSurfaceVariant:'#49454F',
  smcOutline:         '#79747E',
  smcError:           '#C62828',
  smcErrorContainer:  '#FFCDD2',
  smcWarning:         '#F57C00',
  smcSuccess:         '#388E3C',
  smcInfo:            '#1565C0',
}

const darkTheme = {
  ...defaultConfig.themes.dark,
  // Surface
  background:         '#121212',
  backgroundHover:    '#1E1E1E',
  backgroundPress:    '#2C2C2C',
  backgroundFocus:    '#2C2C2C',
  backgroundStrong:   '#1E1E1E',
  // Text
  color:              '#E8E8E8',
  colorHover:         '#A5D6A7',
  colorPress:         '#C8E6C9',
  colorFocus:         '#A5D6A7',
  placeholderColor:   '#9E9E9E',
  // Border
  borderColor:        '#3C3C3C',
  borderColorHover:   '#66BB6A',
  borderColorFocus:   '#66BB6A',
  // SMC brand extras (lighter greens for dark mode contrast)
  smcPrimary:         '#66BB6A',
  smcPrimaryDark:     '#4CAF50',
  smcPrimaryLight:    '#81C784',
  smcPrimaryContainer:'#1B5E20',
  smcOnPrimary:       '#FFFFFF',
  smcCard:            '#1E1E1E',
  smcSurface:         '#1E1E1E',
  smcSurfaceVariant:  '#2C2C2C',
  smcOnSurface:       '#E8E8E8',
  smcOnSurfaceVariant:'#AEAAAE',
  smcOutline:         '#938F99',
  smcError:           '#EF5350',
  smcErrorContainer:  '#4E1010',
  smcWarning:         '#FFA726',
  smcSuccess:         '#66BB6A',
  smcInfo:            '#42A5F5',
}

// ─── Final config ─────────────────────────────────────────────────────────────
const config = createTamagui({
  ...defaultConfig,
  animations,
  themes: {
    ...defaultConfig.themes,
    light: lightTheme,
    dark: darkTheme,
  },
})

export default config

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
