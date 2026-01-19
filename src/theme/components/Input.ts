import { Input } from '@mantine/core'
import type { CSSProperties } from 'react'

export const inputOverride = Input.extend({
  defaultProps: {
    radius: 'sm',
  },
  styles: {
    input: {
      borderColor: 'var(--mantine-color-default-border)',
      '--input-bd': 'var(--mantine-color-default-border)',
    } as CSSProperties,
  },
})

