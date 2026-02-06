import { useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, Divider, Group, Paper, SegmentedControl, SimpleGrid, Slider, Stack, Switch, Tabs, Text } from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  ChartLineData02Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  Rocket01Icon,
  Shield01Icon,
  TimeScheduleIcon,
} from '@hugeicons/core-free-icons'
import { supabaseMetrics } from '../lib/supabaseMetrics'
import { JoyAiChatWindow } from '../theme/components/JoyAiChatWindow'
import { JoyAiIcon } from '../theme/components/JoyAiIcon'
import { UnavailableOutline } from '../theme/components/UnavailableOutline'
import { InlineEditorDrawer } from '../theme/components/HpyDrawer'
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

type WorkflowDrawerStatus = 'Active' | 'Complete'
type WorkflowDrawerData = {
  id: string
  title: string
  confidencePct: number
  sources: string[]
  triggeredBy: string
  status: WorkflowDrawerStatus
  runningSinceLabel?: string
  progressPct?: number
  stepIndex?: number
  stepsTotal?: number
  currentPhaseTitle?: string
}

function inferSources(title: string): string[] {
  const t = title.toLowerCase()
  if (t.includes('vendor') || t.includes('sla')) return ['Work orders', 'Invoices']
  if (t.includes('lease') || t.includes('rent')) return ['Leases', 'Rent roll']
  if (t.includes('utility') || t.includes('thermostat')) return ['Utility bills', 'Work orders']
  if (t.includes('water') || t.includes('envelope') || t.includes('intrusion')) return ['Work orders', 'Inspections']
  if (t.includes('winter')) return ['Work orders', 'Weather feed']
  return ['Work orders']
}

function inferTriggeredBy(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('sla') || t.includes('vendor')) return 'Turn Time Bottleneck'
  if (t.includes('envelope') || t.includes('water') || t.includes('intrusion')) return 'Water Intrusion Clustering'
  if (t.includes('lease')) return 'Charge leakage detection'
  if (t.includes('turn time')) return 'Ready-date drift flagged'
  if (t.includes('utility') || t.includes('thermostat')) return 'Usage variance cluster'
  if (t.includes('winter')) return 'Freeze risk threshold crossed'
  return 'Benchmark drift detected'
}

