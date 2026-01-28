import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Group, Stack, Text } from '@mantine/core'

const figmaUrl = import.meta.env.VITE_FIGMA_BUTTON_URL as string | undefined

const meta = {
  title: 'Theme/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    ...(figmaUrl
      ? {
          design: {
            type: 'figma',
            url: figmaUrl,
          },
        }
      : {}),
  },
  tags: ['autodocs'],
  args: {
    children: 'Button',
    size: 'md',
    variant: 'filled',
    color: 'blurple',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: (args) => (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Variants
      </Text>
      <Group>
        <Button {...args} variant="filled">
          Filled
        </Button>
        <Button {...args} variant="light">
          Light
        </Button>
        <Button {...args} variant="subtle">
          Subtle
        </Button>
      </Group>
    </Stack>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Sizes
      </Text>
      <Group>
        <Button {...args} size="sm">
          Small
        </Button>
        <Button {...args} size="md">
          Medium
        </Button>
        <Button {...args} size="lg">
          Large
        </Button>
      </Group>
    </Stack>
  ),
}

export const States: Story = {
  render: (args) => (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        States
      </Text>
      <Group>
        <Button {...args}>Default</Button>
        <Button {...args} disabled>
          Disabled
        </Button>
        <Button {...args} loading>
          Loading
        </Button>
      </Group>
    </Stack>
  ),
}
