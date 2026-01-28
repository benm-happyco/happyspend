import type { Preview } from '@storybook/react-vite'
import { MantineProvider } from '@mantine/core'
import { customTheme } from '../src/theme/theme'
import '../src/index.css'

const preview: Preview = {
  decorators: [
    (Story) => (
      <MantineProvider theme={customTheme} defaultColorScheme="light">
        <Story />
      </MantineProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
