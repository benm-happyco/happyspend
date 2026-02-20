import { Box, NavLink, Stack, Text } from '@mantine/core'
import { useLocation, useNavigate, useParams, Outlet } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../../theme/components/GlobalHeader'
import { JoyAiFloatingChat, type SpendAction } from '../../theme/components/JoyAiFloatingChat'
import { createSourcingEvent, fetchSourcingEvents, updateSourcingEventStatus } from '../../lib/sourcingEvents'
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
  const params = useParams<{ eventId?: string }>()
  const eventId = params.eventId

  const handleSpendAction = async (action: SpendAction) => {
    try {
      if (action.type === 'create_event') {
        const event = await createSourcingEvent({
          name: action.name,
          type: action.eventType ?? 'RFQ',
          budget: action.budget ?? null,
        })
        navigate(`/happy-spend/events/${event.id}`)
      } else if (action.type === 'update_status') {
        const idOrName = action.eventIdOrName
        const events = await fetchSourcingEvents()
        const event = events.find(
          (e) => e.id === idOrName || e.external_id === idOrName || e.name.toLowerCase().includes(idOrName.toLowerCase())
        )
        if (event) {
          await updateSourcingEventStatus(event.id, action.newStatus)
          if (location.pathname !== `/happy-spend/events/${event.id}`) {
            navigate(`/happy-spend/events/${event.id}`)
          }
        }
      }
    } catch (err) {
      console.error('Spend action failed:', err)
    }
  }

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
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
      <JoyAiFloatingChat
        mode="spend"
        spendContext={eventId ? { eventId } : undefined}
        onSpendAction={handleSpendAction}
      />
    </>
  )
}
