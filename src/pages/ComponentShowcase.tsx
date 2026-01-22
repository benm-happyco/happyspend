import {
  Button,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Switch,
  FileInput,
  Stack,
  Title,
  Paper,
  Group,
  Text,
  Badge,
  Card,
  Alert,
  Tabs,
  Menu,
  Table,
  Grid,
  ColorSwatch,
  SimpleGrid,
  ActionIcon,
  Anchor,
  Avatar,
  Tooltip,
  Pill,
} from '@mantine/core'
import { useState, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { AG_GRID_DEFAULT_COL_DEF, AG_GRID_DEFAULT_GRID_PROPS } from '../lib/agGridDefaults'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

export function ComponentShowcase() {
  const [activeTab, setActiveTab] = useState<string | null>('buttons')

  return (
    <Stack gap="xl" p="xl">
      <Title order={1}>Component Showcase</Title>
      <Text size="lg" c="dimmed">
        Visual reference for all customized Mantine components
      </Text>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="buttons">Buttons</Tabs.Tab>
          <Tabs.Tab value="inputs">Form Inputs</Tabs.Tab>
          <Tabs.Tab value="typography">Typography</Tabs.Tab>
          <Tabs.Tab value="colors">Colors</Tabs.Tab>
          <Tabs.Tab value="layout">Layout</Tabs.Tab>
          <Tabs.Tab value="feedback">Feedback</Tabs.Tab>
          <Tabs.Tab value="navigation">Navigation</Tabs.Tab>
          <Tabs.Tab value="data">Data Display</Tabs.Tab>
        </Tabs.List>

        {/* Buttons Tab */}
        <Tabs.Panel value="buttons" pt="xl">
          <Stack gap="xl">
            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Button Variants</Title>
              <Stack gap="md">
                <Group gap="md">
                  <Button variant="filled" color="blurple">Filled</Button>
                  <Button variant="light" color="blurple">Light</Button>
                  <Button variant="outline" color="blurple">Outline</Button>
                  <Button variant="subtle" color="blurple">Subtle</Button>
                  <Button variant="transparent" color="blurple">Transparent</Button>
                  <Button variant="white" color="blurple">White</Button>
                </Group>
              </Stack>
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Button Sizes</Title>
              <Stack gap="md">
                <Group gap="md">
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large (Default)</Button>
                  <Button size="xl">Extra Large</Button>
                </Group>
              </Stack>
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Button Colors</Title>
              <Stack gap="md">
                <Group gap="md">
                  <Button color="blurple">Blurple</Button>
                  <Button color="blue">Blue</Button>
                  <Button color="green">Green</Button>
                  <Button color="red">Red</Button>
                  <Button color="orange">Orange</Button>
                  <Button color="gray">Gray</Button>
                </Group>
              </Stack>
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Button States</Title>
              <Stack gap="md">
                <Group gap="md">
                  <Button>Normal</Button>
                  <Button disabled>Disabled</Button>
                  <Button loading>Loading</Button>
                  <Button fullWidth>Full Width</Button>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Form Inputs Tab */}
        <Tabs.Panel value="inputs" pt="xl">
          <Stack gap="xl">
            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Text Inputs</Title>
              <Stack gap="md">
                <TextInput label="Text Input" placeholder="Enter text" />
                <TextInput label="With Error" placeholder="Error state" error="This field is required" />
                <TextInput label="Disabled" placeholder="Disabled input" disabled />
              </Stack>
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Other Inputs</Title>
              <Stack gap="md">
                <Textarea label="Textarea" placeholder="Multi-line text" rows={4} />
                <Select label="Select" placeholder="Choose option" data={['Option 1', 'Option 2', 'Option 3']} />
                <FileInput label="File Input" placeholder="Choose file" />
                <Checkbox label="Checkbox" />
                <Radio.Group label="Radio Group">
                  <Stack gap="xs" mt="xs">
                    <Radio value="1" label="Option 1" />
                    <Radio value="2" label="Option 2" />
                  </Stack>
                </Radio.Group>
                <Switch label="Switch Toggle" />
              </Stack>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Typography Tab */}
        <Tabs.Panel value="typography" pt="xl">
          <Stack gap="xl">
            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Headings</Title>
              <Stack gap="md">
                <Title order={1}>Heading 1</Title>
                <Title order={2}>Heading 2</Title>
                <Title order={3}>Heading 3</Title>
                <Title order={4}>Heading 4</Title>
                <Title order={5}>Heading 5</Title>
                <Title order={6}>Heading 6</Title>
              </Stack>
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Text Sizes</Title>
              <Stack gap="md">
                <Text size="xs">Extra Small Text</Text>
                <Text size="sm">Small Text</Text>
                <Text size="md">Medium Text (Default)</Text>
                <Text size="lg">Large Text</Text>
                <Text size="xl">Extra Large Text</Text>
              </Stack>
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Text Styles</Title>
              <Stack gap="md">
                <Text fw={300}>Light Weight</Text>
                <Text fw={400}>Normal Weight</Text>
                <Text fw={600}>Semi Bold</Text>
                <Text fw={700}>Bold</Text>
                <Text fw={800}>Extra Bold</Text>
                <Text c="blurple">Colored Text</Text>
                <Text c="dimmed">Dimmed Text</Text>
                <Text td="underline">Underlined</Text>
                <Text td="line-through">Strikethrough</Text>
              </Stack>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Colors Tab */}
        <Tabs.Panel value="colors" pt="xl">
          <Stack gap="xl">
            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Color Palette</Title>
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="xl">
                {['blurple', 'blue', 'green', 'red', 'orange', 'yellow', 'gray', 'cyan', 'teal', 'violet', 'grape', 'indigo', 'navy'].map((color) => (
                  <Stack key={color} gap="xs" align="center">
                    <Text fw={600} size="sm">{color}</Text>
                    <Group gap={4}>
                      {Array.from({ length: 10 }, (_, i) => (
                        <ColorSwatch key={i} color={`var(--mantine-color-${color}-${i})`} size={20} />
                      ))}
                    </Group>
                  </Stack>
                ))}
              </SimpleGrid>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Layout Tab */}
        <Tabs.Panel value="layout" pt="xl">
          <Stack gap="xl">
            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Stack</Title>
              <Stack gap="md">
                <Paper p="md" withBorder bg="gray.0">Item 1</Paper>
                <Paper p="md" withBorder bg="gray.0">Item 2</Paper>
                <Paper p="md" withBorder bg="gray.0">Item 3</Paper>
              </Stack>
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Group</Title>
              <Group gap="md">
                <Button>Button 1</Button>
                <Button>Button 2</Button>
                <Button>Button 3</Button>
              </Group>
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Grid</Title>
              <Grid>
                <Grid.Col span={4}>
                  <Paper p="md" withBorder bg="gray.0">Column 1</Paper>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Paper p="md" withBorder bg="gray.0">Column 2</Paper>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Paper p="md" withBorder bg="gray.0">Column 3</Paper>
                </Grid.Col>
              </Grid>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Feedback Tab */}
        <Tabs.Panel value="feedback" pt="xl">
          <Stack gap="xl">
            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Alerts</Title>
              <Stack gap="md">
                <Alert color="blurple" title="Info Alert">This is an info alert</Alert>
                <Alert color="green" title="Success Alert">This is a success alert</Alert>
                <Alert color="red" title="Error Alert">This is an error alert</Alert>
                <Alert color="orange" title="Warning Alert">This is a warning alert</Alert>
              </Stack>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Navigation Tab */}
        <Tabs.Panel value="navigation" pt="xl">
          <Stack gap="xl">
            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Tabs</Title>
              <Tabs defaultValue="tab1">
                <Tabs.List>
                  <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                  <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                  <Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="tab1" pt="md">Content for Tab 1</Tabs.Panel>
                <Tabs.Panel value="tab2" pt="md">Content for Tab 2</Tabs.Panel>
                <Tabs.Panel value="tab3" pt="md">Content for Tab 3</Tabs.Panel>
              </Tabs>
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Menu</Title>
              <Menu>
                <Menu.Target>
                  <Button>Open Menu</Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item>Item 1</Menu.Item>
                  <Menu.Item>Item 2</Menu.Item>
                  <Menu.Divider />
                  <Menu.Item>Item 3</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Data Display Tab */}
        <Tabs.Panel value="data" pt="xl">
          <Stack gap="xl">
            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Badges</Title>
              <Group gap="md">
                <Badge>Default</Badge>
                <Badge color="blurple">Blurple</Badge>
                <Badge color="green">Green</Badge>
                <Badge color="red">Red</Badge>
                <Badge variant="light">Light</Badge>
                <Badge variant="outline">Outline</Badge>
              </Group>
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Cards</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Title order={4}>Card Title</Title>
                  <Text size="sm" c="dimmed" mt="xs">Card description</Text>
                </Card>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Title order={4}>Card Title</Title>
                  <Text size="sm" c="dimmed" mt="xs">Card description</Text>
                </Card>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Title order={4}>Card Title</Title>
                  <Text size="sm" c="dimmed" mt="xs">Card description</Text>
                </Card>
              </SimpleGrid>
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Table</Title>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Role</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>John Doe</Table.Td>
                    <Table.Td>john@example.com</Table.Td>
                    <Table.Td>Admin</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Jane Smith</Table.Td>
                    <Table.Td>jane@example.com</Table.Td>
                    <Table.Td>User</Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">AG Grid (Themed)</Title>
              <Text size="sm" c="dimmed" mb="md">
                Customized AG Grid with Mantine theme integration
              </Text>
              <AgGridExample />
            </Paper>

            <Paper p="xl" withBorder>
              <Title order={2} mb="md">Other Components</Title>
              <Stack gap="md">
                <Group gap="md">
                  <Avatar color="blurple">JD</Avatar>
                  <Avatar color="green">JS</Avatar>
                  <Avatar color="red">AB</Avatar>
                </Group>
                <Group gap="md">
                  <Tooltip label="Tooltip text">
                    <Button>Hover me</Button>
                  </Tooltip>
                  <Anchor href="#">Link</Anchor>
                  <Pill>Pill Component</Pill>
                </Group>
                <Group gap="md">
                  <ActionIcon variant="filled" color="blurple">A</ActionIcon>
                  <ActionIcon variant="light" color="blurple">B</ActionIcon>
                  <ActionIcon variant="outline" color="blurple">C</ActionIcon>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}

// AG Grid Example Component
function AgGridExample() {
  const defaultColDef = useMemo(() => ({ ...AG_GRID_DEFAULT_COL_DEF, minWidth: 100 }), [])

  const columnDefs: ColDef[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', flex: 1 },
      { field: 'email', headerName: 'Email', flex: 1 },
      { field: 'role', headerName: 'Role', width: 120 },
      { field: 'status', headerName: 'Status', width: 120 },
    ],
    []
  )

  const rowData = useMemo(
    () => [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor', status: 'Inactive' },
      { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'User', status: 'Active' },
      { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Viewer', status: 'Active' },
    ],
    []
  )

  return (
    <div 
      style={{ 
        height: '400px', 
        width: '100%',
      }} 
      className="ag-theme-alpine"
    >
      <AgGridReact
        {...AG_GRID_DEFAULT_GRID_PROPS}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowSelection="multiple"
        headerHeight={40}
        rowHeight={40}
        enableRangeSelection={true}
        enableFillHandle={true}
      />
    </div>
  )
}


