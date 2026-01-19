import { Button, Card, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { HpyDrawer } from '../theme/components/HpyDrawer'
import { Bread01Icon } from '@hugeicons-pro/core-stroke-rounded'

export function CustomizedComponents() {
  const [opened, { open, close }] = useDisclosure(false)

  return (
    <Stack gap="xl" p="xl">
      <Title order={1}>Customized Components</Title>
      <Text size="lg" c="dimmed">
        Components listed here reflect the custom theme overrides in `src/theme/`.
      </Text>

      <Paper p="xl" withBorder shadow="sm" radius="md">
        <Stack gap="lg">
          <Title order={2}>Button</Title>
          <Text size="sm" c="dimmed">
            Default size is `lg` with custom radius behavior based on size.
          </Text>
          <Group gap="md">
            <Button>Default (lg)</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Group>
          <Group gap="md">
            <Button variant="filled" color="blurple">
              Filled
            </Button>
            <Button variant="outline" color="blurple">
              Outline
            </Button>
            <Button variant="light" color="blurple">
              Light
            </Button>
          </Group>
        </Stack>
      </Paper>

      <Paper p="xl" withBorder shadow="sm" radius="md">
        <Stack gap="lg">
          <Title order={2}>Input / InputBase</Title>
          <Text size="sm" c="dimmed">
            Default radius is `sm`.
          </Text>
          <Group gap="md" align="flex-start" grow>
            <Card withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={600}>
                  TextInput
                </Text>
                <TextInput label="Default" placeholder="Radius sm" />
                <TextInput label="With error" placeholder="Invalid" error="Example error" />
              </Stack>
            </Card>
            <Card withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={600}>
                  TextInput (custom radius)
                </Text>
                <TextInput label="Radius xl" radius="xl" placeholder="Custom radius" />
                <TextInput label="Radius xs" radius="xs" placeholder="Custom radius" />
              </Stack>
            </Card>
          </Group>
        </Stack>
      </Paper>

      <Paper p="xl" withBorder shadow="sm" radius="md">
        <Stack gap="lg">
          <Title order={2}>AG Grid</Title>
          <Text size="sm" c="dimmed">
            AG Grid is customized to match Mantine theme colors and supports light/dark mode.
          </Text>
          <Text size="sm" c="dimmed">
            See the Component Showcase or Test page for live grid examples.
          </Text>
        </Stack>
      </Paper>

      <Paper p="xl" withBorder shadow="sm" radius="md">
        <Stack gap="lg">
          <Title order={2}>HpyDrawer</Title>
          <Text size="sm" c="dimmed">
            Custom drawer with optional header actions, status toggles, tabs, and footer.
          </Text>
          <Group>
            <Button variant="filled" color="blurple" onClick={open}>
              Open Drawer
            </Button>
          </Group>
        </Stack>
      </Paper>

      <HpyDrawer
        opened={opened}
        onClose={close}
        position="right"
        title="Bread"
        subtitle="Crusty roll"
        icon={Bread01Icon}
        withCloseButton
        preventInitialDrawerFocus
        withMoreButton
        moreButtonProps={{
          items: <Text size="sm">More actions</Text>,
        }}
        withFooter
        footerProps={{
          items: (
            <>
              <Button variant="outline" color="gray" onClick={close}>
                Cancel
              </Button>
              <Button variant="filled" color="blurple" onClick={close}>
                Save
              </Button>
            </>
          ),
        }}
      >
        <Stack>
          <Text>START!</Text>
          <Text size="sm" c="dimmed">
            This content is visible when tabs are not enabled.
          </Text>
        </Stack>
      </HpyDrawer>
    </Stack>
  )
}

