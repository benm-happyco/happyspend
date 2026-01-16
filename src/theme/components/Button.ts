import type { ButtonProps } from '@mantine/core'
import { Button } from '@mantine/core'

export const buttonOverride = Button.extend({
  defaultProps: {
    size: 'lg',
  },
  vars: (_theme, props: ButtonProps) => {
    if (props.size === 'sm' && !props.radius) {
      return {
        root: {
          '--button-radius': 'var(--mantine-radius-sm)',
        },
      }
    }
    if (props.size === 'lg' && !props.radius) {
      return {
        root: {
          '--button-radius': 'var(--mantine-radius-xl)',
        },
      }
    }
    if (!props.radius) {
      return {
        root: {
          '--button-radius': 'var(--mantine-radius-sm)',
        },
      }
    }
    return { root: {} }
  },
})

