import { Paper } from '@mantine/core'
import type { CSSProperties } from 'react'

export const paperOverride = Paper.extend({
  styles: {
    root: {
      // Mantine Paper uses --paper-border-color internally for withBorder.
      // Align Paper/Card borders with inputs by using our shared token.
      '--paper-border-color': 'var(--mantine-color-default-border)',
    } as CSSProperties,
  },
})

