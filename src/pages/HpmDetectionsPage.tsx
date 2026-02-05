import { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Group,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Timeline,
  UnstyledButton,
} from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ChartLineData02Icon,
  Home03Icon,
} from '@hugeicons/core-free-icons'
import { InlineEditorDrawer } from '../theme/components/HpyDrawer'
import { useInsightsPropertySelection } from '../contexts/InsightsPropertyContext'
import { useUnavailableHighlight } from '../contexts/UnavailableHighlightContext'
import { supabaseMetrics } from '../lib/supabaseMetrics'
import { InsightsPageShell } from './InsightsPageShell'

const DOT_BADGES = [
  { label: 'PMS', color: 'green' as const },
  { label: 'Work Orders', color: 'green' as const },
  { label: 'Inspections', color: 'green' as const },
  { label: 'DD', color: 'yellow' as const },
  { label: 'LFA', color: 'green' as const },
  { label: 'Happy Property', color: 'green' as const },
]

type Stats = {
  turnTime: string | null
  workOrderTat: string | null
  vendorResponse: string | null
  lossToLease: string | null
  utilityUsage: string | null
  delinquency: string | null
  renewalRisk: string | null
  condition: string | null
}

const HARDCODED_TURN_DAYS = 14.25

const STAT_LABELS: { key: keyof Stats; label: string }[] = [
  { key: 'turnTime', label: 'Turn Time' },
  { key: 'workOrderTat', label: 'Work Order TAT' },
  { key: 'vendorResponse', label: 'Vendor Response' },
  { key: 'lossToLease', label: 'Loss-to-Lease' },
  { key: 'utilityUsage', label: 'Utility Usage' },
  { key: 'delinquency', label: 'Delinquency' },
  { key: 'renewalRisk', label: 'Renewal Risk' },
  { key: 'condition', label: 'Condition' },
]

type RiskClusterStatus = 'Critical' | 'Warning' | 'Active'

const ACTIVE_RISK_CLUSTERS_TEMPLATE: Array<{
  title: string
  status: RiskClusterStatus
  units: number
  unitChange: string
  unitChangeColor: 'danger' | 'dimmed'
  trend: string
  trendColor: 'danger' | 'dimmed'
  footprint: string
  driver: string
  actionLabel: string
}> = [
  {
    title: 'Moisture Intrusion Group A',
    status: 'Critical',
    units: 42,
    unitChange: '+6',
    unitChangeColor: 'danger',
    trend: 'Accelerating',
    trendColor: 'danger',
    footprint: 'Vertical Stack (04 Tier)',
    driver: 'North-facing Facade Failure',
    actionLabel: 'Launch Envelope Inspection',
  },
  {
    title: 'HVAC Efficiency Drop',
    status: 'Warning',
    units: 15,
    unitChange: '+2',
    unitChangeColor: 'dimmed',
    trend: 'Stable',
    trendColor: 'dimmed',
    footprint: 'Bldgs 4, 5, 8',
    driver: 'AC-450 End of Life',
    actionLabel: 'Start HVAC PM Batch',
  },
  {
    title: 'Renovation Batch Q3',
    status: 'Active',
    units: 24,
    unitChange: '0',
    unitChangeColor: 'danger',
    trend: 'On Track',
    trendColor: 'dimmed',
    footprint: 'Floors 1-3',
    driver: 'Scheduled Turn-over',
    actionLabel: 'View Progress',
  },
]

type InsightCardData = {
  id: string
  category: string
  priority: string
  title: string
  keyImpact: string
  keyImpactLabel?: string
  completion: string
  completionTrend?: 'up'
  timeline: string
  progressLabel: string
  progressValue: number
  progressColor: 'red' | 'blue' | 'green'
  peerLabel: string
  isUnavailable: boolean
  /** Optional: 0–100 position for a benchmark marker (e.g. 50 = industry median at centre). */
  benchmarkPosition?: number
  /** Optional: label to show at the benchmark marker (e.g. '$25K'). */
  benchmarkLabel?: string
}

const INSIGHT_CARDS_BASE: Omit<InsightCardData, 'keyImpact' | 'completion' | 'timeline' | 'progressValue' | 'progressLabel' | 'peerLabel'>[] = [
  {
    id: 'turn-time',
    category: 'OPERATIONS',
    priority: 'HIGH PRIORITY',
    title: 'Turn Time Bottleneck',
    progressColor: 'red',
    isUnavailable: false,
  },
  {
    id: 'water-intrusion',
    category: 'RISK',
    priority: 'MEDIUM PRIORITY',
    title: 'Water Intrusion Clustering',
    progressColor: 'blue',
    isUnavailable: true,
  },
  {
    id: 'utility-drift',
    category: 'REVENUE',
    priority: 'MEDIUM PRIORITY',
    title: 'Utility Consumption Drift',
    progressColor: 'blue',
    isUnavailable: true,
  },
  {
    id: 'vendor-insurance',
    category: 'RISK',
    priority: 'HIGH PRIORITY',
    title: 'Vendor Insurance Compliance',
    progressColor: 'red',
    isUnavailable: true,
  },
]

function randomInRange(min: number, max: number, decimals = 0): number {
  const v = min + Math.random() * (max - min)
  return decimals === 0 ? Math.round(v) : Math.round(v * 10 ** decimals) / 10 ** decimals
}

function StatCard({
  title,
  value,
  isUnavailable,
}: {
  title: string
  value: string | null
  isUnavailable?: boolean
}) {
  const { highlightUnavailable } = useUnavailableHighlight()
  const useYellowBorder = isUnavailable && highlightUnavailable
  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      style={
        useYellowBorder
          ? { borderColor: 'var(--mantine-color-yellow-6)', borderWidth: 2 }
          : undefined
      }
    >
      <Text c="dimmed" tt="uppercase" fw={700} size="xs">
        {title}
      </Text>
      <Text fw={700} size="xl" mt={4}>
        {value ?? '—'}
      </Text>
    </Paper>
  )
}

