import { useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, Divider, Group, Paper, SegmentedControl, SimpleGrid, Stack, Text } from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, ChartLineData02Icon, Rocket01Icon } from '@hugeicons/core-free-icons'
import { supabaseMetrics } from '../lib/supabaseMetrics'
import { JoyAiChatWindow } from '../theme/components/JoyAiChatWindow'
import { JoyAiIcon } from '../theme/components/JoyAiIcon'
import { InsightsPageShell } from './InsightsPageShell'
import { getDemoActiveWorkflowCards, type DemoActiveWorkflowCard } from './workflowsDemoData'

type WorkflowState = 'active' | 'completed' | 'library'

type WorkflowCard = DemoActiveWorkflowCard

type CompletedWorkflowCard = {
  id: string
  title: string
  owner: string
  impactLeftLabel: string
  impactLeftValue: string
  impactLeftHelper: string
  impactRightLabel: string
  impactRightValue: string
  impactRightHelper: string
  runs: number
  successfulRuns: number
  estSavingsUsd: number | null
  hoursSaved: number | null
}

type LibraryWorkflowCard = {
  id: string
  title: string
  category: string
  summary: string
  impactValue: string
  cycleTimeValue: string
  confidenceValue: string
  recommendedFor: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function HpmWorkflowsPage() {
  const [propertyNames, setPropertyNames] = useState<string[]>([])
  const [loadingProps, setLoadingProps] = useState(true)

  const [view, setView] = useState<WorkflowState>('active')
  const [quickFilter, setQuickFilter] = useState<'All' | 'Reduce Loss to Lease' | 'Turn Time Recovery' | 'Vendor SLA' | 'DD Risk'>('All')
  const [joyDraft, setJoyDraft] = useState('')
  const [joyFocusKey, setJoyFocusKey] = useState(0)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoadingProps(true)
      try {
        const { data, error } = await supabaseMetrics.from('properties').select('name').order('name')
        if (error) throw error
        if (!mounted) return
        setPropertyNames((data ?? []).map((p) => (p.name as string | null) ?? 'Unknown property').filter(Boolean) as string[])
      } catch {
        if (mounted) setPropertyNames([])
      } finally {
        if (mounted) setLoadingProps(false)
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [])

  const featuredProperty = propertyNames[0] ?? 'Westwood Oaks'
  const vendorProperty = propertyNames[1] ?? 'Ace Carpentry'

  const formatCompactCurrency = (valueUsd: number) => {
    const abs = Math.abs(valueUsd)
    const sign = valueUsd < 0 ? '-' : ''
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}m`
    if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`
    return `${sign}$${Math.round(abs)}`
  }

  const activeCards: WorkflowCard[] = useMemo(
    () => getDemoActiveWorkflowCards({ featuredProperty, vendorProperty }),
    [featuredProperty, vendorProperty]
  )

  const completedCards: CompletedWorkflowCard[] = useMemo(
    () => [
      {
        id: 'wf-done-1',
        title: 'Q4 Lease Audit Automation',
        owner: 'Leasing Ops',
        impactLeftLabel: 'Realized impact',
        impactLeftValue: '$12,540',
        impactLeftHelper: 'vs $10k projected',
        impactRightLabel: 'Audit accuracy',
        impactRightValue: '99%',
        impactRightHelper: 'Was: 85%  ·  +14%',
        runs: 18,
        successfulRuns: 17,
        estSavingsUsd: 12_540,
        hoursSaved: 34,
      },
      {
        id: 'wf-done-2',
        title: 'Winterization Protocol Dispatch',
        owner: 'Facilities',
        impactLeftLabel: 'Realized impact',
        impactLeftValue: '100% Uptime',
        impactLeftHelper: 'vs 12 incidents LY',
        impactRightLabel: 'Risk mitigation',
        impactRightValue: '0 (2024)',
        impactRightHelper: 'Was: 12 (2023)  ·  −100%',
        runs: 9,
        successfulRuns: 9,
        estSavingsUsd: 0,
        hoursSaved: 18,
      },
      {
        id: 'wf-done-3',
        title: 'Trash Valet Contract Renegotiation',
        owner: 'Vendor Mgmt',
        impactLeftLabel: 'Realized impact',
        impactLeftValue: '$4,200',
        impactLeftHelper: 'vs $6.5k projected',
        impactRightLabel: 'Unit cost',
        impactRightValue: '$11.80',
        impactRightHelper: 'Was: $12.50  ·  −5.6%',
        runs: 7,
        successfulRuns: 7,
        estSavingsUsd: 4_200,
        hoursSaved: 11,
      },
      {
        id: 'wf-done-4',
        title: 'Smart Thermostat Pilot: Bldg C',
        owner: 'Sustainability',
        impactLeftLabel: 'Realized impact',
        impactLeftValue: '$850/mo',
        impactLeftHelper: 'vs $1.2k/mo target',
        impactRightLabel: 'Energy usage',
        impactRightValue: '1.38',
        impactRightHelper: 'Was: 1.42  ·  −2.8%',
        runs: 12,
        successfulRuns: 11,
        estSavingsUsd: 850,
        hoursSaved: 26,
      },
      {
        id: 'wf-done-5',
        title: 'Vendor SLA Baseline Cleanup',
        owner: 'Vendor Mgmt',
        impactLeftLabel: 'Realized impact',
        impactLeftValue: '$2,950',
        impactLeftHelper: 'vs $3.2k projected',
        impactRightLabel: 'Response time',
        impactRightValue: '−18%',
        impactRightHelper: 'Was: −3%  ·  improved',
        runs: 16,
        successfulRuns: 15,
        estSavingsUsd: 2_950,
        hoursSaved: 23,
      },
    ],
    []
  )

  const libraryCards: LibraryWorkflowCard[] = useMemo(
    () => [
      {
        id: 'lib-1',
        title: 'Turn Time Compression Workflow',
        category: 'Operations',
        summary: 'Detect make-ready bottlenecks and auto-assign next best actions to reduce vacancy days.',
        impactValue: '$9–20k/mo',
        cycleTimeValue: '7–10 days',
        confidenceValue: '88%',
        recommendedFor: 'High turns + slow vendor schedules',
      },
      {
        id: 'lib-2',
        title: 'Vendor SLA Enforcement',
        category: 'Vendor',
        summary: 'Monitor response-time drift, automatically escalate SLA violations, and keep vendors accountable.',
        impactValue: '$2–8k/mo',
        cycleTimeValue: '1–3 days',
        confidenceValue: '84%',
        recommendedFor: 'Recurring delays + repeat tickets',
      },
      {
        id: 'lib-3',
        title: 'Utility Consumption Audit',
        category: 'Utilities',
        summary: 'Find usage variance clusters and drive field actions to reduce drift and resident complaints.',
        impactValue: '$3–12k/mo',
        cycleTimeValue: '2–6 days',
        confidenceValue: '79%',
        recommendedFor: 'Elevated variance + billing noise',
      },
      {
        id: 'lib-4',
        title: 'Water Intrusion Response',
        category: 'Risk',
        summary: 'Prioritize envelope inspections when leak patterns cluster; prevents costly rework and mold risk.',
        impactValue: 'Avoid $40–180k',
        cycleTimeValue: '3–14 days',
        confidenceValue: '91%',
        recommendedFor: 'Repeat leaks + winter seasonality',
      },
      {
        id: 'lib-5',
        title: 'Lease Audit Automation',
        category: 'Revenue',
        summary: 'Automate lease compliance checks to reduce loss-to-lease and capture missing charges.',
        impactValue: '$8–30k/mo',
        cycleTimeValue: '1–2 days',
        confidenceValue: '86%',
        recommendedFor: 'High LTL + inconsistent lease data',
      },
      {
        id: 'lib-6',
        title: 'Capital Renewal Triage',
        category: 'CapEx',
        summary: 'Prioritize property-wide repair programs based on incident patterns + ROI guardrails.',
        impactValue: '$20–60k/mo',
        cycleTimeValue: '7–21 days',
        confidenceValue: '82%',
        recommendedFor: 'Backlog + aging systems',
      },
    ],
    []
  )

  const filteredLibrary = useMemo(() => {
    if (quickFilter === 'All') return libraryCards
    const q = quickFilter.toLowerCase()
    return libraryCards.filter((c) => (c.title + ' ' + c.summary + ' ' + c.category).toLowerCase().includes(q.split(' ')[0] ?? ''))
  }, [libraryCards, quickFilter])

  const recommendedWorkflow = useMemo(() => {
    const text = joyDraft.trim().toLowerCase()
    if (!text) return null
    const pick =
      text.includes('turn') || text.includes('make ready')
        ? 'Turn Time Compression Workflow'
        : text.includes('vendor') || text.includes('sla')
          ? 'Vendor SLA Enforcement'
          : text.includes('loss to lease') || text.includes('lease')
            ? 'Lease Audit Automation'
            : text.includes('water') || text.includes('intrusion') || text.includes('leak')
              ? 'Water Intrusion Response'
              : text.includes('utility') || text.includes('consumption')
                ? 'Utility Consumption Audit'
                : 'Capital Renewal Triage'

    const found = libraryCards.find((c) => c.title === pick) ?? libraryCards[0] ?? null
    if (!found) return null

    const reason =
      pick === 'Turn Time Compression Workflow'
        ? 'You’re asking about turn time. This workflow reduces vacancy days by assigning next actions when ready-date drift starts.'
        : pick === 'Vendor SLA Enforcement'
          ? 'You mentioned vendors/SLA. This workflow escalates drift and prevents waiting statuses from compounding.'
          : pick === 'Lease Audit Automation'
            ? 'You’re asking about loss-to-lease. This workflow flags leakage patterns and batches daily review for quick wins.'
            : pick === 'Water Intrusion Response'
              ? 'You mentioned water/leaks. This workflow prioritizes envelope inspections when leak patterns cluster.'
              : pick === 'Utility Consumption Audit'
                ? 'You’re asking about utilities. This workflow finds variance clusters and drives field actions to reduce drift.'
                : 'This workflow is a good default when you’re optimizing property-wide maintenance and renewal decisions.'

    return { card: found, reason }
  }, [joyDraft, libraryCards])

  const topMetrics = useMemo(() => {
    const activeWorkflows = activeCards.length
    const actionsPending = activeCards.filter((c) => c.dueLabel.toLowerCase() !== 'waiting').length
    const estSavingsUsd = activeCards.reduce((acc, c) => acc + (c.estSavingsUsd ?? 0), 0)
    const hoursSaved = activeCards.reduce((acc, c) => acc + (c.hoursSaved ?? 0), 0)
    const totalRuns = completedCards.reduce((acc, c) => acc + c.runs, 0)
    const successfulRuns = completedCards.reduce((acc, c) => acc + c.successfulRuns, 0)
    const successRate = totalRuns > 0 ? clamp((successfulRuns / totalRuns) * 100, 0, 100) : null

    return {
      activeWorkflows,
      actionsPending,
      estSavingsLabel: formatCompactCurrency(estSavingsUsd),
      hoursSavedLabel: `${hoursSaved}h`,
      successRateLabel: successRate == null ? '—' : `${Math.round(successRate)}%`,
    }
  }, [activeCards, completedCards])

  const TopMetric = ({
    label,
    value,
    helper,
  }: {
    label: string
    value: string
    helper: string
  }) => (
    <Paper withBorder radius="lg" p="lg">
      <Stack gap={4}>
        <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
          {label}
        </Text>
        <Text fw={900} size="xl">
          {value}
        </Text>
        <Text size="xs" c="dimmed">
          {helper}
        </Text>
      </Stack>
    </Paper>
  )

  const ActiveCard = ({ c }: { c: WorkflowCard }) => {
    const accent = c.accent === 'teal' ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-blue-6)'
    const chipBg = `color-mix(in oklab, ${accent} 16%, var(--mantine-color-body))`
    const chipBorder = `color-mix(in oklab, ${accent} 35%, var(--mantine-color-default-border))`

    const bars = Array.from({ length: c.stepsTotal }).map((_, idx) => {
      const active = idx < c.stepsDone
      return (
        <Box
          key={idx}
          style={{
            height: 8,
            borderRadius: 999,
            background: active ? accent : 'var(--mantine-color-default-hover)',
            flex: 1,
          }}
        />
      )
    })

    return (
      <Paper withBorder radius="lg" p="lg">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <Stack gap="sm" style={{ minWidth: 0, flex: 1 }}>
            <Group gap="sm" wrap="wrap">
              <Badge
                size="sm"
                variant="light"
                radius="xl"
                style={{
                  background: chipBg,
                  border: `1px solid ${chipBorder}`,
                }}
              >
                {c.status}
              </Badge>
              <Badge size="sm" variant="light" radius="xl">
                {c.category}
              </Badge>
            </Group>

            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Text fw={900} size="lg" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.title}
              </Text>
              <Stack gap={0} align="flex-end">
                <Text fw={900} size="lg">
                  {c.impactValue.split(' ')[0]}
                </Text>
                <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                  {c.impactLabel}
                </Text>
              </Stack>
            </Group>

            <Text size="sm" c="dimmed">
              {c.triggerLabel}
            </Text>

            <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
              Step {c.stepsDone} of {c.stepsTotal}
            </Text>

            <Group gap={8} wrap="nowrap" align="center">
              <Group gap={6} wrap="nowrap" style={{ flex: 1 }}>
                {bars}
              </Group>
              <Text size="sm" fw={900} c="dimmed" style={{ width: 44, textAlign: 'right' }}>
                {c.progressPct}%
              </Text>
            </Group>

            <Divider />

            <Group justify="space-between" align="center">
              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                  Next action
                </Text>
                <Text fw={900} size="sm">
                  {c.nextActionLabel}
                </Text>
              </Stack>
              <Stack gap={2} align="flex-end">
                <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                  Due date
                </Text>
                <Text fw={900} size="sm" style={{ color: c.dueLabel.toLowerCase().includes('today') ? 'var(--mantine-color-red-7)' : 'var(--mantine-color-text)' }}>
                  {c.dueLabel}
                </Text>
              </Stack>
            </Group>
          </Stack>
        </Group>
      </Paper>
    )
  }

  const CompletedCard = ({ c }: { c: CompletedWorkflowCard }) => {
    return (
      <Paper withBorder radius="lg" p="lg">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
          <Stack gap="xs" style={{ minWidth: 0, flex: 1 }}>
            <Group justify="space-between" align="center">
              <Badge size="sm" variant="light" radius="xl" color="gray">
                COMPLETED
              </Badge>
              <Group gap={6} wrap="nowrap">
                <Box
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    border: '1px solid var(--mantine-color-default-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--mantine-color-dimmed)',
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {c.owner.slice(0, 1).toUpperCase()}
                </Box>
                <Text size="xs" c="dimmed" fw={700}>
                  {c.owner}
                </Text>
              </Group>
            </Group>

            <Text fw={900} size="lg">
              {c.title}
            </Text>

            <SimpleGrid cols={2} spacing="sm">
              <Paper withBorder radius="md" p="sm" style={{ background: 'color-mix(in oklab, var(--mantine-color-teal-6) 6%, var(--mantine-color-body))' }}>
                <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                  {c.impactLeftLabel}
                </Text>
                <Text fw={900} size="lg" style={{ color: 'var(--mantine-color-success-7)' }}>
                  {c.impactLeftValue}
                </Text>
                <Text size="xs" c="dimmed">
                  {c.impactLeftHelper}
                </Text>
              </Paper>
              <Paper withBorder radius="md" p="sm">
                <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                  {c.impactRightLabel}
                </Text>
                <Text fw={900} size="lg">
                  {c.impactRightValue}
                </Text>
                <Text size="xs" c="dimmed">
                  {c.impactRightHelper}
                </Text>
              </Paper>
            </SimpleGrid>

            <Group justify="space-between" mt="sm">
              <Group gap={8}>
                <Box style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--mantine-color-success-6)' }} />
                <Text size="sm" c="dimmed">
                  Successfully executed
                </Text>
              </Group>
              <Button variant="subtle" size="sm" rightSection={<HugeiconsIcon icon={ArrowRight01Icon} size={14} />}>
                View report
              </Button>
            </Group>
          </Stack>
        </Group>
      </Paper>
    )
  }

  const LibraryCard = ({ c }: { c: LibraryWorkflowCard }) => {
    return (
      <Paper withBorder radius="lg" p="lg">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={4} style={{ minWidth: 0 }}>
              <Text fw={900} size="md" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.title}
              </Text>
              <Text size="xs" c="dimmed">
                {c.category}
              </Text>
            </Stack>
            <Badge variant="light" radius="xl">
              {c.confidenceValue}
            </Badge>
          </Group>

          <Text size="sm" c="dimmed" lineClamp={3}>
            {c.summary}
          </Text>

          <SimpleGrid cols={3} spacing="xs">
            <Paper withBorder radius="md" p="xs">
              <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                Impact
              </Text>
              <Text fw={900} size="sm">
                {c.impactValue}
              </Text>
            </Paper>
            <Paper withBorder radius="md" p="xs">
              <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                Cycle
              </Text>
              <Text fw={900} size="sm">
                {c.cycleTimeValue}
              </Text>
            </Paper>
            <Paper withBorder radius="md" p="xs">
              <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                Fit
              </Text>
              <Text fw={900} size="sm">
                Good
              </Text>
            </Paper>
          </SimpleGrid>

          <Text size="xs" c="dimmed">
            Recommended for: <Text component="span" fw={700}>{c.recommendedFor}</Text>
          </Text>

          <Group justify="space-between" mt={4}>
            <Button variant="light" leftSection={<HugeiconsIcon icon={Rocket01Icon} size={16} />}>
              Execute workflow
            </Button>
            <Button variant="subtle" rightSection={<HugeiconsIcon icon={ArrowRight01Icon} size={14} />}>
              View details
            </Button>
          </Group>
        </Stack>
      </Paper>
    )
  }

  return (
    <InsightsPageShell title="Workflows" hideHeaderFilters>
      <Stack gap="lg">
        {/* Top metrics */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="lg">
          <TopMetric label="Active workflows" value={String(topMetrics.activeWorkflows)} helper="Currently running or waiting" />
          <TopMetric label="Actions pending" value={String(topMetrics.actionsPending)} helper="Due now / this week" />
          <TopMetric label="Est savings" value={topMetrics.estSavingsLabel} helper="Estimated value captured" />
          <TopMetric label="Hours saved" value={topMetrics.hoursSavedLabel} helper="Time recovered for onsite teams" />
          <TopMetric label="Success rate" value={topMetrics.successRateLabel} helper="Across completed workflow runs" />
        </SimpleGrid>

        {/* Embedded JoyAI builder */}
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Paper withBorder radius="lg" p="lg">
            <Group gap="sm" align="center" mb="sm">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  background: 'color-mix(in oklab, var(--mantine-color-purple-6) 14%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <JoyAiIcon size={18} alt="JOYAI" />
              </Box>
              <Stack gap={0}>
                <Text fw={900}>JoyAI Assistant</Text>
                <Text size="xs" c="dimmed">
                  Ask Joy to build or optimize workflows (demo)
                </Text>
              </Stack>
            </Group>

            <Group gap="xs" mb="sm" wrap="wrap">
              {[
                'Build Turn Time Workflow',
                'Show Active Workflows',
                'Optimize Vendor SLA setup',
                'Reduce Loss to Lease workflows',
              ].map((p) => (
                <Badge
                  key={p}
                  variant="light"
                  radius="xl"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setJoyDraft(p)
                    setJoyFocusKey((k) => k + 1)
                  }}
                >
                  {p}
                </Badge>
              ))}
            </Group>

            <Box style={{ height: 360 }}>
              <JoyAiChatWindow
                mode="workflows"
                draft={joyDraft}
                onDraftChange={setJoyDraft}
                focusKey={joyFocusKey}
                showHeader={false}
              />
            </Box>
          </Paper>

          <Paper
            withBorder
            radius="lg"
            p="lg"
            style={{
              height: 360 + 28 + 14 + 36, // match chat card visual height (header+chips+chat)
              background: 'color-mix(in oklab, var(--mantine-color-purple-6) 4%, var(--mantine-color-body))',
            }}
          >
            <Stack gap="sm" style={{ height: '100%' }}>
              <Group gap="sm" align="center" justify="space-between">
                <Group gap="sm" align="center">
                  <Box
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 10,
                      background: 'color-mix(in oklab, var(--mantine-color-purple-6) 14%, transparent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <JoyAiIcon size={16} alt="JOYAI" />
                  </Box>
                  <Stack gap={0}>
                    <Text fw={900} size="sm">
                      Recommended workflow
                    </Text>
                    <Text size="xs" c="dimmed">
                      Updates as you type
                    </Text>
                  </Stack>
                </Group>
                <Badge variant="light" radius="xl">
                  Library
                </Badge>
              </Group>

              {!recommendedWorkflow ? (
                <Stack gap={6} style={{ flex: 1 }} justify="center" align="center">
                  <Text fw={900} ta="center">
                    Start typing to get a recommendation
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Try “Optimize vendor SLA setup” or “Build turn time workflow”.
                  </Text>
                </Stack>
              ) : (
                <>
                  <Paper withBorder radius="md" p="md" style={{ background: 'var(--mantine-color-body)' }}>
                    <Stack gap={6}>
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Stack gap={2} style={{ minWidth: 0 }}>
                          <Text fw={900} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {recommendedWorkflow.card.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {recommendedWorkflow.card.category}
                          </Text>
                        </Stack>
                        <Badge variant="light" radius="xl">
                          {recommendedWorkflow.card.confidenceValue}
                        </Badge>
                      </Group>

                      <Text size="sm" c="dimmed" lineClamp={3}>
                        {recommendedWorkflow.reason}
                      </Text>

                      <SimpleGrid cols={2} spacing="xs" mt={4}>
                        <Paper withBorder radius="md" p="xs">
                          <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                            Impact
                          </Text>
                          <Text fw={900} size="sm">
                            {recommendedWorkflow.card.impactValue}
                          </Text>
                        </Paper>
                        <Paper withBorder radius="md" p="xs">
                          <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                            Cycle
                          </Text>
                          <Text fw={900} size="sm">
                            {recommendedWorkflow.card.cycleTimeValue}
                          </Text>
                        </Paper>
                      </SimpleGrid>
                    </Stack>
                  </Paper>

                  <Box style={{ flex: 1 }} />

                  <Group justify="space-between">
                    <Button variant="light" leftSection={<HugeiconsIcon icon={Rocket01Icon} size={16} />}>
                      Execute
                    </Button>
                    <Button variant="subtle" rightSection={<HugeiconsIcon icon={ArrowRight01Icon} size={14} />}>
                      View details
                    </Button>
                  </Group>
                </>
              )}
            </Stack>
          </Paper>
        </SimpleGrid>

        {/* Library header + tabs */}
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="sm" align="center">
              <HugeiconsIcon icon={ChartLineData02Icon} size={18} />
              <Text fw={900}>Workflows</Text>
              <Badge variant="light" radius="xl">
                {view === 'active' ? activeCards.length : view === 'completed' ? completedCards.length : libraryCards.length}
              </Badge>
            </Group>
          </Group>

          <Group justify="space-between" align="center" wrap="wrap">
            <SegmentedControl
              value={view}
              onChange={(v) => setView(v as WorkflowState)}
              data={[
                { label: 'Active', value: 'active' },
                { label: 'Completed', value: 'completed' },
                { label: 'Library', value: 'library' },
              ]}
            />

            <Group gap={8} wrap="wrap" align="center">
              <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                Quick filters:
              </Text>
              <SegmentedControl
                value={quickFilter}
                onChange={(v) => setQuickFilter(v as typeof quickFilter)}
                data={['All', 'Reduce Loss to Lease', 'Turn Time Recovery', 'Vendor SLA', 'DD Risk']}
              />
            </Group>
          </Group>
        </Stack>

        {view === 'active' && (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {activeCards.map((c) => (
              <ActiveCard key={c.id} c={c} />
            ))}
          </SimpleGrid>
        )}

        {view === 'completed' && (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {completedCards.map((c) => (
              <CompletedCard key={c.id} c={c} />
            ))}
          </SimpleGrid>
        )}

        {view === 'library' && (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
            {filteredLibrary.map((c) => (
              <LibraryCard key={c.id} c={c} />
            ))}
          </SimpleGrid>
        )}

        <Text size="xs" c="dimmed">
          {loadingProps ? 'Loading property names…' : `Using sample context from ${propertyNames.length ? 'your property list' : 'demo properties'}.`}
        </Text>
      </Stack>
    </InsightsPageShell>
  )
}
