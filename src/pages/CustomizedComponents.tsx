import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Select,
  Stack,
  Stepper,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
  SimpleGrid,
  Avatar,
  Divider,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { DetailDrawer, InlineEditorDrawer, WorkflowDrawer } from '../theme/components/HpyDrawer'
import { RefrigeratorIcon } from '@hugeicons-pro/core-stroke-rounded'

export function CustomizedComponents() {
  const [inlineOpened, inlineHandlers] = useDisclosure(false)
  const [workflowOpened, workflowHandlers] = useDisclosure(false)
  const [detailOpened, detailHandlers] = useDisclosure(false)

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
          <Title order={2}>HpyDrawer Types</Title>
          <Text size="sm" c="dimmed">
            Three drawer archetypes with distinct behaviors and layouts.
          </Text>
          <Group>
            <Button variant="filled" color="blurple" onClick={inlineHandlers.open}>
              Inline Editor Drawer
            </Button>
            <Button variant="light" color="blurple" onClick={workflowHandlers.open}>
              Workflow Drawer
            </Button>
            <Button variant="outline" color="blurple" onClick={detailHandlers.open}>
              Detail Drawer
            </Button>
          </Group>
        </Stack>
      </Paper>

      <InlineEditorDrawer
        opened={inlineOpened}
        onClose={inlineHandlers.close}
        position="right"
        title="Refrigerator"
        subtitle="Appliances"
        eyebrow="Courtyard"
        icon={RefrigeratorIcon}
        withCloseButton
        withMoreButton
        preventInitialDrawerFocus
        statusToggles={
          <Group gap="xl">
            <Group gap="xs">
              <Text fw={600} size="sm">
                Priority
              </Text>
              <Badge variant="light" color="gray">
                Normal
              </Badge>
            </Group>
            <Group gap="xs">
              <Text fw={600} size="sm">
                Status
              </Text>
              <Badge variant="light" color="green">
                Open
              </Badge>
            </Group>
          </Group>
        }
        tabs={
          <Tabs defaultValue="details">
            <Tabs.List>
              <Tabs.Tab value="details">Details</Tabs.Tab>
              <Tabs.Tab value="messages">Messages</Tabs.Tab>
              <Tabs.Tab value="files">Files</Tabs.Tab>
              <Tabs.Tab value="activities">Activities</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="details" pt="lg">
              <Text size="sm">
                After reviewing the original request, the team determined that the issue was both
                present and not present, depending on how one defines “issue” and whether it was
                observed before or after the second cup of coffee. Previous notes suggested a
                similar situation may have occurred sometime last quarter, although those notes
                also referenced a different unit, a different fixture, and possibly a different
                building altogether. Out of an abundance of caution and mild curiosity, the area
                was inspected, re-inspected, and then inspected once more by someone who was not
                entirely sure why they were there but felt confident enough to document it anyway.
              </Text>
            </Tabs.Panel>
            <Tabs.Panel value="messages" pt="lg">
              <Text size="sm">
                No visible damage was found, unless you count the cosmetic scuff that everyone
                agreed “has probably always been like that.” Nearby components were checked for
                alignment, stability, and general vibes. Everything appeared to be functioning
                within acceptable parameters, assuming those parameters are loosely defined and
                generously interpreted. A brief discussion occurred regarding whether this task
                should be closed, paused, or escalated, and the consensus was to update the notes
                and see how everyone feels about it tomorrow.
              </Text>
            </Tabs.Panel>
            <Tabs.Panel value="files" pt="lg">
              <Text size="sm">
                Communication was logged to ensure transparency, traceability, and the comforting
                illusion that someone is definitely keeping track of all of this. The resident was
                notified that the situation had been reviewed and that no immediate action was
                required at this time, which was technically accurate and emotionally reassuring.
                Internal notes were added clarifying that if the issue comes back, this entry will
                serve as proof that it was already looked at very thoroughly and with great
                seriousness.
              </Text>
            </Tabs.Panel>
            <Tabs.Panel value="activities" pt="lg">
              <Text size="sm">
                Materials were not ordered, mostly because no one could agree on what materials
                would theoretically solve the problem if it were to become a real problem in the
                future. Tools were mentioned in passing, largely to make the record feel complete.
                A follow-up was tentatively considered, then un-considered, and finally left
                open-ended so the system would continue to feel useful.
              </Text>
            </Tabs.Panel>
          </Tabs>
        }
        footer={
          <>
            <Button variant="outline" color="gray" onClick={inlineHandlers.close}>
              Cancel
            </Button>
            <Button variant="filled" color="blurple" onClick={inlineHandlers.close} disabled>
              Save
            </Button>
          </>
        }
      >
        <Stack gap="lg">
          <SimpleGrid cols={2} spacing="lg">
            <Select
              label="Assignee"
              placeholder="Assign work order"
              data={['Lisa Peters', 'Sarah Thompson', 'Michael Rodriguez']}
              required
            />
            <TextInput label="Scheduled" placeholder="Select a date" required />
          </SimpleGrid>
          <Textarea label="Description" placeholder="A description of the work order" minRows={3} />
          <Paper p="sm" radius="sm" withBorder>
            <Stack gap="xs">
              <Text size="sm" fw={600}>
                Summary by JoyAI
              </Text>
              <Text size="sm" c="dimmed">
                Water filter replacement needed for B01
              </Text>
            </Stack>
          </Paper>
          <Accordion variant="separated" radius="sm">
            <Accordion.Item value="residents">
              <Accordion.Control>Residents</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <Stack gap="xs">
                    <Text size="sm" fw={600}>
                      Reporting Resident
                    </Text>
                    <Group justify="space-between">
                      <Group gap="sm">
                        <Avatar color="orange" radius="xl" size="sm">
                          LP
                        </Avatar>
                        <Text size="sm">Lisa Peters</Text>
                      </Group>
                      <Text size="sm" c="dimmed">
                        206-555-7843
                      </Text>
                    </Group>
                  </Stack>
                  <Stack gap="xs">
                    <Text size="sm" fw={600}>
                      Additional Residents
                    </Text>
                    <Group justify="space-between">
                      <Group gap="sm">
                        <Avatar color="teal" radius="xl" size="sm">
                          ST
                        </Avatar>
                        <Text size="sm">Sarah Thompson</Text>
                      </Group>
                      <Text size="sm" c="dimmed">
                        206-555-1043
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Group gap="sm">
                        <Avatar color="yellow" radius="xl" size="sm">
                          MR
                        </Avatar>
                        <Text size="sm">Michael Rodriguez</Text>
                      </Group>
                      <Text size="sm" c="dimmed">
                        206-555-2987
                      </Text>
                    </Group>
                  </Stack>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="time">
              <Accordion.Control>Time Tracking</Accordion.Control>
              <Accordion.Panel>
                <Text size="sm" c="dimmed">
                  No time entries yet.
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="projects">
              <Accordion.Control>Related Projects</Accordion.Control>
              <Accordion.Panel>
                <Text size="sm" c="dimmed">
                  No related projects.
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="plugins">
              <Accordion.Control>Active Plugins</Accordion.Control>
              <Accordion.Panel>
                <Text size="sm" c="dimmed">
                  No active plugins.
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Stack>
      </InlineEditorDrawer>

      <WorkflowDrawer
        opened={workflowOpened}
        onClose={workflowHandlers.close}
        position="right"
        title="New Schedule"
        withCloseButton
        preventInitialDrawerFocus
        footerLeft={
          <Button variant="light" color="gray" onClick={workflowHandlers.close}>
            Cancel
          </Button>
        }
        footerRight={
          <>
            <Button variant="light" color="blurple">
              Previous
            </Button>
            <Button variant="filled" color="blurple">
              Next
            </Button>
          </>
        }
      >
        <Stack gap="lg">
          <Stepper active={1} size="sm">
            <Stepper.Step label="Step 1" description="Step details" />
            <Stepper.Step label="Step 2" description="Step details" />
            <Stepper.Step label="Step 3" description="Step details" />
          </Stepper>
          <Select
            label="Date"
            placeholder="Select a date"
            data={['Today', 'Tomorrow', 'Next week']}
            required
          />
          <SimpleGrid cols={2} spacing="lg">
            <Select label="Start Time" placeholder="12:00 AM" data={['12:00 AM', '1:00 AM']} required />
            <Select label="End Time" placeholder="12:00 AM" data={['12:00 AM', '1:00 AM']} required />
          </SimpleGrid>
          <Text size="sm">
            No visible damage was found, unless you count the cosmetic scuff that everyone
            agreed “has probably always been like that.” Nearby components were checked for
            alignment, stability, and general vibes. Everything appeared to be functioning
            within acceptable parameters, assuming those parameters are loosely defined and
            generously interpreted. A brief discussion occurred regarding whether this task
            should be closed, paused, or escalated, and the consensus was to update the notes
            and see how everyone feels about it tomorrow.
          </Text>
        </Stack>
      </WorkflowDrawer>

      <DetailDrawer
        opened={detailOpened}
        onClose={detailHandlers.close}
        position="right"
        title="Refrigerator"
        withCloseButton
      >
        <Stack gap="lg">
          <Tabs defaultValue="details">
            <Tabs.List>
              <Tabs.Tab value="details">Details</Tabs.Tab>
              <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
            </Tabs.List>
          </Tabs>
          <Alert color="yellow" variant="light" title="User management in Call Management has changed">
            User details cannot be edited here. User management has been moved to the Admin Center.
          </Alert>
          <SimpleGrid cols={2} spacing="lg">
            <Stack gap={4}>
              <Text size="sm" fw={600}>
                First Name
              </Text>
              <Text size="sm">Lisa</Text>
            </Stack>
            <Stack gap={4}>
              <Text size="sm" fw={600}>
                Last Name
              </Text>
              <Text size="sm">Peters</Text>
            </Stack>
          </SimpleGrid>
          <Divider />
          <Stack gap={4}>
            <Text size="sm" fw={600}>
              Email
            </Text>
            <Text size="sm">lisap267@gmail.com</Text>
          </Stack>
          <Stack gap={4}>
            <Text size="sm" fw={600}>
              Mobile Number
            </Text>
            <Text size="sm">206-555-7843</Text>
          </Stack>
          <Text size="sm">
            Communication was logged to ensure transparency, traceability, and the comforting
            illusion that someone is definitely keeping track of all of this. The resident was
            notified that the situation had been reviewed and that no immediate action was
            required at this time, which was technically accurate and emotionally reassuring.
            Internal notes were added clarifying that if the issue comes back, this entry will
            serve as proof that it was already looked at very thoroughly and with great
            seriousness.
          </Text>
          <Text size="sm">
            Materials were not ordered, mostly because no one could agree on what materials
            would theoretically solve the problem if it were to become a real problem in the
            future. Tools were mentioned in passing, largely to make the record feel complete.
            A follow-up was tentatively considered, then un-considered, and finally left
            open-ended so the system would continue to feel useful.
          </Text>
          <Text size="sm">
            This task remains documented here for historical reference, UI stress testing, and
            to demonstrate how long-form text behaves when users type far more than anyone
            realistically needs. If you are reading this in a demo environment, congratulations
            — the text field is working as intended. If you are reading this in production,
            something has gone terribly, terribly wrong.
          </Text>
        </Stack>
      </DetailDrawer>
    </Stack>
  )
}

