import { Box, Button, Group, Paper, SimpleGrid, Skeleton, Stack, Text } from '@mantine/core'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HpyPageHeader } from '../../theme/components/HpyPageHeader'
import { HpyAppIcon } from '../../theme/components/HpyAppIcon'
import { fetchSourcingEventById, type SourcingEvent } from '../../lib/sourcingEvents'
import { SpendPhaseStatusBadges } from './SpendPhaseStatusBadges'

function formatCurrency(n: number | null): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function SpendEventDetail() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<SourcingEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    fetchSourcingEventById(eventId)
      .then(setEvent)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) {
    return (
      <Stack gap="lg">
        <HpyPageHeader
          title="Event detail"
          appIconNode={<HpyAppIcon type="Projects" size={48} radius={8} />}
          hideCta
          trailingContent={
            <Button
              leftSection={<HugeiconsIcon icon={ArrowLeft01Icon} size={18} />}
              variant="subtle"
              onClick={() => navigate('/happy-spend/events')}
            >
              Back to Events
            </Button>
          }
        />
        <Skeleton height={120} />
        <Skeleton height={80} />
      </Stack>
    )
  }

  if (error || !event) {
    return (
      <Stack gap="md">
        <HpyPageHeader
          title="Event detail"
          appIconNode={<HpyAppIcon type="Projects" size={48} radius={8} />}
          hideCta
          trailingContent={
            <Button
              leftSection={<HugeiconsIcon icon={ArrowLeft01Icon} size={18} />}
              variant="subtle"
              onClick={() => navigate('/happy-spend/events')}
            >
              Back to Events
            </Button>
          }
        />
        <Text c="dimmed">{error ?? 'Event not found.'}</Text>
      </Stack>
    )
  }

  const displayId = event.external_id ?? event.id.slice(0, 8)

  return (
    <Stack gap="lg">
      <HpyPageHeader
        title={event.name}
        appIconNode={<HpyAppIcon type="Projects" size={48} radius={8} />}
        hideCta
        trailingContent={
          <Button
            leftSection={<HugeiconsIcon icon={ArrowLeft01Icon} size={18} />}
            variant="subtle"
            onClick={() => navigate('/happy-spend/events')}
          >
            Back to Events
          </Button>
        }
      />
      <Group gap="sm">
        <Text size="xs" c="dimmed">
          {displayId}
        </Text>
        <SpendPhaseStatusBadges phase={event.phase} status={event.status} />
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Paper p="md" withBorder>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs">
            Overview
          </Text>
          <Stack gap="xs">
            <Row label="Type" value={event.type} />
            <Row label="Project" value={event.project ?? '—'} />
            <Row label="Property" value={event.property ?? '—'} />
            <Row label="Budget" value={formatCurrency(event.budget)} />
            <Row label="Bids" value={String(event.bids)} />
            <Row label="Created by" value={event.created_by ?? '—'} />
            <Row label="Created" value={formatDate(event.created_date)} />
            <Row label="Deadline" value={formatDate(event.deadline)} />
          </Stack>
        </Paper>
        <Paper p="md" withBorder>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs">
            Summary
          </Text>
          <Text size="sm" c="dimmed">
            Sourcing event in {event.phase}. Status: {event.status}.
            {event.budget != null && event.budget > 0 && ` Budget: ${formatCurrency(event.budget)}.`}
          </Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value}
      </Text>
    </Group>
  )
}
