import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
  useComputedColorScheme,
  useMantineTheme,
} from '@mantine/core'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { HpyAppIcon } from './HpyAppIcon'
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PieChartIcon,
  ChartLineData02Icon,
  StickyNote02Icon,
  Calendar03Icon,
  Calendar04Icon,
  File01Icon,
  InboxIcon,
  Megaphone02Icon,
  QrCodeIcon,
  Flowchart01Icon,
  Settings05Icon,
  Video01Icon,
  Door02Icon,
  Folder01Icon,
  Folder02Icon,
  SaleTag02Icon,
  Alert02Icon,
} from '@hugeicons-pro/core-stroke-rounded'

type IconSvgObject = typeof PieChartIcon

type SidebarNavItem = {
  id: string
  label: string
  icon?: IconSvgObject
  iconNode?: React.ReactNode
  expandable?: boolean
  subItems?: { id: string; label: string; icon?: IconSvgObject }[]
}

type HpySidebarNavItemProps = {
  icon?: IconSvgObject
  iconNode?: React.ReactNode
  label: string
  collapsed: boolean
  expandable?: boolean
  expanded?: boolean
  onToggleExpand?: () => void
  compact?: boolean
}

const SIDEBAR_WIDTH = 240
const SIDEBAR_COLLAPSED_WIDTH = 72

export function HpySidebarNavButton({
  icon,
  label,
  collapsed,
  expandable,
  expanded,
  onToggleExpand,
  iconNode,
  compact = false,
}: HpySidebarNavItemProps) {
  const theme = useMantineTheme()
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const textColor = 'var(--mantine-color-text)'
  const iconColor = colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[7]

  return (
    <UnstyledButton
      onClick={expandable ? onToggleExpand : undefined}
      style={{
        width: '100%',
        padding: compact ? 0 : '12px 8px',
        borderRadius: theme.radius.md,
        minHeight: compact ? 'auto' : 46,
        display: 'flex',
        alignItems: 'center',
        color: textColor,
      }}
    >
      <Group gap="sm" justify="space-between" w="100%" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <Box style={{ width: 24, height: 24, display: 'grid', placeItems: 'center', color: iconColor }}>
            {iconNode ?? (icon ? <HugeiconsIcon icon={icon} size={20} /> : null)}
          </Box>
          <Box
            style={{
              maxWidth: collapsed ? 0 : 180,
              opacity: collapsed ? 0 : 1,
              overflow: 'hidden',
              transition: 'max-width 200ms ease, opacity 150ms ease',
            }}
          >
            <Text size="md" style={{ color: textColor, whiteSpace: 'nowrap' }}>
              {label}
            </Text>
          </Box>
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
              color: iconColor,
            }}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
          </Box>
        )}
      </Group>
    </UnstyledButton>
  )
}

function HpySidebarSubNavItem({ icon, label }: { icon?: IconSvgObject; label: string }) {
  const theme = useMantineTheme()
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const iconColor = colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[7]

  return (
    <Group gap="sm" align="center" style={{ padding: '4px 0 4px 12px' }}>
      <Box style={{ width: 24, height: 24, display: 'grid', placeItems: 'center', color: iconColor }}>
        {icon ? <HugeiconsIcon icon={icon} size={18} /> : null}
      </Box>
      <Text size="md" style={{ color: 'var(--mantine-color-text)' }}>
        {label}
      </Text>
    </Group>
  )
}

export type HpySidebarProps = {
  variant?: 'hpm'
  height?: string | number
}

