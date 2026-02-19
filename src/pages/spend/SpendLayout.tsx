import { Box, NavLink, Stack, Text } from '@mantine/core'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../../theme/components/GlobalHeader'
import { JoyAiFloatingChat } from '../../theme/components/JoyAiFloatingChat'
import {
  DashboardSquare01Icon,
  Folder01Icon,
  ListViewIcon,
  ContractsIcon,
  Shield01Icon,
  Analytics01Icon,
  Building01Icon,
  Settings01Icon,
} from '@hugeicons/core-free-icons'

const SIDEBAR_WIDTH = 210
const CONTENT_PADDING = 56

const NAV_ITEMS = [
  { path: '/happy-spend', label: 'Dashboard', icon: DashboardSquare01Icon },
  { path: '/happy-spend/projects', label: 'Projects', icon: Folder01Icon },
  { path: '/happy-spend/events', label: 'Sourcing Events', icon: ListViewIcon },
  { path: '/happy-spend/contracts', label: 'Contracts', icon: ContractsIcon },
  { path: '/happy-spend/compliance', label: 'Compliance', icon: Shield01Icon },
  { path: '/happy-spend/analytics', label: 'Analytics', icon: Analytics01Icon },
  { path: '/happy-spend/vendors', label: 'Vendors', icon: Building01Icon },
  { path: '/happy-spend/settings', label: 'Settings', icon: Settings01Icon },
] as const

export function SpendLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <>
      <GlobalHeader variant="product" />
      <Box
        style={{
          paddingTop: GLOBAL_HEADER_HEIGHT,
          minHeight: '100vh',
          display: 'flex',
          backgroundColor: 'var(--mantine-color-body)',
        }}
      >
        <Box
          style={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            borderRight: '1px solid var(--mantine-color-default-border)',
            padding: 16,
            backgroundColor: 'var(--mantine-color-body)',
          }}
        >
        <Text fw={700} size="lg" mb="md" style={{ color: 'var(--mantine-color-text)' }}>
          Happy Spend
        </Text>
        <Stack gap={4}>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              label={label}
              leftSection={<HugeiconsIcon icon={Icon} size={20} />}
              active={
                path === '/happy-spend'
                  ? location.pathname === '/happy-spend' || location.pathname === '/happy-spend/'
                  : path === '/happy-spend/events'
                    ? location.pathname.startsWith('/happy-spend/events')
                    : location.pathname === path || location.pathname.startsWith(path + '/')
              }
              onClick={() => navigate(path)}
            />
          ))}
        </Stack>
        </Box>
        <Box
          style={{
            flex: 1,
            padding: CONTENT_PADDING,
            overflow: 'auto',
            minWidth: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <JoyAiFloatingChat />
    </>
  )
}
