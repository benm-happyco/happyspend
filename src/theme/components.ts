import type { ButtonProps } from '@mantine/core'
import { Button, Input, InputBase } from '@mantine/core'

// Component overrides based on HappyCo design system
export const componentOverrides = {
  Button: Button.extend({
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
  }),

  InputBase: InputBase.extend({
    defaultProps: {
      radius: 'sm',
    },
  }),

  Input: Input.extend({
    defaultProps: {
      radius: 'sm',
    },
  }),
}