function InsightCard({ data, onReview }: { data: InsightCardData; onReview?: (d: InsightCardData) => void }) {
  const { highlightUnavailable } = useUnavailableHighlight()
  const useYellowBorder = data.isUnavailable && highlightUnavailable
  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      style={
        useYellowBorder
          ? { borderColor: 'var(--mantine-color-yellow-6)', borderWidth: 2 }
          : undefined
      }
    >
      <Group justify="space-between" align="flex-start" mb="xs">
        <Stack gap={2}>
          <Group gap="sm" align="center" wrap="nowrap">
            <Text fw={700} size="lg">
              {data.title}
            </Text>
            <Badge
              size="sm"
              variant="light"
              color={
                data.priority === 'HIGH PRIORITY'
                  ? 'red'
                  : data.priority === 'MEDIUM PRIORITY'
                    ? 'yellow'
                    : 'gray'
              }
              radius="xl"
            >
              {data.priority === 'HIGH PRIORITY'
                ? 'High Priority'
                : data.priority === 'MEDIUM PRIORITY'
                  ? 'Medium Priority'
                  : 'Low Priority'}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {data.category}
          </Text>
        </Stack>
        <Button
          variant="light"
          size="sm"
          radius="md"
          rightSection={<HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
          onClick={() => onReview?.(data)}
        >
          Review
        </Button>
      </Group>
      <Group gap="md" mb="sm" wrap="wrap">
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {data.keyImpactLabel ?? 'ESTIMATED IMPACT'}
          </Text>
          <Text size="sm" c="warning" fw={600}>
            {data.keyImpact}
          </Text>
        </Stack>
        <Divider orientation="vertical" />
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            CONFIDENCE
          </Text>
          <Text size="sm" fw={700}>
            {data.completion}
          </Text>
        </Stack>
        <Divider orientation="vertical" />
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            TRIGGER
          </Text>
          <Text size="sm" fw={600}>
            {data.timeline}
          </Text>
        </Stack>
      </Group>
      <Stack gap={4}>
        <Text size="xs" c="dimmed">
          {data.progressLabel}
        </Text>
        <Group gap="sm" align="center">
          <Box style={{ position: 'relative', flex: 1 }}>
            <Progress
              value={data.progressValue}
              size="sm"
              radius="xl"
              color={data.progressColor === 'red' ? 'red' : 'warning'}
              style={{ width: '100%' }}
            />
            {data.benchmarkPosition != null && (
              <>
                <Box
                  style={{
                    position: 'absolute',
                    left: `${data.benchmarkPosition}%`,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    marginLeft: -1,
                    backgroundColor: 'var(--mantine-color-dark-3)',
                    borderRadius: 1,
                    pointerEvents: 'none',
                  }}
                  aria-hidden
                />
                {data.benchmarkLabel != null && (
                  <Text
                    size="xs"
                    c="dimmed"
                    style={{
                      position: 'absolute',
                      left: `${data.benchmarkPosition}%`,
                      top: '100%',
                      marginTop: 4,
                      transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    {data.benchmarkLabel}
                  </Text>
                )}
              </>
            )}
          </Box>
          <Text size="xs" c="dimmed">
            {data.peerLabel}
          </Text>
        </Group>
      </Stack>
    </Paper>
  )
}

const PLACEHOLDER_METRICS = {
  vendorResponse: () => `${randomInRange(19, 72)} hrs`,
  utilityUsage: () => {
    const pct = randomInRange(-10, 64, 1)
    return (pct >= 0 ? '+' : '') + pct + '%'
  },
  delinquency: () => randomInRange(0.5, 8, 1) + '%',
  renewalRisk: () => randomInRange(25, 70) + '%',
} as const

export function HpmDetectionsPage() {
  const { selectedPropertyIds, dateRange } = useInsightsPropertySelection()
  // `selectedPropertyIds` may be a new array each render (even when unchanged).
  // Depending on the raw array can cause effects to run in a tight loop (and freeze the UI),
  // especially when it is an empty array.
  const selectedPropertyIdsKey = selectedPropertyIds.join('|')
  const [reviewDrawerCard, setReviewDrawerCard] = useState<InsightCardData | null>(null)
  const [placeholderStats] = useState<Pick<Stats, 'vendorResponse' | 'utilityUsage' | 'delinquency' | 'renewalRisk'>>(
    () => ({
      vendorResponse: PLACEHOLDER_METRICS.vendorResponse(),
      utilityUsage: PLACEHOLDER_METRICS.utilityUsage(),
      delinquency: PLACEHOLDER_METRICS.delinquency(),
      renewalRisk: PLACEHOLDER_METRICS.renewalRisk(),
    })
  )
  const [stats, setStats] = useState<Stats>({
    turnTime: null,
    workOrderTat: null,
    vendorResponse: null,
    lossToLease: null,
    utilityUsage: null,
    delinquency: null,
    renewalRisk: null,
    condition: null,
  })
  const [loadingStats, setLoadingStats] = useState(false)
  const [propertyOptions, setPropertyOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    let mounted = true
    supabaseMetrics
      .from('properties')
      .select('property_id, name')
      .order('name')
      .then(({ data, error }) => {
        if (error || !mounted) return
        const list = (data ?? []).map((p) => ({
          value: p.property_id,
          label: p.name ?? 'Unknown property',
        }))
        setPropertyOptions(list)
      })
    return () => {
      mounted = false
    }
  }, [])

  const propertyNameById = useMemo(() => {
    const map = new Map<string, string>()
    propertyOptions.forEach((o) => map.set(o.value, o.label))
    return map
  }, [propertyOptions])

  const activeRiskClusters = useMemo(() => {
    return ACTIVE_RISK_CLUSTERS_TEMPLATE.map((template, i) => ({
      ...template,
      property: (selectedPropertyIds[i] && propertyNameById.get(selectedPropertyIds[i])) ?? '—',
    }))
  }, [selectedPropertyIds, propertyNameById])

  useEffect(() => {
    if (selectedPropertyIds.length === 0) {
      setStats({
        turnTime: null,
        workOrderTat: null,
        vendorResponse: null,
        lossToLease: null,
        utilityUsage: null,
        delinquency: null,
        renewalRisk: null,
        condition: null,
      })
      return
    }

    let mounted = true
    setLoadingStats(true)
    const { startDate, endDate } = dateRange

    const queries = [
      supabaseMetrics
        .from('make_ready_turns')
        .select('property_id, move_out_date, ready_date')
        .in('property_id', selectedPropertyIds)
        .gte('move_out_date', startDate)
        .lte('move_out_date', endDate)
        .not('ready_date', 'is', null),
      supabaseMetrics
        .from('work_orders')
        .select('property_id, created_on, completed_on')
        .in('property_id', selectedPropertyIds)
        .gte('created_on', startDate)
        .lte('created_on', endDate)
        .not('completed_on', 'is', null),
      supabaseMetrics
        .from('property_condition_scores')
        .select('property_id, score_value, score_date')
        .in('property_id', selectedPropertyIds)
        .eq('score_type', 'Overall')
        .gte('score_date', startDate)
        .lte('score_date', endDate),
      supabaseMetrics
        .from('rent_snapshots')
        .select('avg_asking_rent, avg_effective_rent')
        .in('property_id', selectedPropertyIds)
        .gte('snapshot_date', startDate)
        .lte('snapshot_date', endDate),
    ]

    Promise.allSettled(queries)
      .then((results) => {
        if (!mounted) return
        const getData = (i: number) => (results[i].status === 'fulfilled' ? results[i].value.data : null)
        const turns = (getData(0) ?? []) as { move_out_date?: string; ready_date?: string }[]
        const workOrders = (getData(1) ?? []) as { created_on?: string; completed_on?: string }[]
        const conditionRows = (getData(2) ?? []) as { score_value?: number }[]
        const rentRows = (getData(3) ?? []) as Record<string, unknown>[]

        const turnTimeDays: number[] = []
        turns.forEach((r) => {
          if (!r.move_out_date || !r.ready_date) return
          const start = new Date(r.move_out_date).getTime()
          const end = new Date(r.ready_date).getTime()
          if (Number.isFinite(start) && Number.isFinite(end)) {
            turnTimeDays.push((end - start) / (1000 * 60 * 60 * 24))
          }
        })
        const turnTime =
          turnTimeDays.length > 0
            ? (turnTimeDays.reduce((a, b) => a + b, 0) / turnTimeDays.length).toFixed(1) + ' days'
            : null

        const tatDays: number[] = []
        workOrders.forEach((r) => {
          if (!r.created_on || !r.completed_on) return
          const created = new Date(r.created_on).getTime()
          const completed = new Date(r.completed_on).getTime()
          if (Number.isFinite(created) && Number.isFinite(completed)) {
            tatDays.push((completed - created) / (1000 * 60 * 60 * 24))
          }
        })
        const workOrderTat =
          tatDays.length > 0
            ? (tatDays.reduce((a, b) => a + b, 0) / tatDays.length).toFixed(1) + ' days'
            : null

        const conditionValues = conditionRows
          .map((r) => r.score_value)
          .filter((v): v is number => typeof v === 'number')
        const condition =
          conditionValues.length > 0
            ? (
                conditionValues.reduce((a, b) => a + b, 0) / conditionValues.length
              ).toFixed(1)
            : null

        let lossToLease: string | null = null
        const withAsking = rentRows.filter(
          (r) =>
            typeof r.avg_asking_rent === 'number' &&
            r.avg_asking_rent > 0
        )
        if (withAsking.length > 0) {
          const pcts = withAsking.map(
            (r) =>
              ((r.avg_asking_rent as number) - (Number(r.avg_effective_rent) || 0)) /
              (r.avg_asking_rent as number) *
              100
          )
          const avgPct = pcts.reduce((a, b) => a + b, 0) / pcts.length
          lossToLease = avgPct.toFixed(1) + '%'
        }

        setStats({
          turnTime,
          workOrderTat,
          vendorResponse: null,
          lossToLease,
          utilityUsage: null,
          delinquency: null,
          renewalRisk: null,
          condition,
        })
      })
      .catch(() => {
        if (mounted) {
          setStats({
            turnTime: null,
            workOrderTat: null,
            vendorResponse: null,
            lossToLease: null,
            utilityUsage: null,
            delinquency: null,
            renewalRisk: null,
            condition: null,
          })
        }
      })
      .finally(() => {
        if (mounted) setLoadingStats(false)
      })

    return () => {
      mounted = false
    }
  }, [selectedPropertyIdsKey, dateRange.startDate, dateRange.endDate])

  const displayStats = useMemo(() => {
    if (loadingStats) {
      return {
        ...stats,
        ...placeholderStats,
        turnTime: '—',
        workOrderTat: '—',
        lossToLease: '—',
        condition: '—',
      } as Stats
    }
    return {
      ...stats,
      turnTime: '14.25 days',
      vendorResponse: stats.vendorResponse ?? placeholderStats.vendorResponse,
      utilityUsage: stats.utilityUsage ?? placeholderStats.utilityUsage,
      delinquency: stats.delinquency ?? placeholderStats.delinquency,
      renewalRisk: stats.renewalRisk ?? placeholderStats.renewalRisk,
    }
  }, [loadingStats, stats, placeholderStats])

  const priorityOrder = (p: string) => (p === 'HIGH PRIORITY' ? 0 : p === 'MEDIUM PRIORITY' ? 1 : 2)

  const insightCards = useMemo((): InsightCardData[] => {
    const turnDays = HARDCODED_TURN_DAYS
    const industryTurnDays = 10
    const maxScaleDays = 20
    const turnTimeBarValue = Math.min(100, (turnDays / maxScaleDays) * 100)
    const turnTimeLabel = `Your avg: ${turnDays.toFixed(2)} days vs industry median: ${industryTurnDays} days`
    const turnTimePeer = `Industry median: ${industryTurnDays} days`

    const progressConfigs: Array<{ label: string; value: number; peer: string }> = [
      {
        label: turnTimeLabel,
        value: turnTimeBarValue,
        peer: turnTimePeer,
      },
      {
        label: 'Your potential damage: $60K vs industry standard: $50K',
        value: 60,
        peer: 'Industry standard: $50K',
      },
      {
        label: 'Your usage: $53K vs industry standard: $50K',
        value: 53,
        peer: 'Industry standard: $50K',
      },
      {
        label: 'Your compliance score: 85% vs industry standard: 100%',
        value: 85,
        peer: 'Industry standard: 100%',
      },
    ]

    const turnTimeProgressColor: 'green' | 'red' = turnDays < 10 ? 'green' : 'red'

    return INSIGHT_CARDS_BASE.map((base, i) => {
      const progress = progressConfigs[i]
      const defaults = {
        keyImpactLabel: base.id === 'turn-time' ? 'ESTIMATED IMPACT' : undefined,
        keyImpact:
          i === 0
            ? '$18k – $24k / mo revenue lag'
            : i === 1
              ? '$45k – $60k potential damage'
              : i === 2
                ? '$2.5k – $3.5k /mo excess'
                : 'Compliance risk',
        completion: i === 0 ? '94%' : ['94%', '88%', '82%', '100%'][i],
        completionTrend: 'up' as const,
        timeline:
          base.id === 'turn-time'
            ? '2d above threshold'
            : base.id === 'vendor-insurance'
              ? '< 90%'
              : base.id === 'water-intrusion'
                ? '> $10k over benchmark'
                : base.id === 'utility-drift'
                  ? '> $1k over benchmark'
                  : '3w above threshold',
        progressLabel: progress.label,
        progressValue: progress.value,
        peerLabel: progress.peer,
        progressColor: base.id === 'turn-time' ? turnTimeProgressColor : base.progressColor,
        benchmarkPosition:
          base.id === 'turn-time'
            ? 50
            : base.id === 'water-intrusion'
              ? 50
              : base.id === 'utility-drift'
                ? 50
                : undefined,
        benchmarkLabel:
          base.id === 'water-intrusion'
            ? '$50K'
            : base.id === 'utility-drift'
              ? '$50K'
              : undefined,
      }
      return {
        ...base,
        ...defaults,
      } as InsightCardData
    }).sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority))
  }, [])

  const footprintPropertyCount = selectedPropertyIds.length || 3
    const footprintUnits = 12
    const primaryDriverByCardId: Record<string, string> = {
      'turn-time': 'Vendor Latency',
      'water-intrusion': 'Vendor Latency',
      'utility-drift': 'Usage variance',
      'vendor-insurance': 'Coverage gap',
    }
    const impactTrendByCardId: Record<string, 'up' | 'down'> = {
      'turn-time': 'up',
      'water-intrusion': 'up',
      'utility-drift': 'up',
      'vendor-insurance': 'down',
    }
    const drawerSourceBadges = useMemo(() => {
      if (!reviewDrawerCard) return []
      const seed = reviewDrawerCard.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const start = seed % DOT_BADGES.length
      return [...DOT_BADGES.slice(start), ...DOT_BADGES.slice(0, start)].slice(0, 4)
    }, [reviewDrawerCard?.id])

    type EvidenceBundleItem = { title: string; source: string; time: string }
    type EvidenceBundle = {
      id: string
      title: string
      itemCount: number
      latest: string
      signalLevel: 'High' | 'Med' | 'Low'
      items: EvidenceBundleItem[]
    }
    const evidenceByCardId: Record<
      string,
      { keyExcerpt: string; dataSignal: string; bundles: EvidenceBundle[]; counterEvidence: string }
    > = {
      'turn-time': {
        keyExcerpt: '"Material delays cited for 12 units in Bldg 4; vendor missed SLA by 4+ days."',
        dataSignal: 'Turn time benchmark gap widened +2.1d WoW vs portfolio median.',
        bundles: [
          {
            id: 'benchmark',
            title: 'Benchmark Changes',
            itemCount: 2,
            latest: 'Today 8:00 AM',
            signalLevel: 'High',
            items: [
              { title: 'Gap widened to 14.2d vs market median (10d)', source: 'Internal', time: '8:00 AM' },
              { title: 'Peer median dropped 1.2 days', source: 'RealPage', time: 'Yesterday' },
            ],
          },
          {
            id: 'ops',
            title: 'Operational Artifacts',
            itemCount: 5,
            latest: 'Feb 10',
            signalLevel: 'Med',
            items: [
              { title: 'Vendor scheduling tickets up 18%', source: 'Work Orders', time: 'Feb 10' },
              { title: 'Approval wait time avg 2.3d', source: 'Internal', time: 'Feb 9' },
            ],
          },
          {
            id: 'cost',
            title: 'Cost Variance',
            itemCount: 1,
            latest: 'Yesterday',
            signalLevel: 'Low',
            items: [{ title: 'Revenue lag estimate $18k–$24k/mo', source: 'Rent Roll', time: 'Yesterday' }],
          },
        ],
        counterEvidence:
          'If "Weather Delays" or "Permit Holds" are active in region, this latency may be partially unavoidable.',
      },
      'water-intrusion': {
        keyExcerpt: '"Moisture readings elevated in 3 properties; North-facing facades cited in 8 of 12 units."',
        dataSignal: 'Potential damage estimate $45k–$60k vs industry benchmark $50k.',
        bundles: [
          {
            id: 'benchmark',
            title: 'Benchmark Changes',
            itemCount: 2,
            latest: 'Today 8:00 AM',
            signalLevel: 'High',
            items: [
              { title: 'Gap widened to 18% vs market (water claims)', source: 'RealPage', time: '8:00 AM' },
              { title: 'Peer median repair cost dropped 2 days', source: 'Internal', time: 'Yesterday' },
            ],
          },
          {
            id: 'ops',
            title: 'Operational Artifacts',
            itemCount: 5,
            latest: 'Feb 10',
            signalLevel: 'Med',
            items: [
              { title: 'Water work orders clustered Bldgs 4, 5', source: 'Work Orders', time: 'Feb 10' },
              { title: 'Vendor response time 72hr avg', source: 'Vendors', time: 'Feb 9' },
            ],
          },
          {
            id: 'cost',
            title: 'Cost Variance',
            itemCount: 1,
            latest: 'Yesterday',
            signalLevel: 'Low',
            items: [{ title: 'Est. impact $45k–$60k potential damage', source: 'Inspections', time: 'Yesterday' }],
          },
        ],
        counterEvidence:
          'If seasonal storm or one-time pipe failure is isolated, cluster may not indicate systemic risk.',
      },
      'utility-drift': {
        keyExcerpt: '"Usage variance +22% vs same period last year; Bldg 3 and 7 highest."',
        dataSignal: 'RealPage benchmark gap widened +18% WoW for Class B Austin MSA.',
        bundles: [
          {
            id: 'benchmark',
            title: 'Benchmark Changes',
            itemCount: 2,
            latest: 'Today 8:00 AM',
            signalLevel: 'High',
            items: [
              { title: 'Gap widened to 18% vs Market', source: 'RealPage', time: '8:00 AM' },
              { title: 'Peer median dropped 2 days', source: 'Internal', time: 'Yesterday' },
            ],
          },
          {
            id: 'ops',
            title: 'Operational Artifacts',
            itemCount: 5,
            latest: 'Feb 10',
            signalLevel: 'Med',
            items: [
              { title: 'Meter reads variance Bldg 3, 7', source: 'Utilities', time: 'Feb 10' },
              { title: 'Occupancy unchanged; usage up', source: 'PMS', time: 'Feb 9' },
            ],
          },
          {
            id: 'cost',
            title: 'Cost Variance',
            itemCount: 1,
            latest: 'Yesterday',
            signalLevel: 'Low',
            items: [{ title: 'Est. $2.5k–$3.5k/mo excess', source: 'Billing', time: 'Yesterday' }],
          },
        ],
        counterEvidence:
          'If extreme temps or occupancy spikes are present, variance may align with seasonal norms.',
      },
      'vendor-insurance': {
        keyExcerpt: '"3 vendors below 90% compliance; 2 certs expiring within 30 days."',
        dataSignal: 'Compliance score 85% vs industry standard 100%; gap widening.',
        bundles: [
          {
            id: 'benchmark',
            title: 'Benchmark Changes',
            itemCount: 2,
            latest: 'Today 8:00 AM',
            signalLevel: 'High',
            items: [
              { title: 'Compliance gap 15% vs market', source: 'Vendor Portal', time: '8:00 AM' },
              { title: 'Expiring certs: 2 in next 30d', source: 'Internal', time: 'Yesterday' },
            ],
          },
          {
            id: 'ops',
            title: 'Operational Artifacts',
            itemCount: 5,
            latest: 'Feb 10',
            signalLevel: 'Med',
            items: [
              { title: 'Vendor insurance uploads pending', source: 'Work Orders', time: 'Feb 10' },
              { title: 'Renewal reminders sent', source: 'Vendors', time: 'Feb 9' },
            ],
          },
          {
            id: 'cost',
            title: 'Cost Variance',
            itemCount: 1,
            latest: 'Yesterday',
            signalLevel: 'Low',
            items: [{ title: 'Compliance risk; no direct cost yet', source: 'Legal', time: 'Yesterday' }],
          },
        ],
        counterEvidence:
          'If vendors have submitted renewals and are awaiting carrier confirmation, risk may be temporary.',
      },
    }
    const evidence = reviewDrawerCard ? evidenceByCardId[reviewDrawerCard.id] ?? evidenceByCardId['turn-time'] : null
    const [evidenceFilter, setEvidenceFilter] = useState<'high' | 'all'>('high')

    type ActionsData = {
      primary: {
        title: string
        description: string
        outcome: string
        blastRadius: string
        effort: string
        due: string
        dueHighlight?: boolean
        checklist: { label: string; checked: boolean; autoGenerated?: boolean }[]
      }
      alternative: { title: string; description: string; effort: string }
      inaction: { impact: string; risk: string }
    }
    const actionsByCardId: Record<string, ActionsData> = {
      'turn-time': {
        primary: {
          title: 'Enforce Vendor SLA Penalty',
          description: 'Issue formal notice to Ace Carpentry and apply 5% deduction.',
          outcome: '+$2.4k Savings',
          blastRadius: '3 Properties',
          effort: 'LOW',
          due: 'TODAY',
          dueHighlight: true,
          checklist: [
            { label: 'Verify contract terms (v2023.4)', checked: true },
            { label: 'Review drafted email to Vendor', checked: false, autoGenerated: true },
          ],
        },
        alternative: {
          title: 'Reassign pending turns',
          description: 'Move 3 units to secondary vendor.',
          effort: 'Med',
        },
        inaction: {
          impact: '-$15k NOI over next 60 days.',
          risk: 'High',
        },
      },
      'water-intrusion': {
        primary: {
          title: 'Launch Envelope Inspection',
          description: 'Schedule North-facing facade assessment for Bldgs 4, 5, 8.',
          outcome: '+$12k–$15k avoided',
          blastRadius: '3 Properties',
          effort: 'LOW',
          due: 'This week',
          dueHighlight: false,
          checklist: [
            { label: 'Confirm scope with structural vendor', checked: true },
            { label: 'Notify property managers', checked: false, autoGenerated: true },
          ],
        },
        alternative: {
          title: 'Expedite repair quotes',
          description: 'Request same-day quotes from 2 approved vendors.',
          effort: 'Med',
        },
        inaction: {
          impact: '-$45k–$60k potential damage over 90 days.',
          risk: 'High',
        },
      },
      'utility-drift': {
        primary: {
          title: 'Audit meter reads & billing',
          description: 'Verify Bldg 3 and 7 meters; dispute anomalies with utility.',
          outcome: '+$2.5k–$3.5k/mo savings',
          blastRadius: '2 Properties',
          effort: 'LOW',
          due: 'TODAY',
          dueHighlight: true,
          checklist: [
            { label: 'Pull last 90d consumption by unit', checked: true },
            { label: 'Draft variance report for utility', checked: false, autoGenerated: true },
          ],
        },
        alternative: {
          title: 'Install sub-meters',
          description: 'Add sub-meters to high-variance buildings.',
          effort: 'High',
        },
        inaction: {
          impact: '-$7.5k NOI over next 60 days.',
          risk: 'Med',
        },
      },
      'vendor-insurance': {
        primary: {
          title: 'Issue compliance notice',
          description: 'Send formal notice to 3 vendors; require certs within 14 days.',
          outcome: 'Compliance to 100%',
          blastRadius: 'Portfolio-wide',
          effort: 'LOW',
          due: 'This week',
          dueHighlight: false,
          checklist: [
            { label: 'Verify vendor list and contacts', checked: true },
            { label: 'Send templated notice', checked: false, autoGenerated: true },
          ],
        },
        alternative: {
          title: 'Pause non-compliant vendors',
          description: 'Temporarily remove from dispatch until certs updated.',
          effort: 'Med',
        },
        inaction: {
          impact: 'Compliance risk; potential audit exposure.',
          risk: 'High',
        },
      },
    }
    type AuditEvent = { title: string; when: string; actor: string; viewSnapshot?: boolean }
    const auditLogByCardId: Record<string, AuditEvent[]> = {
      'turn-time': [
        { title: 'Insight Refreshed: +2 properties added', when: 'Today 8:00 AM', actor: 'System', viewSnapshot: true },
        { title: 'Confidence Score increased 88% → 94%', when: 'Feb 12', actor: 'System' },
        { title: 'User viewed insight', when: 'Feb 10', actor: 'Alex M.' },
        { title: 'Initial Detection', when: 'Feb 05', actor: 'Model v2.4' },
      ],
      'water-intrusion': [
        { title: 'Insight Refreshed: footprint updated to 3 properties', when: 'Today 9:15 AM', actor: 'System', viewSnapshot: true },
        { title: 'Confidence Score increased 82% → 88%', when: 'Feb 11', actor: 'System' },
        { title: 'User viewed insight', when: 'Feb 09', actor: 'Jordan K.' },
        { title: 'Initial Detection', when: 'Feb 04', actor: 'Model v2.4' },
      ],
      'utility-drift': [
        { title: 'Insight Refreshed: Bldg 7 added to variance set', when: 'Today 7:30 AM', actor: 'System', viewSnapshot: true },
        { title: 'Confidence Score decreased 86% → 82%', when: 'Feb 12', actor: 'System' },
        { title: 'User viewed insight', when: 'Feb 10', actor: 'Sam R.' },
        { title: 'Initial Detection', when: 'Feb 06', actor: 'Model v2.4' },
      ],
      'vendor-insurance': [
        { title: 'Insight Refreshed: 1 vendor cert renewed', when: 'Today 10:00 AM', actor: 'System', viewSnapshot: true },
        { title: 'Confidence Score stable at 100%', when: 'Feb 11', actor: 'System' },
        { title: 'User viewed insight', when: 'Feb 08', actor: 'Morgan L.' },
        { title: 'Initial Detection', when: 'Feb 03', actor: 'Model v2.4' },
      ],
    }
    const auditEvents = reviewDrawerCard ? auditLogByCardId[reviewDrawerCard.id] ?? auditLogByCardId['turn-time'] : []
    type ConnectionNode = { label: string; color: string }
    const connectionsByCardId: Record<
      string,
      { centerLabel: string; patternDescription: string; nodes: [ConnectionNode, ConnectionNode, ConnectionNode, ConnectionNode] }
    > = {
      'turn-time': {
        centerLabel: 'Turn Delays',
        patternDescription: '3 properties share the same vendor and delayed scheduling window.',
        nodes: [
          { label: 'SLA Contract', color: 'green' },
          { label: 'Ace Carpentry', color: 'yellow' },
          { label: 'Unit 304', color: 'gray' },
          { label: 'Bldg 4 Stack', color: 'blue' },
        ],
      },
      'water-intrusion': {
        centerLabel: 'Water Intrusion',
        patternDescription: '3 properties share North-facing facade exposure and moisture events.',
        nodes: [
          { label: 'Envelope Contract', color: 'green' },
          { label: 'Restoration Co', color: 'yellow' },
          { label: 'Unit 412', color: 'gray' },
          { label: 'Bldg 5 Stack', color: 'blue' },
        ],
      },
      'utility-drift': {
        centerLabel: 'Usage Variance',
        patternDescription: '2 properties show elevated consumption vs benchmark.',
        nodes: [
          { label: 'Meter Agreement', color: 'green' },
          { label: 'City Utilities', color: 'yellow' },
          { label: 'Bldg 3', color: 'gray' },
          { label: 'Bldg 7', color: 'blue' },
        ],
      },
      'vendor-insurance': {
        centerLabel: 'Compliance Gap',
        patternDescription: '3 vendors share expiring certs and delayed renewals.',
        nodes: [
          { label: 'Insurance Req', color: 'green' },
          { label: 'Ace Carpentry', color: 'yellow' },
          { label: 'Metro Plumbing', color: 'gray' },
          { label: 'Portfolio-wide', color: 'blue' },
        ],
      },
    }
    const connectionsData = reviewDrawerCard ? connectionsByCardId[reviewDrawerCard.id] ?? connectionsByCardId['turn-time'] : null
    const actionsData = reviewDrawerCard ? actionsByCardId[reviewDrawerCard.id] ?? actionsByCardId['turn-time'] : null
    const [executionChecklistExpanded, setExecutionChecklistExpanded] = useState(false)
    const [checklistChecked, setChecklistChecked] = useState<boolean[]>([])
    const [drawerTab, setDrawerTab] = useState('overview')
    useEffect(() => {
      if (reviewDrawerCard) setDrawerTab('overview')
    }, [reviewDrawerCard?.id])
    useEffect(() => {
      if (actionsData?.primary.checklist) {
        setChecklistChecked(actionsData.primary.checklist.map((c) => c.checked))
      }
    }, [reviewDrawerCard?.id])

  return (
    <>
      <InsightsPageShell title="Detections">
      <Group gap="xl" justify="space-between" align="flex-start" wrap="wrap">
        <Group gap="md" wrap="wrap">
          {DOT_BADGES.map(({ label, color }) => (
            <Group key={label} gap={6} wrap="nowrap">
              <Box
                w={8}
                h={8}
                style={{
                  borderRadius: '50%',
                  backgroundColor:
                    color === 'green'
                      ? 'var(--mantine-color-green-6)'
                      : 'var(--mantine-color-yellow-6)',
                }}
              />
              <Text size="sm" fw={500}>
                {label}
              </Text>
            </Group>
          ))}
        </Group>
        <Stack gap="xs" style={{ minWidth: 280, maxWidth: 400 }}>
          <Group gap="xs" justify="space-between">
            <Text size="sm" fw={600}>
              Coverage meter
            </Text>
            <Text size="sm" fw={600} c="dimmed">
              83%
            </Text>
          </Group>
          <Progress value={83} size="lg" radius="md" color="warning" />
        </Stack>
      </Group>

      <Stack gap="md">
        <SimpleGrid cols={{ base: 2, xs: 4, sm: 8 }} spacing="md">
          {STAT_LABELS.map(({ key, label }) => (
            <StatCard
              key={key}
              title={label}
              value={displayStats[key]}
              isUnavailable={
                key === 'vendorResponse' ||
                key === 'utilityUsage' ||
                key === 'delinquency' ||
                key === 'renewalRisk'
              }
            />
          ))}
        </SimpleGrid>

        <Text component="h2" fw={700} size="xl" mt="xl" mb="md">
          Active Risk Clusters
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          {activeRiskClusters.map((cluster) => {
            const badgeColor =
              cluster.status === 'Critical'
                ? 'red'
                : cluster.status === 'Warning'
                  ? 'yellow'
                  : 'gray'
            return (
              <Card
                key={cluster.property + cluster.title}
                withBorder
                radius="md"
                padding="md"
              >
                <Group justify="space-between" align="flex-start" mb="xs">
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      {cluster.property}
                    </Text>
                    <Text fw={700} size="md">
                      {cluster.title}
                    </Text>
                  </Stack>
                  <Badge size="sm" variant="light" color={badgeColor} radius="xl">
                    {cluster.status}
                  </Badge>
                </Group>
                <Group gap="sm" mb="md" wrap="nowrap">
                  <Group gap={6} wrap="nowrap">
                    <HugeiconsIcon icon={Home03Icon} size={16} />
                    <Text size="sm">
                      {cluster.units} Units
                    </Text>
                  </Group>
                  <Divider orientation="vertical" />
                  <Text size="sm" c={cluster.unitChangeColor} fw={600}>
                    {cluster.unitChange}
                  </Text>
                  <Divider orientation="vertical" />
                  <Group gap={6} wrap="nowrap">
                    <HugeiconsIcon
                      icon={ChartLineData02Icon}
                      size={16}
                      style={{
                        color:
                          cluster.trendColor === 'danger'
                            ? 'var(--mantine-color-red-6)'
                            : 'var(--mantine-color-dimmed)',
                      }}
                    />
                    <Text size="sm" c={cluster.trendColor}>
                      {cluster.trend}
                    </Text>
                  </Group>
                </Group>
                <Stack gap={4} mb="md">
                  <Text size="sm">
                    <Text span>Footprint: </Text>
                    <Text span>{cluster.footprint}</Text>
                  </Text>
                  <Text size="sm">
                    <Text span>Driver: </Text>
                    <Text span fw={700}>
                      {cluster.driver}
                    </Text>
                  </Text>
                </Stack>
                <Button
                  variant="light"
                  color="gray"
                  fullWidth
                  radius="md"
                  rightSection={<HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
                >
                  {cluster.actionLabel}
                </Button>
              </Card>
            )
          })}
        </SimpleGrid>

        <Text component="h2" fw={700} size="xl" mt="xl" mb="md">
          Detected Insights
        </Text>
        <Stack gap="md">
          {insightCards.map((card) => (
            <InsightCard
              key={card.id}
              data={card}
              onReview={(c) => setReviewDrawerCard(c)}
            />
          ))}
        </Stack>
      </Stack>
    </InsightsPageShell>

      <InlineEditorDrawer
        opened={!!reviewDrawerCard}
        onClose={() => setReviewDrawerCard(null)}
        withCloseButton
        size={560}
        title={
          reviewDrawerCard ? (
            <Stack gap="xs">
              <Text fw={700} size="xl">
                {reviewDrawerCard.title}
              </Text>
              <Group gap="sm">
                <Badge
                  size="sm"
                  variant="light"
                  color={
                    reviewDrawerCard.priority === 'HIGH PRIORITY'
                      ? 'red'
                      : reviewDrawerCard.priority === 'MEDIUM PRIORITY'
                        ? 'yellow'
                        : 'gray'
                  }
                  radius="xl"
                >
                  {reviewDrawerCard.category} •{' '}
                  {reviewDrawerCard.priority === 'HIGH PRIORITY'
                    ? 'HIGH'
                    : reviewDrawerCard.priority === 'MEDIUM PRIORITY'
                      ? 'MEDIUM'
                      : 'LOW'}
                </Badge>
                <Badge size="sm" variant="light" color="green" radius="xl">
                  {reviewDrawerCard.completion} Confidence
                </Badge>
              </Group>
            </Stack>
          ) : undefined
        }
        tabs={
          reviewDrawerCard ? (
            <Stack gap="md">
              <Stack gap="xs">
                <Group gap="xs" align="center">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    SOURCES
                  </Text>
                  <Group gap="md" wrap="wrap">
                    {drawerSourceBadges.map(({ label, color }) => (
                      <Group key={label} gap={6} wrap="nowrap">
                        <Box
                          w={8}
                          h={8}
                          style={{
                            borderRadius: '50%',
                            backgroundColor:
                              color === 'green'
                                ? 'var(--mantine-color-green-6)'
                                : 'var(--mantine-color-yellow-6)',
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
                    FOOTPRINT
                  </Text>
                  <Text size="xs" c="dimmed">
                    {footprintPropertyCount} Properties • {footprintUnits} Units • Last 30d
                  </Text>
                </Group>
                <Group gap="xs" align="center">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    REFRESHED
                  </Text>
                  <Group gap={6} align="center">
                    <Box
                      w={6}
                      h={6}
                      style={{
                        borderRadius: '50%',
                        backgroundColor: 'var(--mantine-color-green-6)',
                      }}
                    />
                    <Text size="xs" c="dimmed">
                      2h ago
                    </Text>
                  </Group>
                </Group>
              </Stack>
              <Tabs value={drawerTab} onChange={(v) => setDrawerTab(v ?? 'overview')}>
              <Tabs.List
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  backgroundColor: 'var(--mantine-color-body)',
                }}
              >
                <Tabs.Tab value="overview">Overview</Tabs.Tab>
                <Tabs.Tab value="evidence">Evidence</Tabs.Tab>
                <Tabs.Tab value="connections">Connections</Tabs.Tab>
                <Tabs.Tab value="actions">Actions</Tabs.Tab>
                <Tabs.Tab value="audit">Audit Log</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="overview" pt="md">
                <Stack gap="md">
                  <Stack gap="md">
                    <Group gap="md" align="stretch" wrap="nowrap">
                      <Paper withBorder p="md" radius="md" style={{ flex: 1 }}>
                        <Stack gap="xs">
                          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                            EST. IMPACT
                          </Text>
                          <Group gap="xs" align="center">
                            <Text fw={700} size="lg">
                              {reviewDrawerCard.keyImpact.replace(/ revenue lag/gi, '')}
                            </Text>
                            {((): React.ReactNode => {
                              const trend = impactTrendByCardId[reviewDrawerCard.id] ?? 'up'
                              const isUp = trend === 'up'
                              return (
                                <HugeiconsIcon
                                  icon={isUp ? ArrowUp01Icon : ArrowDown01Icon}
                                  size={20}
                                  style={{
                                    color: isUp
                                      ? 'var(--mantine-color-red-6)'
                                      : 'var(--mantine-color-green-6)',
                                  }}
                                />
                              )
                            })()}
                          </Group>
                        </Stack>
                      </Paper>
                      <Paper withBorder p="md" radius="md" style={{ flex: 1 }}>
                        <Stack gap="xs">
                          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                            PRIMARY DRIVER
                          </Text>
                          <Badge variant="light" color="gray" size="sm" radius="xl">
                            {primaryDriverByCardId[reviewDrawerCard.id] ?? '—'}
                          </Badge>
                        </Stack>
                      </Paper>
                    </Group>
                    <Paper withBorder p="md" radius="md">
                      <Stack gap="xs">
                        <Group gap="xs">
                          <HugeiconsIcon icon={ChartLineData02Icon} size={16} />
                          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                            BENCHMARKING
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {reviewDrawerCard.progressLabel}
                        </Text>
                        <Group gap="sm" align="center">
                          <Box style={{ position: 'relative', flex: 1 }}>
                            <Progress
                              value={reviewDrawerCard.progressValue}
                              size="sm"
                              radius="xl"
                              color={reviewDrawerCard.progressColor === 'red' ? 'red' : 'warning'}
                              style={{ width: '100%' }}
                            />
                            {reviewDrawerCard.benchmarkPosition != null && (
                              <>
                                <Box
                                  style={{
                                    position: 'absolute',
                                    left: `${reviewDrawerCard.benchmarkPosition}%`,
                                    top: 0,
                                    bottom: 0,
                                    width: 2,
                                    marginLeft: -1,
                                    backgroundColor: 'var(--mantine-color-dark-3)',
                                    borderRadius: 1,
                                    pointerEvents: 'none',
                                  }}
                                  aria-hidden
                                />
                                {reviewDrawerCard.benchmarkLabel != null && (
                                  <Text
                                    size="xs"
                                    c="dimmed"
                                    style={{
                                      position: 'absolute',
                                      left: `${reviewDrawerCard.benchmarkPosition}%`,
                                      top: '100%',
                                      marginTop: 4,
                                      transform: 'translateX(-50%)',
                                      whiteSpace: 'nowrap',
                                      pointerEvents: 'none',
                                    }}
                                  >
                                    {reviewDrawerCard.benchmarkLabel}
                                  </Text>
                                )}
                              </>
                            )}
                          </Box>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {reviewDrawerCard.peerLabel}
                        </Text>
                      </Stack>
                    </Paper>
                    <Paper withBorder p="md" radius="md">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">
                        TOP DRIVERS
                      </Text>
                      <Stack gap="xs">
                        <Group gap="xs">
                          <Text size="sm">Vendor Scheduling</Text>
                          <Progress value={80} size="xs" color="red" style={{ flex: 1 }} radius="xl" />
                        </Group>
                        <Group gap="xs">
                          <Text size="sm">Material Staging</Text>
                          <Progress value={55} size="xs" color="yellow" style={{ flex: 1 }} radius="xl" />
                        </Group>
                        <Group gap="xs">
                          <Text size="sm">Approvals</Text>
                          <Progress value={40} size="xs" color="blue" style={{ flex: 1 }} radius="xl" />
                        </Group>
                      </Stack>
                    </Paper>
                    <Paper withBorder p="md" radius="md">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">
                        WHY NOW?
                      </Text>
                      <Stack gap="xs">
                        <Group gap="xs">
                          <HugeiconsIcon icon={ChartLineData02Icon} size={14} />
                          <Text size="sm">Threshold: {reviewDrawerCard.timeline}</Text>
                        </Group>
                        <Group gap="xs">
                          <HugeiconsIcon icon={ChartLineData02Icon} size={14} />
                          <Text size="sm">Impact: {reviewDrawerCard.keyImpact}</Text>
                        </Group>
                        <Group gap="xs">
                          <HugeiconsIcon icon={ChartLineData02Icon} size={14} />
                          <Text size="sm">
                            Footprint: {footprintPropertyCount} properties
                          </Text>
                        </Group>
                      </Stack>
                    </Paper>
                  </Stack>
                  <Paper withBorder p="md" radius="md">
                    <Group gap="xs" mb="xs">
                      <HugeiconsIcon icon={Home03Icon} size={16} />
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        FOOTPRINT
                      </Text>
                    </Group>
                    <Group gap="lg" mb="sm">
                      <Stack gap={2} align="center">
                        <Text fw={700} size="xl">
                          {footprintPropertyCount}
                        </Text>
                        <Text size="xs" c="dimmed">
                          PROPERTIES
                        </Text>
                      </Stack>
                      <Stack gap={2} align="center">
                        <Text fw={700} size="xl">
                          {footprintUnits}
                        </Text>
                        <Text size="xs" c="dimmed">
                          UNITS
                        </Text>
                      </Stack>
                    </Group>
                    <Stack gap={4}>
                      {selectedPropertyIds.slice(0, 3).map((id) => (
                        <Group key={id} gap="xs">
                          <Box
                            w={6}
                            h={6}
                            style={{
                              borderRadius: '50%',
                              backgroundColor: 'var(--mantine-color-red-6)',
                            }}
                          />
                          <Text size="sm">
                            {propertyNameById.get(id) ?? '—'} (
                            {id === selectedPropertyIds[0] ? 6 : id === selectedPropertyIds[1] ? 4 : 2} units)
                          </Text>
                        </Group>
                      ))}
                      {selectedPropertyIds.length === 0 && (
                        <Text size="sm" c="dimmed">
                          Select properties to see footprint
                        </Text>
                      )}
                    </Stack>
                  </Paper>
                  <Paper withBorder p="md" radius="md">
                    <Group gap="xs" mb="xs">
                      <Badge size="sm" variant="light" color="blue">
                        Enforce SLA Penalty
                      </Badge>
                      <Badge size="sm" variant="light" color="yellow">
                        Requires Approval
                      </Badge>
                    </Group>
                    <Text fw={700} size="md" mb="xs">
                      Issue Formal Vendor Notice
                    </Text>
                    <Text size="sm" c="dimmed" mb="md">
                      Apply 5% deduction per contract terms for consistent SLA breaches.
                    </Text>
                    <Group gap="sm">
                      <Button size="sm">Review & Approve</Button>
                      <Button variant="default" size="sm" leftSection={<HugeiconsIcon icon={ChartLineData02Icon} size={16} />}>
                        Simulate Impact
                      </Button>
                    </Group>
                    <Group gap="md" mt="md">
                      <Text size="xs" c="dimmed">
                        PRIMARY REC
                      </Text>
                      <Text size="xs" c="green" fw={600}>
                        Recover $2.4k
                      </Text>
                      <Text size="xs" c="dimmed">
                        Effort: Moderate
                      </Text>
                      <Text size="xs" c="dimmed">
                        Risk: Vendor pushback
                      </Text>
                    </Group>
                  </Paper>
                </Stack>
              </Tabs.Panel>
              <Tabs.Panel value="evidence" pt="md">
                {evidence ? (
                  <Stack gap="md">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      <Paper withBorder p="md" radius="md">
                        <Stack gap="xs">
                          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                            KEY EXCERPT
                          </Text>
                          <Text size="sm" fs="italic">
                            {evidence.keyExcerpt}
                          </Text>
                        </Stack>
                      </Paper>
                      <Paper withBorder p="md" radius="md">
                        <Stack gap="xs">
                          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                            DATA SIGNAL
                          </Text>
                          <Text size="sm">
                            {evidence.dataSignal}
                          </Text>
                        </Stack>
                      </Paper>
                    </SimpleGrid>
                    <Stack gap="xs">
                      <Divider />
                      <Group justify="space-between" align="center" wrap="wrap">
                        <Text component="h2" size="h2" fw={700}>
                          Evidence Bundles
                        </Text>
                        <Group gap="xs">
                          <Button
                            variant={evidenceFilter === 'high' ? 'filled' : 'light'}
                            color="gray"
                            size="xs"
                            radius="xl"
                            leftSection={<HugeiconsIcon icon={ChartLineData02Icon} size={14} />}
                            onClick={() => setEvidenceFilter('high')}
                          >
                            High Confidence Only
                          </Button>
                          <Button
                            variant={evidenceFilter === 'all' ? 'filled' : 'light'}
                            color="gray"
                            size="xs"
                            radius="xl"
                            leftSection={<HugeiconsIcon icon={ChartLineData02Icon} size={14} />}
                            onClick={() => setEvidenceFilter('all')}
                          >
                            All Sources
                          </Button>
                        </Group>
                      </Group>
                      <Accordion variant="separated" radius="md" defaultValue={evidence.bundles[0]?.id}>
                        {(evidenceFilter === 'high'
                          ? evidence.bundles.filter((b) => b.signalLevel === 'High')
                          : evidence.bundles
                        ).map((bundle) => (
                          <Accordion.Item key={bundle.id} value={bundle.id}>
                            <Accordion.Control>
                              <Group justify="space-between" wrap="nowrap">
                                <Group gap="xs">
                                  <Text size="sm" fw={700}>
                                    {bundle.title}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {bundle.itemCount} items • Latest: {bundle.latest}
                                  </Text>
                                </Group>
                                <Badge
                                  size="sm"
                                  variant="light"
                                  color={
                                    bundle.signalLevel === 'High'
                                      ? 'green'
                                      : bundle.signalLevel === 'Med'
                                        ? 'yellow'
                                        : 'gray'
                                  }
                                  radius="xl"
                                >
                                  {bundle.signalLevel} Signal
                                </Badge>
                              </Group>
                            </Accordion.Control>
                            <Accordion.Panel>
                              <Stack gap="md">
                                {bundle.items.map((item, i) => (
                                  <Group key={i} justify="space-between" align="flex-start" wrap="nowrap">
                                    <Group gap="sm" align="flex-start" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                      <Box
                                        w={3}
                                        h="100%"
                                        style={{
                                          minHeight: 32,
                                          borderRadius: 2,
                                          backgroundColor: 'var(--mantine-color-violet-6)',
                                        }}
                                      />
                                      <Stack gap={2}>
                                        <Text size="sm" fw={500}>
                                          {item.title}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                          Source: {item.source} • {item.time}
                                        </Text>
                                      </Stack>
                                    </Group>
                                    <UnstyledButton>
                                      <Text size="xs" c="blue" fw={600}>
                                        View
                                      </Text>
                                    </UnstyledButton>
                                  </Group>
                                ))}
                              </Stack>
                            </Accordion.Panel>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                    </Stack>
                    <Alert variant="light" color="yellow" title="Counter-evidence check">
                      {evidence.counterEvidence}
                    </Alert>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    Evidence for this insight will appear here.
                  </Text>
                )}
              </Tabs.Panel>
              <Tabs.Panel value="connections" pt="md">
                {connectionsData ? (
                  <Stack gap="md">
                    <Paper
                      p="md"
                      radius="md"
                      style={{
                        // Use Mantine's semi-transparent "light" color token for readable contrast
                        backgroundColor: 'var(--mantine-color-violet-light)',
                      }}
                    >
                      <Group gap="sm" align="flex-start">
                        <Box
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            backgroundColor: 'var(--mantine-color-violet-6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <HugeiconsIcon icon={Alert02Icon} size={16} color="white" />
                        </Box>
                        <Stack gap={4}>
                          <Text fw={700} size="sm">
                            Common Pattern Detected
                          </Text>
                          <Text size="sm" c="var(--mantine-color-text)" style={{ opacity: 0.9 }}>
                            {connectionsData.patternDescription}
                          </Text>
                        </Stack>
                      </Group>
                    </Paper>
                    <Paper withBorder p="md" radius="md" pos="relative" style={{ minHeight: 280 }}>
                      <Box pos="relative" w="100%" style={{ height: 260 }}>
                        <svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 200 200"
                          style={{ position: 'absolute', inset: 0 }}
                          // Nodes are positioned in CSS with % of this container; stretch SVG to match.
                          preserveAspectRatio="none"
                        >
                          <line
                            x1="100"
                            y1="100"
                            x2="36"
                            y2="28"
                            stroke="var(--mantine-color-blue-6)"
                            strokeWidth="2"
                          />
                          <line
                            x1="100"
                            y1="100"
                            x2="136"
                            y2="28"
                            stroke="var(--mantine-color-dark-2)"
                            strokeWidth="1.5"
                          />
                          <line
                            x1="100"
                            y1="100"
                            x2="36"
                            y2="144"
                            stroke="var(--mantine-color-dark-2)"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          <line
                            x1="100"
                            y1="100"
                            x2="136"
                            y2="144"
                            stroke="var(--mantine-color-dark-2)"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                        </svg>
                        <Box
                          pos="absolute"
                          left="50%"
                          top="50%"
                          style={{
                            transform: 'translate(-50%, -50%)',
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            backgroundColor: 'var(--mantine-color-red-6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <HugeiconsIcon icon={ChartLineData02Icon} size={22} color="white" />
                        </Box>
                        <Box
                          pos="absolute"
                          left="50%"
                          top="50%"
                          style={{
                            transform: 'translate(-50%, calc(-50% + 36px))',
                            whiteSpace: 'nowrap',
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--mantine-color-dimmed)',
                          }}
                        >
                          {connectionsData.centerLabel}
                        </Box>
                        {[
                          { pos: { left: '18%', top: '14%' }, node: connectionsData.nodes[0] },
                          { pos: { left: '68%', top: '14%' }, node: connectionsData.nodes[1] },
                          { pos: { left: '18%', top: '72%' }, node: connectionsData.nodes[2] },
                          { pos: { left: '68%', top: '72%' }, node: connectionsData.nodes[3] },
                        ].map(({ pos, node }, i) => (
                          <Box key={i} pos="absolute" style={{ ...pos, transform: 'translate(-50%, -50%)' }}>
                            <Box
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                backgroundColor:
                                  node.color === 'green'
                                    ? 'var(--mantine-color-green-4)'
                                    : node.color === 'yellow'
                                      ? 'var(--mantine-color-yellow-4)'
                                      : node.color === 'blue'
                                        ? 'var(--mantine-color-blue-4)'
                                        : 'var(--mantine-color-gray-4)',
                                margin: '0 auto 4px',
                              }}
                            />
                            <Text
                              size="xs"
                              ta="center"
                              fw={600}
                              c="dimmed"
                              style={{ maxWidth: 70 }}
                            >
                              {node.label}
                            </Text>
                          </Box>
                        ))}
                      </Box>
                      <Group justify="flex-end" mt="xs">
                        <Button variant="subtle" size="xs" leftSection={<HugeiconsIcon icon={ArrowRight01Icon} size={14} />}>
                          Expand to Portfolio View
                        </Button>
                      </Group>
                    </Paper>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    Connections to work orders, vendors, and properties.
                  </Text>
                )}
              </Tabs.Panel>
              <Tabs.Panel value="actions" pt="md">
                {actionsData ? (
                  <Stack gap="lg">
                    <Stack gap="xs">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        1 PRIMARY RECOMMENDATION
                      </Text>
                      <Paper withBorder p="md" radius="md">
                        <Stack gap="md">
                          <Group justify="space-between" align="flex-start" wrap="wrap">
                            <Badge size="sm" variant="light" color="blue" radius="sm">
                              Best Next Step
                            </Badge>
                            <Group gap="md">
                              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                                EFFORT: {actionsData.primary.effort}
                              </Text>
                              <Text size="xs" fw={600} c={actionsData.primary.dueHighlight ? 'red' : undefined}>
                                DUE: {actionsData.primary.due}
                              </Text>
                            </Group>
                          </Group>
                          <Text fw={700} size="lg">
                            {actionsData.primary.title}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {actionsData.primary.description}
                          </Text>
                          <SimpleGrid cols={3} spacing="md">
                            <Stack gap={4}>
                              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                                OUTCOME
                              </Text>
                              <Text size="sm" fw={600} c="green">
                                {actionsData.primary.outcome}
                              </Text>
                            </Stack>
                            <Stack gap={4}>
                              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                                AFFECTS
                              </Text>
                              <Text size="sm" fw={600}>
                                {actionsData.primary.blastRadius}
                              </Text>
                            </Stack>
                            <Stack gap={4}>
                              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                                OWNER
                              </Text>
                              <Select
                                placeholder="Assign"
                                data={[]}
                                clearable
                                size="sm"
                                styles={{ input: { fontWeight: 600 } }}
                              />
                            </Stack>
                          </SimpleGrid>
                          <Group gap="sm">
                            <Button
                              size="sm"
                              rightSection={
                                <HugeiconsIcon
                                  icon={executionChecklistExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                                  size={16}
                                />
                              }
                              onClick={() => setExecutionChecklistExpanded((v) => !v)}
                            >
                              Review & Approve
                            </Button>
                            <Button variant="default" size="sm">
                              Dismiss
                            </Button>
                          </Group>
                          <Collapse in={executionChecklistExpanded}>
                            <Stack gap="md">
                              <Divider />
                              <Stack gap="xs">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                                  EXECUTION CHECKLIST
                                </Text>
                                {actionsData.primary.checklist.map((item, i) => (
                                  <Group key={i} justify="space-between" wrap="nowrap">
                                    <Checkbox
                                      size="sm"
                                      label={item.label}
                                      checked={checklistChecked[i] ?? item.checked}
                                      onChange={() =>
                                        setChecklistChecked((prev) => {
                                          const next = [...(prev.length ? prev : actionsData.primary.checklist.map((c) => c.checked))]
                                          next[i] = !next[i]
                                          return next
                                        })
                                      }
                                      color="purple"
                                    />
                                    {item.autoGenerated && (
                                      <Badge size="xs" variant="light" color="gray" radius="sm">
                                        Auto-generated
                                      </Badge>
                                    )}
                                  </Group>
                                ))}
                              </Stack>
                            </Stack>
                          </Collapse>
                        </Stack>
                      </Paper>
                    </Stack>
                    <Stack gap="xs">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        2 ALTERNATIVE
                      </Text>
                      <Paper withBorder p="md" radius="md">
                        <Group justify="space-between" align="flex-start" wrap="wrap">
                          <Stack gap={4}>
                            <Text fw={700} size="md">
                              {actionsData.alternative.title}
                            </Text>
                            <Text size="sm" c="dimmed">
                              {actionsData.alternative.description}
                            </Text>
                            <UnstyledButton>
                              <Text size="sm" fw={600} c="blue">
                                Select Option
                              </Text>
                            </UnstyledButton>
                          </Stack>
                          <Text size="xs" c="dimmed">
                            Effort: {actionsData.alternative.effort}
                          </Text>
                        </Group>
                      </Paper>
                    </Stack>
                    <Stack gap="xs">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        IF WE DO NOTHING...
                      </Text>
                      <Paper withBorder p="md" radius="md">
                        <Group justify="space-between" align="flex-start" wrap="wrap">
                          <Text size="sm">
                            Projected impact: <Text span fw={600} c="red">{actionsData.inaction.impact}</Text>
                          </Text>
                          <Text size="xs" c="dimmed">
                            Risk: {actionsData.inaction.risk}
                          </Text>
                        </Group>
                      </Paper>
                    </Stack>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    Recommended actions and approvals.
                  </Text>
                )}
              </Tabs.Panel>
              <Tabs.Panel value="audit" pt="md">
                <Timeline active={1} bulletSize={10} lineWidth={2}>
                  {auditEvents.map((event, i) => (
                    <Timeline.Item key={i} title={event.title}>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="sm" c="dimmed">
                          {event.when}
                        </Text>
                        <Text size="sm" c="dimmed">
                          •
                        </Text>
                        <Text size="sm" c="dimmed">
                          {event.actor}
                        </Text>
                      </Group>
                      {event.viewSnapshot && (
                        <UnstyledButton mt={4}>
                          <Text size="sm" fw={600} c="blue">
                            View Snapshot
                          </Text>
                        </UnstyledButton>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Tabs.Panel>
              </Tabs>
            </Stack>
          ) : null
        }
        footer={
          <>
            <Group gap="sm">
              <UnstyledButton>
                <Text size="sm" c="dimmed">
                  Helpful
                </Text>
              </UnstyledButton>
              <Group gap={4}>
                <UnstyledButton aria-label="Helpful">
                  <Text size="sm" c="dimmed">
                    👍
                  </Text>
                </UnstyledButton>
                <UnstyledButton aria-label="Not helpful">
                  <Text size="sm" c="dimmed">
                    👎
                  </Text>
                </UnstyledButton>
              </Group>
            </Group>
            {drawerTab !== 'actions' && (
              <Button size="lg" onClick={() => setDrawerTab('actions')}>
                Review Plan
              </Button>
            )}
          </>
        }
        footerFlexProps={{ justify: 'space-between', wrap: 'wrap' }}
      />
    </>
  )
}
