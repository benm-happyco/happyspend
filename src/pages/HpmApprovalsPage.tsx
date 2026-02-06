import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Collapse,
  Divider,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Alert02Icon,
} from '@hugeicons/core-free-icons'
import { supabaseMetrics } from '../lib/supabaseMetrics'
import { JoyAiIcon } from '../theme/components/JoyAiIcon'
import { UnavailableOutline } from '../theme/components/UnavailableOutline'
import { InsightsPageShell } from './InsightsPageShell'

type PropertyOption = { property_id: string; name: string | null }

type ApprovalType = 'capex' | 'vendor'
type ApprovalRisk = 'high' | 'normal'

type ApprovalItem = {
  id: string
  type: ApprovalType
  title: string
  property_id: string
  propertyName: string
  amountUsd: number
  dueBucket: 'today' | 'upcoming'
  dueLabel: string
  risk: ApprovalRisk
  ai: {
    recommendation: string
    reason: string
    confidencePct: number
  }
}

function formatCurrency(valueUsd: number) {
  return `$${Math.round(valueUsd).toLocaleString()}`
}

function hashToUnitFloat(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // eslint-disable-next-line no-bitwise
  return ((h >>> 0) % 1_000_000) / 1_000_000
}

function seededRange(seed: string, min: number, max: number): number {
  const t = hashToUnitFloat(seed)
  return min + t * (max - min)
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function typePill(t: ApprovalType) {
  if (t === 'capex') return { label: 'CAP', bg: 'color-mix(in oklab, var(--mantine-color-purple-6) 16%, transparent)', fg: 'var(--mantine-color-purple-7)' }
  if (t === 'vendor') return { label: 'VEN', bg: 'color-mix(in oklab, var(--mantine-color-indigo-6) 16%, transparent)', fg: 'var(--mantine-color-indigo-7)' }
  return { label: 'CAP', bg: 'color-mix(in oklab, var(--mantine-color-purple-6) 16%, transparent)', fg: 'var(--mantine-color-purple-7)' }
}

export function HpmApprovalsPage() {
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [loadingProps, setLoadingProps] = useState(true)
  const unavailable = true // approvals + JoyAI recommendation metrics are demo placeholders for now

  const [tab, setTab] = useState<'Inbox' | 'Exceptions'>('Inbox')
  const [search, setSearch] = useState('')

  const [openDueToday, setOpenDueToday] = useState(true)
  const [openUpcoming, setOpenUpcoming] = useState(true)

  const [items, setItems] = useState<ApprovalItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoadingProps(true)
      try {
        const { data, error } = await supabaseMetrics.from('properties').select('property_id, name').order('name')
        if (error) throw error
        if (!mounted) return
        setProperties((data ?? []) as PropertyOption[])
      } catch {
        if (mounted) setProperties([])
      } finally {
        if (mounted) setLoadingProps(false)
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (loadingProps) return
    const list = properties.length
      ? properties
      : [
          { property_id: 'p-1', name: 'Highland Towers' },
          { property_id: 'p-2', name: 'Sunset Blvd' },
          { property_id: 'p-3', name: 'River Valley' },
        ]

    const pick = (i: number) => list[Math.min(list.length - 1, i)]
    const p1 = pick(0)
    const p2 = pick(Math.floor(list.length / 2))
    const p3 = pick(list.length - 1)

    const mk = (args: Omit<ApprovalItem, 'propertyName'> & { propertyName?: string }) =>
      ({
        ...args,
        propertyName: args.propertyName ?? (list.find((p) => p.property_id === args.property_id)?.name ?? 'Unknown property'),
      }) satisfies ApprovalItem

    const demo: ApprovalItem[] = [
      mk({
        id: 'appr-1',
        type: 'capex',
        title: 'Roof Repair Authorization',
        property_id: p1.property_id,
        propertyName: p1.name ?? 'Highland Towers',
        amountUsd: 12450,
        dueBucket: 'today',
        dueLabel: 'Due Today',
        risk: 'high',
        ai: {
          recommendation: 'Auto-recommended due to repeat leak pattern',
          reason: `Avoid ${formatCurrency(42000)} potential water damage`,
          confidencePct: 92,
        },
      }),
      mk({
        id: 'appr-2',
        type: 'capex',
        title: 'Building-Wide Plumbing Riser Replacement',
        property_id: p2.property_id,
        propertyName: p2.name ?? 'Sunset Blvd',
        amountUsd: 28750,
        dueBucket: 'today',
        dueLabel: 'Due Today',
        risk: 'high',
        ai: {
          recommendation: 'Replace aging risers to reduce repeat leak incidents',
          reason: `Avoid ${formatCurrency(68000)} in reactive repairs + downtime`,
          confidencePct: 90,
        },
      }),
      mk({
        id: 'appr-3',
        type: 'vendor',
        title: 'Landscaping Contract Renewal',
        property_id: p3.property_id,
        propertyName: p3.name ?? 'River Valley',
        amountUsd: 2100,
        dueBucket: 'upcoming',
        dueLabel: 'Upcoming',
        risk: 'normal',
        ai: {
          recommendation: 'Rate is within 5% of regional benchmark',
          reason: 'Ensure service continuity',
          confidencePct: 88,
        },
      }),
      // a few more rows to make the list feel real
      ...list.slice(0, Math.min(6, list.length)).map((p, idx) => {
        const seed = `extra:${p.property_id}:${idx}`
        const typeRoll = seededRange(seed, 0, 1)
        const type: ApprovalType = typeRoll > 0.55 ? 'capex' : 'vendor'
        const dueBucket: 'today' | 'upcoming' = seededRange(`due:${seed}`, 0, 1) > 0.68 ? 'today' : 'upcoming'
        const risk: ApprovalRisk = seededRange(`risk:${seed}`, 0, 1) > 0.78 ? 'high' : 'normal'
        const amount =
          type === 'capex'
            ? seededRange(`amt:${seed}`, 18_000, 165_000)
            : type === 'vendor'
              ? seededRange(`amt:${seed}`, 6_000, 42_000)
              : seededRange(`amt:${seed}`, 6_000, 42_000)
        const conf = Math.round(seededRange(`conf:${seed}`, 68, 96))

        const title =
          type === 'capex'
            ? [
                'Envelope Inspection Authorization',
                'Boiler Retrofit Approval',
                'Parking Lot Resurfacing',
                'Building-Wide HVAC Replacement',
                'Life Safety System Upgrade',
                'Facade Repair & Repaint Program',
                'Roof Membrane Replacement',
                'ADA Compliance Refresh',
              ][idx % 8]
            : type === 'vendor'
              ? [
                  'Elevator Maintenance Renewal',
                  'Security Patrol Addendum',
                  'Snow Removal Contract Renewal',
                  'Landscaping Contract Renewal',
                  'Fire Monitoring Service Renewal',
                ][idx % 5]
              : [
                  'Elevator Maintenance Renewal',
                  'Security Patrol Addendum',
                  'Snow Removal Contract Renewal',
                  'Landscaping Contract Renewal',
                  'Fire Monitoring Service Renewal',
                ][idx % 5]

        return mk({
          id: `appr-x-${p.property_id}-${idx}`,
          type,
          title,
          property_id: p.property_id,
          propertyName: p.name ?? 'Unknown property',
          amountUsd: Math.round(amount),
          dueBucket,
          dueLabel: dueBucket === 'today' ? 'Due Today' : 'Upcoming',
          risk,
          ai: {
            recommendation: risk === 'high' ? 'High risk flagged based on recent incidents' : 'Recommended based on benchmark + seasonality',
            reason:
              type === 'capex'
                ? `Avoid ${formatCurrency(Math.round(amount * 2.7))} in reactive repairs`
                : type === 'vendor'
                  ? 'Lock pricing before peak season'
                  : 'Reduce repeat tickets for same unit line',
            confidencePct: conf,
          },
        })
      }),
    ]

    setItems(demo)
    setSelectedIds(new Set())
  }, [loadingProps, properties])

  const scoped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? items.filter((i) => (i.title + ' ' + i.propertyName).toLowerCase().includes(q))
      : items
    const inTab = tab === 'Inbox' ? filtered : filtered.filter((i) => i.risk === 'high')
    const dueToday = inTab.filter((i) => i.dueBucket === 'today')
    const upcoming = inTab.filter((i) => i.dueBucket === 'upcoming')
    return { all: inTab, dueToday, upcoming }
  }, [items, search, tab])

  const metrics = useMemo(() => {
    const dueToday = scoped.dueToday.length
    const highRisk = scoped.all.filter((i) => i.risk === 'high').length
    const pendingValue = scoped.all.reduce((acc, i) => acc + i.amountUsd, 0)
    return { dueToday, highRisk, pendingValue }
  }, [scoped])

  const selectionCount = selectedIds.size
  const selectionIds = useMemo(() => Array.from(selectedIds), [selectedIds])

  const propertyPill = (t: ApprovalType) => {
    const cfg = typePill(t)
    return (
      <Box
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          background: cfg.bg,
          color: cfg.fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 12,
          flex: '0 0 auto',
        }}
      >
        {cfg.label}
      </Box>
    )
  }

  const toggleSelected = (id: string, next: boolean) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev)
      if (next) copy.add(id)
      else copy.delete(id)
      return copy
    })
  }

  const setAllInSection = (ids: string[], next: boolean) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev)
      ids.forEach((id) => {
        if (next) copy.add(id)
        else copy.delete(id)
      })
      return copy
    })
  }

  const actOn = (ids: string[], action: 'approve' | 'reject') => {
    if (ids.length === 0) return
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)))
    setSelectedIds((prev) => {
      const copy = new Set(prev)
      ids.forEach((id) => copy.delete(id))
      return copy
    })
    // (demo) could add notifications later
    void action
  }

  const ApprovalRow = ({ i }: { i: ApprovalItem }) => {
    const checked = selectedIds.has(i.id)
    const riskBorder =
      i.risk === 'high'
        ? 'color-mix(in oklab, var(--mantine-color-yellow-6) 45%, var(--mantine-color-default-border))'
        : 'var(--mantine-color-default-border)'
    return (
      <UnavailableOutline unavailable={unavailable} radius={16}>
        <Paper
          withBorder
          radius="lg"
          p="md"
          style={{
            borderColor: riskBorder,
            background:
              i.risk === 'high'
                ? 'color-mix(in oklab, var(--mantine-color-yellow-6) 6%, var(--mantine-color-body))'
                : undefined,
          }}
        >
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <Group align="flex-start" wrap="nowrap" gap="md" style={{ minWidth: 0 }}>
              <Checkbox checked={checked} onChange={(e) => toggleSelected(i.id, e.currentTarget.checked)} mt={4} />
              {propertyPill(i.type)}
              <Stack gap={6} style={{ minWidth: 0 }}>
              <Group gap={8} wrap="wrap">
                <Badge size="xs" variant="light" color={i.dueBucket === 'today' ? 'red' : 'gray'}>
                  {i.dueLabel}
                </Badge>
                {i.risk === 'high' ? (
                  <Badge size="xs" variant="light" color="yellow">
                    High Risk
                  </Badge>
                ) : null}
              </Group>

              <Text fw={900} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {i.title}
              </Text>

              <Group gap={10} wrap="wrap">
                <Text size="sm" c="dimmed">
                  {i.propertyName}
                </Text>
                <Text size="sm" fw={900}>
                  {formatCurrency(i.amountUsd)}
                </Text>
              </Group>

              <Paper
                withBorder
                radius="md"
                p="xs"
                style={{
                  background: 'color-mix(in oklab, var(--mantine-color-purple-6) 7%, var(--mantine-color-body))',
                  borderColor: 'color-mix(in oklab, var(--mantine-color-purple-6) 18%, var(--mantine-color-default-border))',
                }}
              >
                <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                  <Group gap="sm" wrap="nowrap" align="center" style={{ minWidth: 0 }}>
                    <Box
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 10,
                        background: 'color-mix(in oklab, var(--mantine-color-purple-6) 14%, transparent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: '0 0 auto',
                      }}
                    >
                      <JoyAiIcon size={16} alt="JOYAI" />
                    </Box>
                    <Box style={{ minWidth: 0 }}>
                      <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                        JoyAI recommendation
                      </Text>
                      <Text size="sm" fw={700} style={{ color: 'var(--mantine-color-text)' }} lineClamp={1}>
                        {i.ai.recommendation}
                      </Text>
                      <Group gap={8} wrap="nowrap">
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {i.ai.reason}
                        </Text>
                        <Text size="xs" c="dimmed" style={{ flex: '0 0 auto' }}>
                          · {i.ai.confidencePct}% conf.
                        </Text>
                      </Group>
                    </Box>
                  </Group>

                  <Button
                    variant="subtle"
                    size="xs"
                    rightSection={<HugeiconsIcon icon={ArrowRight01Icon} size={14} />}
                    styles={{ root: { paddingInline: 8 } }}
                  >
                    Why
                  </Button>
                </Group>
              </Paper>
              </Stack>
            </Group>

            <Group gap="xs" wrap="nowrap" align="center" justify="flex-end">
              <Button size="sm" variant="filled" onClick={() => actOn([i.id], 'approve')} style={{ minWidth: 110 }}>
                Approve
              </Button>
              <Button size="sm" variant="light" style={{ minWidth: 110 }}>
                Review
              </Button>
              <Button size="sm" variant="subtle" onClick={() => actOn([i.id], 'reject')} style={{ minWidth: 44 }}>
                ✕
              </Button>
            </Group>
          </Group>
        </Paper>
      </UnavailableOutline>
    )
  }

  const Section = ({
    title,
    count,
    opened,
    onToggle,
    ids,
    rows,
  }: {
    title: string
    count: number
    opened: boolean
    onToggle: () => void
    ids: string[]
    rows: ApprovalItem[]
  }) => {
    const selectedInSection = ids.filter((id) => selectedIds.has(id)).length
    const allSelected = ids.length > 0 && selectedInSection === ids.length
    const someSelected = selectedInSection > 0 && selectedInSection < ids.length

    return (
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="center">
            <UnstyledButton onClick={onToggle}>
              <Group gap={8} align="center">
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={18}
                  style={{
                    transform: opened ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 120ms ease',
                  }}
                />
                <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                  {title} ({count})
                </Text>
              </Group>
            </UnstyledButton>
            {ids.length ? (
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(e) => setAllInSection(ids, e.currentTarget.checked)}
                label={<Text size="xs" c="dimmed">Select all</Text>}
              />
            ) : null}
          </Group>
        </Group>

        <Collapse in={opened}>
          <Stack gap="md">
            {rows.length ? rows.map((i) => <ApprovalRow key={i.id} i={i} />) : <Text size="sm" c="dimmed">Nothing here.</Text>}
          </Stack>
        </Collapse>
      </Stack>
    )
  }

  const dueTodayIds = scoped.dueToday.map((i) => i.id)
  const upcomingIds = scoped.upcoming.map((i) => i.id)

  // Bulk bar (fixed, but only the bar captures pointer events)
  const bulkBar = selectionCount > 0 && (
    <Box
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 18,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 1200,
      }}
    >
      <Paper
        withBorder
        radius="xl"
        p="sm"
        style={{
          width: 'min(820px, calc(100vw - 48px))',
          background: 'color-mix(in oklab, var(--mantine-color-body) 92%, var(--mantine-color-dark-9))',
          pointerEvents: 'auto',
        }}
      >
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Text size="sm" fw={900}>
            {selectionCount} selected
          </Text>
          <Group gap="sm">
            <Button variant="default" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
            <Button color="red" variant="filled" onClick={() => actOn(selectionIds, 'reject')}>
              Reject All
            </Button>
            <Button color="green" variant="filled" onClick={() => actOn(selectionIds, 'approve')}>
              Approve All
            </Button>
          </Group>
        </Group>
      </Paper>
    </Box>
  )

  return (
    <InsightsPageShell title="Approvals" hideHeaderFilters>
      <Stack gap="lg">
        {/* Top metrics */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          <UnavailableOutline unavailable={unavailable} radius={16}>
            <Paper withBorder radius="lg" p="lg">
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                    Due today
                  </Text>
                  <Text fw={900} size="xl">
                    {metrics.dueToday}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Requires review today
                  </Text>
                </Stack>
                <Box
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: 'color-mix(in oklab, var(--mantine-color-red-6) 14%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HugeiconsIcon icon={Calendar03Icon} size={18} />
                </Box>
              </Group>
            </Paper>
          </UnavailableOutline>

          <UnavailableOutline unavailable={unavailable} radius={16}>
            <Paper withBorder radius="lg" p="lg">
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                    High risk
                  </Text>
                  <Text fw={900} size="xl">
                    {metrics.highRisk}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Flagged for escalation
                  </Text>
                </Stack>
                <Box
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: 'color-mix(in oklab, var(--mantine-color-yellow-6) 14%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HugeiconsIcon icon={Alert02Icon} size={18} />
                </Box>
              </Group>
            </Paper>
          </UnavailableOutline>

          <UnavailableOutline unavailable={unavailable} radius={16}>
            <Paper withBorder radius="lg" p="lg">
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                    Pending value
                  </Text>
                  <Text fw={900} size="xl" style={{ color: 'var(--mantine-color-success-7)' }}>
                    {formatCurrency(metrics.pendingValue)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Total value awaiting approval
                  </Text>
                </Stack>
                <Box
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: 'color-mix(in oklab, var(--mantine-color-success-6) 14%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <JoyAiIcon size={18} alt="JOYAI" />
                </Box>
              </Group>
            </Paper>
          </UnavailableOutline>
        </SimpleGrid>

        {/* Tabs + tools */}
        <Group justify="space-between" align="center" wrap="wrap">
          <SegmentedControl
            value={tab}
            onChange={(v) => setTab(v as typeof tab)}
            data={[
              { label: `Inbox ${scoped.all.length ? `(${scoped.all.length})` : ''}`.trim(), value: 'Inbox' },
              { label: `Exceptions ${scoped.all.filter((i) => i.risk === 'high').length ? `(${scoped.all.filter((i) => i.risk === 'high').length})` : ''}`.trim(), value: 'Exceptions' },
            ]}
          />
          <Group gap="sm">
            <TextInput
              placeholder={loadingProps ? 'Loading…' : 'Search approvals…'}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ width: 280 }}
              rightSection={<HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
            />
            <Button variant="default" leftSection={<HugeiconsIcon icon={ArrowRight01Icon} size={16} />}>
              Filter
            </Button>
            <Button variant="default" leftSection={<HugeiconsIcon icon={ArrowDown01Icon} size={16} />}>
              Sort
            </Button>
          </Group>
        </Group>

        <Divider />

        {/* Sections */}
        <Section
          title="Due today"
          count={scoped.dueToday.length}
          opened={openDueToday}
          onToggle={() => setOpenDueToday((v) => !v)}
          ids={dueTodayIds}
          rows={scoped.dueToday}
        />

        <Divider />

        <Section
          title="Upcoming"
          count={scoped.upcoming.length}
          opened={openUpcoming}
          onToggle={() => setOpenUpcoming((v) => !v)}
          ids={upcomingIds}
          rows={scoped.upcoming}
        />

        {/* Spacer so bulk bar doesn't cover content */}
        <Box h={72} />
      </Stack>

      {bulkBar}
    </InsightsPageShell>
  )
}