function hashStringToUint32(input: string): number {
  // FNV-1a 32-bit
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function formatMonthDayYear(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}

function buildWorkflowOutcomes(seedKey: string, status: WorkflowDrawerStatus) {
  const seed = hashStringToUint32(`outcomes:${seedKey}`)
  const projectedUsd = 10_000
  const realizedUsd = status === 'Complete' ? 11_500 + (seed % 11_500) : 5_500 + (seed % 8_500)
  const evidenceScore = 86 + (seed % 14) // 86..99

  const beforeCompliance = 78 + (seed % 13) // 78..90
  const beforeVariance = 10 + (seed % 9) // 10..18

  const currentComplianceRaw =
    status === 'Complete' ? beforeCompliance + (7 + (seed % 9)) : beforeCompliance + (3 + (seed % 7))
  const currentCompliance = clamp(currentComplianceRaw, 80, 99)

  const currentVarianceRaw =
    status === 'Complete' ? beforeVariance - (5 + (seed % 6)) : beforeVariance - (2 + (seed % 4))
  const currentVariance = clamp(currentVarianceRaw, 1, 14)

  return {
    realizedUsd,
    projectedUsd,
    evidenceScore,
    beforeCompliance,
    beforeVariance,
    currentCompliance,
    currentVariance,
  }
}

type WorkflowConfig = {
  runMode: 'suggest' | 'auto'
  confidenceThresholdPct: number
  requireManagerApproval: boolean
  notifyOnDue: boolean
  cooldownDays: number
}

function buildWorkflowConfig(args: { seedKey: string; triggeredBy: string; status: WorkflowDrawerStatus }): WorkflowConfig {
  const seed = hashStringToUint32(`cfg:${args.seedKey}`)
  const trigger = args.triggeredBy.toLowerCase()

  const autoPreferred =
    trigger.includes('lease') || trigger.includes('utility') || trigger.includes('usage') || trigger.includes('vendor') || trigger.includes('sla')

  const runMode: WorkflowConfig['runMode'] =
    args.status === 'Complete'
      ? autoPreferred
        ? 'auto'
        : 'suggest'
      : autoPreferred && seed % 3 !== 0
        ? 'auto'
        : 'suggest'

  const confidenceThresholdPct = clamp(78 + (seed % 14), 70, 92)
  const requireManagerApproval = runMode === 'auto' ? seed % 4 !== 0 : seed % 2 === 0
  const notifyOnDue = seed % 5 !== 0
  const cooldownDays = [7, 14, 21][seed % 3] ?? 14

  return { runMode, confidenceThresholdPct, requireManagerApproval, notifyOnDue, cooldownDays }
}

function inferRunningSinceLabel(seedKey: string): string {
  // Deterministic-ish "started" date for demo cards.
  const daysAgo = 7 + (hashStringToUint32(seedKey) % 75) // 7..81 days ago
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return formatMonthDayYear(d)
}

type WorkflowTimelineStepTone = 'done' | 'active' | 'upcoming'
type WorkflowTimelineStep = {
  title: string
  subtitle: string
  tone: WorkflowTimelineStepTone
  rightLabel: string
  rightBadge?: { label: string; color: 'yellow' | 'gray' | 'blue' | 'green' }
}

function formatMonthDay(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

function buildWorkflowTimeline(args: {
  seedKey: string
  triggeredBy: string
  stepIndex: number
  stepsTotal: number
}): { currentPhaseTitle: string; progressPct: number; steps: WorkflowTimelineStep[] } {
  const seed = hashStringToUint32(args.seedKey)
  const stepsTotal = Math.max(3, args.stepsTotal)
  // Allow stepIndex === stepsTotal + 1 to represent "completed".
  const stepIndex = clamp(args.stepIndex, 1, stepsTotal + 1)
  const isComplete = stepIndex > stepsTotal

  const templates =
    args.triggeredBy.toLowerCase().includes('turn time') || args.triggeredBy.toLowerCase().includes('ready')
      ? [
          { title: 'Detect variance', who: 'Automated' },
          { title: 'Manager approval', who: 'Sarah J.' },
          { title: 'Generate notice', who: 'Automated' },
          { title: 'Vendor acknowledgment', who: seed % 2 === 0 ? 'Ace Carpentry' : 'ServiceMaster' },
          { title: 'Apply deduction', who: 'Finance' },
        ]
      : args.triggeredBy.toLowerCase().includes('water') || args.triggeredBy.toLowerCase().includes('intrusion')
        ? [
            { title: 'Detect clustering', who: 'Automated' },
            { title: 'Create inspection scope', who: 'Automated' },
            { title: 'Manager approval', who: 'Facilities' },
            { title: 'Schedule vendor', who: seed % 2 === 0 ? 'RoofPro LLC' : 'AquaSeal' },
            { title: 'Close out + document', who: 'Automated' },
          ]
        : args.triggeredBy.toLowerCase().includes('usage') || args.triggeredBy.toLowerCase().includes('utility')
          ? [
              { title: 'Detect usage drift', who: 'Automated' },
              { title: 'Validate meter data', who: 'Automated' },
              { title: 'Manager approval', who: 'Ops Lead' },
              { title: 'Field verification', who: 'Onsite Team' },
              { title: 'Issue credits', who: 'Billing' },
            ]
          : [
              { title: 'Detect variance', who: 'Automated' },
              { title: 'Review policy', who: 'Operations' },
              { title: 'Manager approval', who: 'Regional' },
              { title: 'Execute action', who: 'Automated' },
              { title: 'Verify outcome', who: 'Automated' },
            ]

  const picked = templates.slice(0, stepsTotal)
  const now = new Date()
  const dayOffset = (n: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + n)
    return d
  }

  const doneCount = isComplete ? stepsTotal : Math.max(0, stepIndex - 1)
  const progressPct = Math.round((doneCount / stepsTotal) * 100)
  const currentPhaseTitle = isComplete ? 'Workflow complete' : (picked[stepIndex - 1]?.title ?? 'Current phase')

  const completedOn = isComplete ? dayOffset(-(2 + (seed % 28))) : null

  const steps: WorkflowTimelineStep[] = picked.map((s, i) => {
    const idx = i + 1
    const tone: WorkflowTimelineStepTone = isComplete
      ? 'done'
      : idx < stepIndex
        ? 'done'
        : idx === stepIndex
          ? 'active'
          : 'upcoming'
    const subtitle = `${idx}. ${s.who}`
    if (tone === 'done') {
      if (completedOn) {
        const d = new Date(completedOn)
        d.setDate(d.getDate() - (stepsTotal - idx) * 2)
        const isFinal = idx === stepsTotal
        return {
          title: s.title,
          subtitle,
          tone,
          rightLabel: formatMonthDay(d),
          rightBadge: isFinal ? { label: 'Completed', color: 'green' } : undefined,
        }
      }
      // A couple days back, compact month/day.
      const daysBack = Math.min(9, doneCount - (idx - 1))
      return { title: s.title, subtitle, tone, rightLabel: formatMonthDay(dayOffset(-daysBack)) }
    }
    if (tone === 'active') {
      return { title: s.title, subtitle, tone, rightLabel: 'Due Today', rightBadge: { label: 'Due Today', color: 'yellow' } }
    }
    // Upcoming
    const daysAhead = 3 + ((seed + idx) % 8)
    return { title: s.title, subtitle, tone, rightLabel: formatMonthDay(dayOffset(daysAhead)) }
  })

  return { currentPhaseTitle, progressPct, steps }
}

export function HpmWorkflowsPage() {
  const [propertyNames, setPropertyNames] = useState<string[]>([])
  const [loadingProps, setLoadingProps] = useState(true)
  const unavailable = true // workflow automation metrics are demo placeholders for now

  const [view, setView] = useState<WorkflowState>('active')
  const [quickFilter, setQuickFilter] = useState<'All' | 'Reduce Loss to Lease' | 'Turn Time Recovery' | 'Vendor SLA' | 'DD Risk'>('All')
  const [joyDraft, setJoyDraft] = useState('')
  const [joyFocusKey, setJoyFocusKey] = useState(0)

  const [drawerWorkflow, setDrawerWorkflow] = useState<WorkflowDrawerData | null>(null)
  const [drawerTab, setDrawerTab] = useState<'timeline' | 'outcomes' | 'configuration'>('timeline')

  const openDrawer = (data: WorkflowDrawerData) => {
    setDrawerTab('timeline')
    setDrawerWorkflow(data)
  }

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
    <UnavailableOutline unavailable={unavailable} radius={16}>
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
    </UnavailableOutline>
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

    const onOpen = () => {
      const triggeredBy = c.triggerLabel.replace(/^Trigger:\s*/i, '').trim() || inferTriggeredBy(c.title)
      const confidencePct = clamp(Math.round(72 + c.progressPct * 0.32), 60, 96)
      openDrawer({
        id: c.id,
        title: c.title,
        confidencePct,
        sources: inferSources(c.title),
        triggeredBy,
        status: 'Active',
        runningSinceLabel: inferRunningSinceLabel(c.id),
        progressPct: c.progressPct,
        stepIndex: c.stepsDone,
        stepsTotal: c.stepsTotal,
        currentPhaseTitle: c.nextActionLabel,
      })
    }

    return (
      <UnavailableOutline unavailable={unavailable} radius={16}>
        <Paper
          withBorder
          radius="lg"
          p="lg"
          onClick={onOpen}
          style={{ cursor: 'pointer' }}
        >
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
      </UnavailableOutline>
    )
  }

  const CompletedCard = ({ c }: { c: CompletedWorkflowCard }) => {
    const onOpen = () => {
      const ratio = c.runs > 0 ? c.successfulRuns / c.runs : 1
      const confidencePct = clamp(Math.round(70 + ratio * 28), 60, 99)
      openDrawer({
        id: c.id,
        title: c.title,
        confidencePct,
        sources: inferSources(c.title),
        triggeredBy: inferTriggeredBy(c.title),
        status: 'Complete',
      })
    }

    return (
      <UnavailableOutline unavailable={unavailable} radius={16}>
        <Paper
          withBorder
          radius="lg"
          p="lg"
          onClick={onOpen}
          style={{ cursor: 'pointer' }}
        >
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
      </UnavailableOutline>
    )
  }

  const LibraryCard = ({ c }: { c: LibraryWorkflowCard }) => {
    return (
      <UnavailableOutline unavailable={unavailable} radius={16}>
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
      </UnavailableOutline>
    )
  }

  return (
    <>
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

      <InlineEditorDrawer
        opened={drawerWorkflow != null}
        onClose={() => setDrawerWorkflow(null)}
        withCloseButton
        size={560}
        title={
          drawerWorkflow ? (
            <Stack gap="xs">
              <Text fw={700} size="xl">
                {drawerWorkflow.title}
              </Text>
              <Group gap="sm" wrap="wrap">
                <Badge size="sm" variant="light" color="green" radius="xl">
                  {drawerWorkflow.confidencePct}% Confidence
                </Badge>
                <Badge size="sm" variant="light" color={drawerWorkflow.status === 'Active' ? 'blue' : 'gray'} radius="xl">
                  Status • {drawerWorkflow.status.toUpperCase()}
                </Badge>
              </Group>
            </Stack>
          ) : undefined
        }
        tabs={
          drawerWorkflow ? (
            <Stack gap="md">
              <Stack gap="xs">
                <Group gap="xs" align="center" wrap="wrap">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    SOURCES
                  </Text>
                  <Group gap="md" wrap="wrap">
                    {drawerWorkflow.sources.map((label) => (
                      <Group key={label} gap={6} wrap="nowrap">
                        <Box
                          w={8}
                          h={8}
                          style={{
                            borderRadius: '50%',
                            backgroundColor: 'var(--mantine-color-green-6)',
                          }}
                        />
                        <Text size="sm" fw={500}>
                          {label}
                        </Text>
                      </Group>
                    ))}
                  </Group>
                </Group>

                <Group gap="xs" align="center">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    TRIGGERED BY
                  </Text>
                  <Text size="sm" fw={600}>
                    {drawerWorkflow.triggeredBy}
                  </Text>
                </Group>

                <Group gap="xs" align="center">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    STATUS
                  </Text>
                  <Text size="sm" fw={600}>
                    {drawerWorkflow.status}
                  </Text>
                </Group>
              </Stack>

              <Tabs value={drawerTab} onChange={(v) => setDrawerTab((v as typeof drawerTab) ?? 'timeline')}>
                <Tabs.List
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    backgroundColor: 'var(--mantine-color-body)',
                    borderBottom: '1px solid var(--mantine-color-default-border)',
                  }}
                >
                  <Tabs.Tab value="timeline">Timeline</Tabs.Tab>
                  <Tabs.Tab value="outcomes">Outcomes</Tabs.Tab>
                  <Tabs.Tab value="configuration">Configuration</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="timeline" pt="md">
                  {(() => {
                    const isActive = drawerWorkflow.status === 'Active'
                    const isComplete = drawerWorkflow.status === 'Complete'
                    if (!isActive && !isComplete) return <Box h={240} />

                    const stepsTotal = drawerWorkflow.stepsTotal ?? 5
                    const stepIndex = isComplete ? stepsTotal + 1 : (drawerWorkflow.stepIndex ?? 1)

                    const timeline = buildWorkflowTimeline({
                      seedKey: drawerWorkflow.id,
                      triggeredBy: drawerWorkflow.triggeredBy,
                      stepIndex,
                      stepsTotal,
                    })

                    const pct = isComplete ? 100 : (drawerWorkflow.progressPct ?? timeline.progressPct)
                    const currentPhaseTitle = isComplete ? 'Completed' : (drawerWorkflow.currentPhaseTitle ?? timeline.currentPhaseTitle)

                    return (
                      <Stack gap="lg">
                        <Paper withBorder radius="lg" p="lg">
                          <Group justify="space-between" align="flex-start" wrap="nowrap">
                            <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                              <Box
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 14,
                                  background: isComplete
                                    ? 'color-mix(in oklab, var(--mantine-color-success-6) 10%, transparent)'
                                    : 'color-mix(in oklab, var(--mantine-color-blue-6) 10%, transparent)',
                                  border: isComplete
                                    ? '1px solid color-mix(in oklab, var(--mantine-color-success-6) 18%, var(--mantine-color-default-border))'
                                    : '1px solid color-mix(in oklab, var(--mantine-color-blue-6) 18%, var(--mantine-color-default-border))',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flex: '0 0 auto',
                                }}
                              >
                                <HugeiconsIcon icon={ChartLineData02Icon} size={20} />
                              </Box>

                              <Stack gap={2} style={{ minWidth: 0 }}>
                                <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                                  Current phase
                                </Text>
                                <Text fw={900} size="lg" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  Step {Math.min(stepIndex, stepsTotal)} of {stepsTotal}: {currentPhaseTitle}
                                </Text>
                              </Stack>
                            </Group>

                            <Stack gap={2} align="flex-end">
                              <Text fw={900} style={{ fontSize: 44, lineHeight: 1 }}>
                                {pct}%
                              </Text>
                              <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                                Complete
                              </Text>
                            </Stack>
                          </Group>
                        </Paper>

                        <Stack gap={18}>
                          {timeline.steps.map((s, idx) => {
                            const isDone = s.tone === 'done'
                            const isNow = s.tone === 'active'
                            const accent =
                              isDone ? 'var(--mantine-color-success-6)' : isNow ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-default-border)'
                            const labelColor =
                              isDone ? 'var(--mantine-color-text)' : isNow ? 'var(--mantine-color-blue-7)' : 'var(--mantine-color-dimmed)'

                            return (
                              <Group key={`${s.title}-${idx}`} justify="space-between" align="flex-start" wrap="nowrap">
                                <Group gap="md" wrap="nowrap" align="flex-start" style={{ minWidth: 0 }}>
                                  <Box style={{ width: 44, display: 'flex', justifyContent: 'center' }}>
                                    <Box style={{ position: 'relative', width: 32, display: 'flex', justifyContent: 'center' }}>
                                      {idx !== timeline.steps.length - 1 && (
                                        <Box
                                          style={{
                                            position: 'absolute',
                                            top: 30,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: 3,
                                            height: 62,
                                            background: isDone ? 'var(--mantine-color-success-6)' : 'var(--mantine-color-default-border)',
                                            borderRadius: 999,
                                          }}
                                        />
                                      )}
                                      <Box
                                        style={{
                                          width: 32,
                                          height: 32,
                                          borderRadius: 999,
                                          border: `3px solid ${accent}`,
                                          background: isNow
                                            ? 'color-mix(in oklab, var(--mantine-color-blue-6) 10%, transparent)'
                                            : 'var(--mantine-color-body)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        {isDone ? (
                                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color="var(--mantine-color-success-6)" />
                                        ) : isNow ? (
                                          <HugeiconsIcon icon={CircleIcon} size={12} color="var(--mantine-color-blue-6)" />
                                        ) : (
                                          <HugeiconsIcon icon={CircleIcon} size={12} color="color-mix(in oklab, var(--mantine-color-text) 18%, transparent)" />
                                        )}
                                      </Box>
                                    </Box>
                                  </Box>

                                  <Stack gap={2} style={{ minWidth: 0 }}>
                                    <Text fw={900} size="lg" style={{ color: labelColor, lineHeight: 1.15 }}>
                                      {s.title}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                      {s.subtitle}
                                    </Text>
                                  </Stack>
                                </Group>

                                <Stack gap={6} align="flex-end" style={{ flex: '0 0 auto' }}>
                                  <Text size="sm" fw={700} c="dimmed">
                                    {s.rightLabel}
                                  </Text>
                                  {s.rightBadge ? (
                                    <Badge size="sm" variant="light" color={s.rightBadge.color} radius="sm">
                                      {s.rightBadge.label}
                                    </Badge>
                                  ) : null}
                                </Stack>
                              </Group>
                            )
                          })}
                        </Stack>
                      </Stack>
                    )
                  })()}
                </Tabs.Panel>
                <Tabs.Panel value="outcomes" pt="md">
                  {(() => {
                    if (!drawerWorkflow) return <Box h={240} />
                    const o = buildWorkflowOutcomes(drawerWorkflow.id, drawerWorkflow.status)

                    return (
                      <Stack gap="lg">
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                          <Paper
                            withBorder
                            radius="xl"
                            p="xl"
                            style={{
                              background: 'color-mix(in oklab, var(--mantine-color-success-6) 8%, var(--mantine-color-body))',
                              borderColor: 'color-mix(in oklab, var(--mantine-color-success-6) 20%, var(--mantine-color-default-border))',
                            }}
                          >
                            <Group gap="sm" align="center" mb="sm">
                              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="var(--mantine-color-success-7)" />
                              <Text size="sm" fw={900} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                                REALIZED IMPACT
                              </Text>
                            </Group>
                            <Text fw={900} style={{ fontSize: 40, lineHeight: 1.05 }}>
                              {formatUsd(o.realizedUsd)}
                            </Text>
                            <Text size="sm" c="dimmed" fw={700} mt={6}>
                              vs {formatUsd(o.projectedUsd)} Projected
                            </Text>
                          </Paper>

                          <Paper withBorder radius="xl" p="xl">
                            <Group gap="sm" align="center" mb="sm">
                              <HugeiconsIcon icon={Shield01Icon} size={18} color="var(--mantine-color-blue-7)" />
                              <Text
                                size="sm"
                                fw={900}
                                tt="uppercase"
                                style={{ letterSpacing: '0.08em', color: 'var(--mantine-color-blue-7)' }}
                              >
                                EVIDENCE SCORE
                              </Text>
                            </Group>
                            <Text fw={900} style={{ fontSize: 40, lineHeight: 1.05 }}>
                              {o.evidenceScore}/100
                            </Text>
                            <Text size="sm" c="dimmed" fw={600} mt={6}>
                              High fidelity data
                            </Text>
                          </Paper>
                        </SimpleGrid>

                        <Group gap="sm" align="center" mt={4}>
                          <HugeiconsIcon icon={TimeScheduleIcon} size={18} color="var(--mantine-color-dimmed)" />
                          <Text size="sm" fw={900} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                            BEFORE VS AFTER SNAPSHOT
                          </Text>
                        </Group>

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                          <Paper withBorder radius="xl" p="xl">
                            <Text size="sm" fw={900} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                              BEFORE WORKFLOW
                            </Text>
                            <Group justify="space-between" mt="md">
                              <Text fw={600}>Compliance</Text>
                              <Text fw={900}>{o.beforeCompliance}%</Text>
                            </Group>
                            <Group justify="space-between" mt="sm">
                              <Text fw={600}>Variance</Text>
                              <Text fw={900}>+{o.beforeVariance}%</Text>
                            </Group>
                          </Paper>

                          <Paper
                            withBorder
                            radius="xl"
                            p="xl"
                            style={{
                              background: 'color-mix(in oklab, var(--mantine-color-blue-6) 8%, var(--mantine-color-body))',
                              borderColor: 'color-mix(in oklab, var(--mantine-color-blue-6) 18%, var(--mantine-color-default-border))',
                            }}
                          >
                            <Text
                              size="sm"
                              fw={900}
                              tt="uppercase"
                              style={{ letterSpacing: '0.08em', color: 'var(--mantine-color-blue-7)' }}
                            >
                              CURRENT STATE
                            </Text>
                            <Group justify="space-between" mt="md">
                              <Text fw={600} style={{ color: 'var(--mantine-color-blue-7)' }}>
                                Compliance
                              </Text>
                              <Text fw={900} style={{ color: 'var(--mantine-color-success-7)' }}>
                                {o.currentCompliance}%
                              </Text>
                            </Group>
                            <Group justify="space-between" mt="sm">
                              <Text fw={600} style={{ color: 'var(--mantine-color-blue-7)' }}>
                                Variance
                              </Text>
                              <Text fw={900} style={{ color: 'var(--mantine-color-success-7)' }}>
                                {o.currentVariance}%
                              </Text>
                            </Group>
                          </Paper>
                        </SimpleGrid>
                      </Stack>
                    )
                  })()}
                </Tabs.Panel>
                <Tabs.Panel value="configuration" pt="md">
                  {(() => {
                    if (!drawerWorkflow) return <Box h={240} />
                    const cfg = buildWorkflowConfig({
                      seedKey: drawerWorkflow.id,
                      triggeredBy: drawerWorkflow.triggeredBy,
                      status: drawerWorkflow.status,
                    })

                    const disabled = true

                    return (
                      <Stack gap="lg">
                        <Text size="sm" c="dimmed">
                          Settings are read-only in this demo.
                        </Text>

                        <Paper withBorder radius="lg" p="lg">
                          <Stack gap="sm">
                            <Group justify="space-between" align="flex-start">
                              <Stack gap={2}>
                                <Text fw={900}>Run mode</Text>
                                <Text size="sm" c="dimmed">
                                  Choose whether this workflow suggests actions or runs automatically.
                                </Text>
                              </Stack>
                            </Group>
                            <SegmentedControl
                              value={cfg.runMode}
                              data={[
                                { label: 'Suggest only', value: 'suggest' },
                                { label: 'Auto-execute', value: 'auto' },
                              ]}
                              disabled={disabled}
                              fullWidth
                            />
                          </Stack>
                        </Paper>

                        <Paper withBorder radius="lg" p="lg">
                          <Stack gap="sm">
                            <Group justify="space-between" align="flex-start">
                              <Stack gap={2}>
                                <Text fw={900}>Confidence threshold</Text>
                                <Text size="sm" c="dimmed">
                                  Minimum confidence required to trigger actions.
                                </Text>
                              </Stack>
                              <Badge variant="light" radius="xl">
                                {cfg.confidenceThresholdPct}%
                              </Badge>
                            </Group>
                            <Slider
                              value={cfg.confidenceThresholdPct}
                              min={60}
                              max={99}
                              step={1}
                              disabled={disabled}
                              marks={[
                                { value: 70, label: '70' },
                                { value: 85, label: '85' },
                                { value: 95, label: '95' },
                              ]}
                            />
                          </Stack>
                        </Paper>

                        <Paper withBorder radius="lg" p="lg">
                          <Stack gap="sm">
                            <Text fw={900}>Approvals & notifications</Text>
                            <Group justify="space-between" align="center" wrap="nowrap">
                              <Stack gap={2} style={{ minWidth: 0 }}>
                                <Text fw={700}>Require manager approval</Text>
                                <Text size="sm" c="dimmed">
                                  Adds an approval step before execution.
                                </Text>
                              </Stack>
                              <Switch checked={cfg.requireManagerApproval} disabled={disabled} />
                            </Group>
                            <Divider />
                            <Group justify="space-between" align="center" wrap="nowrap">
                              <Stack gap={2} style={{ minWidth: 0 }}>
                                <Text fw={700}>Notify on due dates</Text>
                                <Text size="sm" c="dimmed">
                                  Sends reminders when a step is due.
                                </Text>
                              </Stack>
                              <Switch checked={cfg.notifyOnDue} disabled={disabled} />
                            </Group>
                          </Stack>
                        </Paper>

                        <Paper withBorder radius="lg" p="lg">
                          <Stack gap="xs">
                            <Text fw={900}>Cooldown</Text>
                            <Text size="sm" c="dimmed">
                              Prevents repeated triggers for the same pattern.
                            </Text>
                            <Group justify="space-between" align="center">
                              <Text fw={700}>Re-run after</Text>
                              <Badge variant="light" radius="xl">
                                {cfg.cooldownDays} days
                              </Badge>
                            </Group>
                          </Stack>
                        </Paper>
                      </Stack>
                    )
                  })()}
                </Tabs.Panel>
              </Tabs>
            </Stack>
          ) : undefined
        }
        footer={
          drawerWorkflow?.status === 'Active' ? (
            <Stack gap={6} style={{ width: '100%' }} align="flex-end">
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                Running since {drawerWorkflow.runningSinceLabel ?? '—'} · Actions are disabled in this demo
              </Text>
              <Group gap="sm" wrap="nowrap" justify="flex-end">
                <Button size="sm" variant="default" onClick={() => {}}>
                  Manage Access
                </Button>
                <Button size="sm" color="yellow" variant="filled" onClick={() => {}}>
                  Pause Workflow
                </Button>
              </Group>
            </Stack>
          ) : undefined
        }
        footerFlexProps={{ justify: 'flex-end', align: 'center', wrap: 'nowrap' }}
      />
    </>
  )
}
