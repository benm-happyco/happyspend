import { createTheme, rem } from '@mantine/core'
import type { MantineThemeOverride } from '@mantine/core'
import { MANTINE_COLORS } from './colors'
import { componentOverrides } from './components'

export const customTheme: MantineThemeOverride = createTheme({
  black: '#212b31',
  white: '#ffffff',
  
  colors: MANTINE_COLORS,
  
  primaryColor: 'blurple',
  
  fontFamily: '"proxima-nova", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  
  defaultRadius: 'md',
  
  radius: {
    none: rem(0),
    xs: rem(2),
    sm: rem(4),
    md: rem(8),
    lg: rem(16),
    xl: rem(32),
    xxl: rem(64),
  },
  
  breakpoints: {
    xxs: '20em', // ~320px
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
    xxl: '100em', // ~1600px
  },
  
  cursorType: 'pointer',
  
  respectReducedMotion: true,
  
  luminanceThreshold: 0.375,
  
  components: componentOverrides,
})