export function HpySidebar({ variant = 'hpm', height }: HpySidebarProps) {
  const theme = useMantineTheme()
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const isDark = colorScheme === 'dark'
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    inspections: false,
    projects: false,
    callManagement: false,
    inventory: false,
  })

  if (variant !== 'hpm') {
    return null
  }

  const productNav: SidebarNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChartIcon },
    { id: 'units', label: 'Units & Areas', icon: Door02Icon },
    { id: 'vendors', label: 'Vendors', icon: Folder01Icon },
    { id: 'documents', label: 'Documents', icon: Folder02Icon },
    { id: 'incidents', label: 'Incidents', icon: Alert02Icon },
    { id: 'work-assignment', label: 'Work Assignment', icon: StickyNote02Icon },
    { id: 'property-profile', label: 'Property Profile', icon: ChartLineData02Icon },
    { id: 'procurement', label: 'Procurement', icon: SaleTag02Icon },
  ]

  const appNav: SidebarNavItem[] = [
    {
      id: 'inspections',
      label: 'Inspections',
      iconNode: <HpyAppIcon type="Inspections" />,
      expandable: true,
      subItems: [
        { id: 'inspections-schedules', label: 'Schedules', icon: Calendar04Icon },
        { id: 'inspections-reports', label: 'Reports', icon: File01Icon },
        { id: 'inspections-live', label: 'Live', icon: Video01Icon },
      ],
    },
    {
      id: 'tasks',
      label: 'Tasks',
      iconNode: <HpyAppIcon type="Tasks" />,
    },
    {
      id: 'projects',
      label: 'Projects',
      iconNode: <HpyAppIcon type="Projects" />,
    },
    {
      id: 'callManagement',
      label: 'Call Management',
      iconNode: <HpyAppIcon type="Call Management" />,
      expandable: true,
      subItems: [
        { id: 'call-oncall', label: 'On-Call Schedule', icon: Calendar03Icon },
        { id: 'call-messages', label: 'Messages', icon: InboxIcon },
        { id: 'call-notify', label: 'Notify', icon: Megaphone02Icon },
        { id: 'call-settings', label: 'Settings', icon: Settings05Icon },
      ],
    },
    {
      id: 'insights',
      label: 'Insights',
      iconNode: <HpyAppIcon type="Insights" />,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      iconNode: <HpyAppIcon type="Inventory" />,
      expandable: true,
      subItems: [
        { id: 'inventory-items', label: 'Individual Items', icon: QrCodeIcon },
        { id: 'inventory-models', label: 'Makes/Models', icon: Flowchart01Icon },
      ],
    },
    {
      id: 'fixed-assets',
      label: 'Fixed Assets',
      iconNode: <HpyAppIcon type="Inventory" />,
    },
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
        transition: 'width 260ms cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'width',
        height: resolvedHeight,
      }}
    >
      <Paper
        shadow="sm"
        radius={0}
        style={{
          width: '100%',
          padding: '32px 14px',
          backgroundColor: 'var(--mantine-color-body)',
          boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.15)',
          borderRadius: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box style={{ paddingBottom: 8, paddingLeft: collapsed ? 0 : 8 }}>
          <Stack gap="xs" align={collapsed ? 'center' : 'flex-start'}>
            {!collapsed && (
              <Text size="lg" fw={800} style={{ color: 'var(--mantine-color-text)' }}>
                Capitol Heights
              </Text>
            )}
          </Stack>
        </Box>

        <Stack gap="xl" style={{ overflowY: 'auto', flex: 1 }}>
          <Stack gap={0}>
            {productNav.map((item) => (
              <HpySidebarNavButton
                key={item.id}
                icon={item.icon}
                iconNode={item.iconNode}
                label={item.label}
                collapsed={collapsed}
              />
            ))}
          </Stack>

          <Stack gap="sm">
            {!collapsed && (
              <Text size="md" fw={800} style={{ paddingLeft: 12, color: 'var(--mantine-color-text)' }}>
                Apps
              </Text>
            )}
            <Stack gap={0}>
              {appNav.map((item) => {
                const isExpanded = !collapsed && item.expandable && expandedItems[item.id]
                const showCard = !collapsed && item.expandable
                return (
                  <Box key={item.id}>
                    <Box
                      style={{
                        padding: showCard ? 12 : 0,
                        borderRadius: theme.radius.md,
                        backgroundColor: showCard ? 'var(--mantine-color-body)' : 'transparent',
                        boxShadow: isExpanded ? '0px 2px 8px 0px rgba(0, 0, 0, 0.1)' : 'none',
                      }}
                    >
                      <HpySidebarNavButton
                        icon={item.icon}
                        iconNode={item.iconNode}
                        label={item.label}
                        collapsed={collapsed}
                        expandable={item.expandable}
                        expanded={expandedItems[item.id]}
                        onToggleExpand={item.expandable ? () => toggleExpand(item.id) : undefined}
                        compact={showCard}
                      />
                      <Box
                        style={{
                          maxHeight: isExpanded ? 200 : 0,
                          opacity: isExpanded ? 1 : 0,
                          overflow: 'hidden',
                          transition: 'max-height 200ms ease, opacity 150ms ease',
                          paddingTop: isExpanded ? 8 : 0,
                        }}
                      >
                        {item.subItems && (
                          <Stack gap={0}>
                            {item.subItems.map((subItem) => (
                              <HpySidebarSubNavItem
                                key={subItem.id}
                                label={subItem.label}
                                icon={subItem.icon}
                              />
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )
              })}
            </Stack>
          </Stack>

          <Stack gap="sm">
            <Group justify="space-between" align="center" pl={12} pr={0}>
              {!collapsed && (
                <Group gap="xs" wrap="nowrap">
                  <Text size="md" fw={800} style={{ color: 'var(--mantine-color-text)' }}>
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
                  border: `1px dashed ${isDark ? theme.colors.dark[4] : theme.colors.gray[4]}`,
                  borderRadius: theme.radius.md,
                  padding: '32px 16px',
                  textAlign: 'center',
                  backgroundColor: isDark ? theme.colors.dark[7] : theme.white,
                }}
              >
                <Text size="xs" style={{ color: 'var(--mantine-color-text)' }}>
                  Easily save and navigate to the pages you visit most 🌟
                </Text>
                <Text size="xs" style={{ color: 'var(--mantine-color-dimmed)' }} td="underline" mt={6}>
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
          top: 40,
          left: collapsed ? SIDEBAR_COLLAPSED_WIDTH - 12 : SIDEBAR_WIDTH - 12,
          width: 24,
          height: 24,
          borderRadius: 64,
          backgroundColor: 'rgba(99, 91, 255, 0.1)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <ActionIcon
          variant="transparent"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={toggleCollapse}
          size={24}
          style={{ width: 24, height: 24 }}
        >
          <HugeiconsIcon icon={collapsed ? ArrowRight01Icon : ArrowLeft01Icon} size={20} />
        </ActionIcon>
      </Box>
    </Box>
  )
}


