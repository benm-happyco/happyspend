import { ActionIcon, Badge, Box, Group, Paper, Stack, Text, UnstyledButton, useMantineTheme } from '@mantine/core'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Call02Icon,
  ChartBarLineIcon,
  CheckListIcon,
  ClipboardIcon,
  DashboardCircleIcon,
  Door01Icon,
  Folder02Icon,
  Package01Icon,
  SaleTag02Icon,
  Tag02Icon,
  Task01Icon,
  Triangle01Icon,
} from '@hugeicons-pro/core-stroke-rounded'

type IconSvgObject = typeof DashboardCircleIcon

type SidebarNavItem = {
  id: string
  label: string
  icon: IconSvgObject
  expandable?: boolean
  subItems?: { id: string; label: string }[]
}

type HpySidebarNavItemProps = {
  icon: IconSvgObject
  label: string
  collapsed: boolean
  expandable?: boolean
  expanded?: boolean
  onToggleExpand?: () => void
}

const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 72

export function HpySidebarNavButton({
  icon,
  label,
  collapsed,
  expandable,
  expanded,
  onToggleExpand,
}: HpySidebarNavItemProps) {
  const theme = useMantineTheme()

  return (
    <UnstyledButton
      onClick={expandable ? onToggleExpand : undefined}
      style={{
        width: '100%',
        padding: 12,
        borderRadius: theme.radius.md,
        minHeight: 46,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Group gap="sm" justify="space-between" w="100%" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <Box style={{ width: 24, height: 24, display: 'grid', placeItems: 'center' }}>
            <HugeiconsIcon icon={icon} size={20} />
          </Box>
          {!collapsed && (
            <Text size="md" c="dark.9">
              {label}
            </Text>
          )}
        </Group>
        {!collapsed && expandable && (
          <Box
            style={{
              width: 24,
              height: 24,
              display: 'grid',
              placeItems: 'center',
              transform: expanded ? 'rotate(180deg)' : undefined,
              transition: 'transform 150ms ease',
              color: theme.colors.dark[4],
            }}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
          </Box>
        )}
      </Group>
    </UnstyledButton>
  )
}

export type HpySidebarProps = {
  variant?: 'hpm'
  height?: string | number
}

export function HpySidebar({ variant = 'hpm', height }: HpySidebarProps) {
  const theme = useMantineTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    inspections: true,
    projects: false,
    callManagement: false,
    inventory: false,
  })

  if (variant !== 'hpm') {
    return null
  }

  const productNav: SidebarNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardCircleIcon },
    { id: 'units', label: 'Units & Areas', icon: Door01Icon },
    { id: 'vendors', label: 'Vendors', icon: Tag02Icon },
    { id: 'documents', label: 'Documents', icon: Folder02Icon },
    { id: 'incidents', label: 'Incidents', icon: Triangle01Icon },
    { id: 'work-assignment', label: 'Work Assignment', icon: ClipboardIcon },
    { id: 'property-profile', label: 'Property Profile', icon: ChartBarLineIcon },
    { id: 'procurement', label: 'Procurement', icon: SaleTag02Icon },
  ]

  const appNav: SidebarNavItem[] = [
    {
      id: 'inspections',
      label: 'Inspections',
      icon: CheckListIcon,
      expandable: true,
      subItems: [
        { id: 'inspections-overview', label: 'Overview' },
        { id: 'inspections-settings', label: 'Settings' },
      ],
    },
    { id: 'tasks', label: 'Tasks', icon: Task01Icon },
    {
      id: 'projects',
      label: 'Projects',
      icon: Triangle01Icon,
      expandable: true,
      subItems: [
        { id: 'projects-active', label: 'Active' },
        { id: 'projects-archived', label: 'Archived' },
      ],
    },
    {
      id: 'callManagement',
      label: 'Call Management',
      icon: Call02Icon,
      expandable: true,
      subItems: [
        { id: 'call-queue', label: 'Queue' },
        { id: 'call-history', label: 'History' },
      ],
    },
    { id: 'insights', label: 'Insights', icon: ChartBarLineIcon },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package01Icon,
      expandable: true,
      subItems: [
        { id: 'inventory-stock', label: 'Stock' },
        { id: 'inventory-orders', label: 'Orders' },
      ],
    },
    { id: 'fixed-assets', label: 'Fixed Assets', icon: Package01Icon },
  ]

  const toggleCollapse = () => setCollapsed((prev) => !prev)
  const toggleExpand = (id: string) =>
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))

  const resolvedHeight = height ?? `calc(100vh - 56px)`

  return (
    <Box
      style={{
        position: 'relative',
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        transition: 'width 150ms ease',
        height: resolvedHeight,
      }}
    >
      <Paper
        shadow="sm"
        radius={0}
        style={{
          width: '100%',
          padding: '32px 14px',
          backgroundColor: theme.white,
          boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.15)',
          borderRadius: 0,
          height: '100%',
          overflowY: 'auto',
        }}
      >
        <Stack gap="xl">
          <Stack gap="xs" align={collapsed ? 'center' : 'flex-start'}>
            {!collapsed && (
              <Text size="lg" fw={800} c="dark.9">
                Capitol Heights
              </Text>
            )}
          </Stack>

          <Stack gap="xs">
            {productNav.map((item) => (
              <HpySidebarNavButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
              />
            ))}
          </Stack>

          <Stack gap="sm">
            {!collapsed && (
              <Text size="md" fw={800} c="dark.9" style={{ paddingLeft: 12 }}>
                Apps
              </Text>
            )}
            <Stack gap="xs">
              {appNav.map((item) => (
                <Box key={item.id}>
                  <HpySidebarNavButton
                    icon={item.icon}
                    label={item.label}
                    collapsed={collapsed}
                    expandable={item.expandable}
                    expanded={expandedItems[item.id]}
                    onToggleExpand={item.expandable ? () => toggleExpand(item.id) : undefined}
                  />
                  {!collapsed && item.expandable && expandedItems[item.id] && item.subItems && (
                    <Stack gap={6} style={{ paddingLeft: 48, paddingBottom: 8 }}>
                      {item.subItems.map((subItem) => (
                        <Text key={subItem.id} size="sm" c="dark.6">
                          {subItem.label}
                        </Text>
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          </Stack>

          <Stack gap="sm">
            <Group justify="space-between" align="center" px={12}>
              {!collapsed && (
                <Group gap="xs" wrap="nowrap">
                  <Text size="md" fw={800} c="dark.9">
                    Favorites
                  </Text>
                  <Badge color="green" variant="light" size="xs">
                    NEW
                  </Badge>
                </Group>
              )}
              <ActionIcon variant="transparent" aria-label="Add favorite">
                <HugeiconsIcon icon={Add01Icon} size={16} />
              </ActionIcon>
            </Group>

            {!collapsed && (
              <Box
                style={{
                  border: `1px dashed ${theme.colors.gray[4]}`,
                  borderRadius: theme.radius.md,
                  padding: `${theme.spacing.md}px ${theme.spacing.md}px`,
                  textAlign: 'center',
                }}
              >
                <Text size="xs" c="dark.9">
                  Easily save and navigate to the pages you visit most 🌟
                </Text>
                <Text size="xs" c="dark.6" td="underline" mt={6}>
                  Learn more about favorites
                </Text>
              </Box>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Box
        style={{
          position: 'absolute',
          top: 100,
          right: collapsed ? -12 : -12,
          width: 24,
          height: 24,
          borderRadius: 20,
          backgroundColor: theme.colors.blurple[0],
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <ActionIcon
          variant="transparent"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={toggleCollapse}
        >
          <Box
            style={{
              transform: collapsed ? 'rotate(180deg)' : undefined,
              transition: 'transform 150ms ease',
            }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          </Box>
        </ActionIcon>
      </Box>
    </Box>
  )
}


