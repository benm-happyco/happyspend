import { Checkbox } from '@mantine/core'
import type { CSSProperties } from 'react'

export const checkboxOverride = Checkbox.extend({
  styles: {
    input: {
      borderColor: 'var(--mantine-color-default-border)',
      '--checkbox-bd': 'var(--mantine-color-default-border)',
      borderRadius: 'var(--mantine-radius-sm)',
    } as CSSProperties,
  },
})

