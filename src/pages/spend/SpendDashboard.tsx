import { Box, Button, Group, Paper, SimpleGrid, Skeleton, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  File01Icon,
  Message01Icon,
  Clock01Icon,
  DollarCircleIcon,
  ArrowRight01Icon,
  Alert02Icon,
} from '@hugeicons/core-free-icons'
import { HpyPageHeader } from '../../theme/components/HpyPageHeader'
import { HpyAppIcon } from '../../theme/components/HpyAppIcon'
import { fetchDashboardStats, type DashboardStats } from '../../lib/sourcingEvents'
import { SpendPhaseStatusBadges } from './SpendPhaseStatusBadges'
import { SpendSetupRequired } from './SpendSetupRequired'

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function SpendDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    fetchDashboardStats()
      .then(setStats)
      .catch((e: unknown) =>
        setError(
          e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string'
            ? (e as { message: string }).message
            : String(e)
        )
      )
      .finally(() => setLoading(false))
  }, [])

  if (error) {
    return (
      <Stack gap="md">
        <HpyPageHeader
          title="Dashboard"
          appIconNode={<HpyAppIcon type="Projects" size={48} radius={8} />}
          searchPlaceholder="Search..."
          hideCta
        />
        <SpendSetupRequired error={error} />
      </Stack>
    )
  }

  if (loading || !stats) {
    return (
      <Stack gap="lg">
        <HpyPageHeader
          title="Dashboard"
          appIconNode={<HpyAppIcon type="Projects" size={48} radius={8} />}
          searchPlaceholder="Search..."
          hideCta
        />
        <Skeleton height={60} width={300} />
        <SimpleGrid cols={4}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={100} />
          ))}
        </SimpleGrid>
        <Skeleton height={200} />
      </Stack>
    )
  }

  const phaseOrder = [
    'Planning & Creation',
    'Market Engagement',
    'Evaluation',
    'Award & Contracting',
    'Conclusion',
  ]
  const pipelineData = phaseOrder.map((phase) => ({
    phase: phase.replace('Market Engagement', 'Market').replace('Planning & Creation', 'Planning').replace('Award & Contracting', 'Award').replace('Conclusion', 'Closed'),
    count: stats.byPhase[phase] ?? 0,
  }))

  return (
    <Stack gap="lg">
      <HpyPageHeader
        title="Dashboard"
        appIconNode={<HpyAppIcon type="Projects" size={48} radius={8} />}
        searchPlaceholder="Search..."
        hideCta
      />
      <Text size="sm" c="dimmed">
        Here&apos;s what&apos;s happening with your sourcing activities
      </Text>
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <Paper p="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/happy-spend/events')}>
          <Group gap="sm" mb="xs">
            <Box style={{ color: 'var(--mantine-color-green-6)' }}>
              <HugeiconsIcon icon={File01Icon} size={20} />
            </Box>
            <Text size="xs" c="dimmed">
              Sourcing Events
            </Text>
          </Group>
          <Text size="xl" fw={700}>
            {stats.activeRfx}
          </Text>
          <Text size="xs" c="dimmed">
            active (Open / Amended)
          </Text>
        </Paper>
        <Paper p="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/happy-spend/events')}>
          <Group gap="sm" mb="xs">
            <Box style={{ color: 'var(--mantine-color-blue-6)' }}>
              <HugeiconsIcon icon={Message01Icon} size={20} />
            </Box>
            <Text size="xs" c="dimmed">
              Total Responses
            </Text>
          </Group>
          <Text size="xl" fw={700}>
            {stats.totalResponses}
          </Text>
        </Paper>
        <Paper p="md" withBorder>
          <Group gap="sm" mb="xs">
            <Box style={{ color: 'var(--mantine-color-purple-6)' }}>
              <HugeiconsIcon icon={Clock01Icon} size={20} />
            </Box>
            <Text size="xs" c="dimmed">
              Avg. Response Time
            </Text>
          </Group>
          <Text size="xl" fw={700}>
            4.2 Days
          </Text>
        </Paper>
        <Paper p="md" withBorder>
          <Group gap="sm" mb="xs">
            <Box style={{ color: 'var(--mantine-color-green-6)' }}>
              <HugeiconsIcon icon={DollarCircleIcon} size={20} />
            </Box>
            <Text size="xs" c="dimmed">
              Contract Value
            </Text>
          </Group>
          <Text size="xl" fw={700}>
            {formatCurrency(stats.totalBudget)}
          </Text>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        <Paper p="md" withBorder>
          <Text size="sm" fw={700} mb="md">
            Quick Info
          </Text>
          <Text size="xs" c="dimmed" mb="sm">
            {stats.activeRfx} active sourcing events. Pending approvals: {stats.pendingApprovals}. Under review: {stats.underReview}.
          </Text>
          <Text size="xs" c="dimmed">
            Key stats: events, responses, and budget totals are from your Supabase data.
          </Text>
        </Paper>

        <Paper p="md" withBorder>
          <Text size="sm" fw={700} mb="md">
            Critical / Urgent
          </Text>
          {stats.recentEvents
            .filter((e) => ['Open', 'Under Review', 'Award Pending'].includes(e.status))
            .slice(0, 3)
            .map((e) => (
              <Box
                key={e.id}
                py="xs"
                style={{
                  borderBottom: '1px solid var(--mantine-color-default-border)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/happy-spend/events/${e.id}`)}
              >
                <Group justify="space-between">
                  <Text size="sm" fw={600} lineClamp={1}>
                    {e.name}
                  </Text>
                  <HugeiconsIcon icon={Alert02Icon} size={14} style={{ color: 'var(--mantine-color-orange-6)' }} />
                </Group>
                <Text size="xs" c="dimmed">
                  {e.property ?? '—'} · {formatCurrency(e.budget)}
                </Text>
              </Box>
            ))}
          <Button variant="subtle" size="xs" mt="sm" onClick={() => navigate('/happy-spend/events')}>
            See more →
          </Button>
        </Paper>

        <Paper p="md" withBorder>
          <Text size="sm" fw={700} mb="md">
            Sourcing Events
          </Text>
          {stats.recentEvents.slice(0, 3).map((e) => (
            <Box
              key={e.id}
              py="xs"
              style={{
                borderBottom: '1px solid var(--mantine-color-default-border)',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/happy-spend/events/${e.id}`)}
            >
              <Text size="sm" fw={600} lineClamp={1}>
                {e.name}
              </Text>
              <Text size="xs" c="dimmed">
                {e.bids} responses · {e.deadline ? new Date(e.deadline).toLocaleDateString() : '—'}
              </Text>
            </Box>
          ))}
          <Button variant="subtle" size="xs" mt="sm" onClick={() => navigate('/happy-spend/events')}>
            See more →
          </Button>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Paper p="md" withBorder>
          <Text size="sm" fw={700} mb="md">
            Pipeline by phase
          </Text>
          <Stack gap="xs">
            {pipelineData.map(({ phase, count }) => (
              <Group key={phase} justify="space-between">
                <Text size="sm" c="dimmed">
                  {phase}
                </Text>
                <Text size="sm" fw={600}>
                  {count}
                </Text>
              </Group>
            ))}
          </Stack>
        </Paper>
        <Paper p="md" withBorder>
          <Text size="sm" fw={700} mb="md">
            Recent events
          </Text>
          {stats.recentEvents.slice(0, 5).map((e) => (
            <Group
              key={e.id}
              justify="space-between"
              wrap="nowrap"
              py="xs"
              style={{
                borderBottom: '1px solid var(--mantine-color-default-border)',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/happy-spend/events/${e.id}`)}
            >
              <Box style={{ minWidth: 0 }}>
                <Text size="sm" fw={600} lineClamp={1}>
                  {e.external_id ?? e.id.slice(0, 8)} — {e.name}
                </Text>
                <SpendPhaseStatusBadges phase={e.phase} status={e.status} />
              </Box>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Group>
          ))}
        </Paper>
      </SimpleGrid>
    </Stack>
  )
}
