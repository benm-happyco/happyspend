import { Accordion, Alert, Badge, Box, Button, Chip, Divider, Group, Paper, Progress, SegmentedControl, SimpleGrid, Skeleton, Slider, Stack, Switch, Text, useComputedColorScheme, useMantineTheme } from '@mantine/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BarChart } from '@mantine/charts'
import '@mantine/charts/styles.css'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowRight02Icon,
  Briefcase03Icon,
  ChartLineData02Icon,
  Rocket01Icon,
  StarIcon,
  TimeScheduleIcon,
} from '@hugeicons/core-free-icons'
import { useInsightsPropertySelection } from '../contexts/InsightsPropertyContext'
import { supabaseMetrics } from '../lib/supabaseMetrics'
import { HpyPropertyMap } from '../theme/components/HpyPropertyMap'
import { UnavailableOutline } from '../theme/components/UnavailableOutline'
import { InsightsPageShell } from './InsightsPageShell'

type Vitals = {
  revenueNow: number | null
  revenuePrev: number | null
  capexNow: number | null
  capexPrev: number | null
  paybackYears: number | null
  paybackConfidencePct: number | null
  turnDaysNow: number | null
  turnDaysPrev: number | null
  riskClustersNow: number | null
  riskClustersPrev: number | null
  residentSentimentNow: number | null
  residentSentimentPrev: number | null
  bullets: string[]
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function toDateOnly(value: string): Date {
  // Interpret as local date to avoid timezone shifting YYYY-MM-DD
  return new Date(`${value}T00:00:00`)
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0..6 (Sun..Sat)
  const diff = (day + 6) % 7 // make Monday=0
  d.setDate(d.getDate() - diff)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function fmtDateOnly(value: Date): string {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getPreviousRange(startDate: string, endDate: string): { prevStart: string; prevEnd: string } {
  const start = toDateOnly(startDate)
  const end = toDateOnly(endDate)
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1)
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - days + 1)
  return { prevStart: fmtDateOnly(prevStart), prevEnd: fmtDateOnly(prevEnd) }
}

function asNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) ? n : null
}

function asDateKey(value: unknown): string | null {
  if (typeof value === 'string' && value.length >= 10) return value.slice(0, 10)
  return null
}

function formatCompactCurrency(value: number, opts?: { decimals?: number; suffix?: string }): string {
  const decimals = opts?.decimals ?? 0
  const suffix = opts?.suffix ?? ''
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(decimals)}m${suffix}`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(decimals)}k${suffix}`
  return `${sign}$${abs.toFixed(decimals)}${suffix}`
}

function formatCompactNumber(value: number, opts?: { decimals?: number; suffix?: string }): string {
  const decimals = opts?.decimals ?? 0
  const suffix = opts?.suffix ?? ''
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(decimals)}m${suffix}`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(decimals)}k${suffix}`
  return `${sign}${abs.toFixed(decimals)}${suffix}`
}

type SparkPoint = { period: string; value: number }

type InsightType = 'NOI Delta' | 'Risk Clusters' | 'Turn Bottlenecks' | 'Utilities Drift' | 'Resident Experience'

type PropertyInsights = {
  occupancyPct: number | null
  avgRent: number | null
  rentGrowthPct: number | null
  noiImpactAnnual: number | null
  riskClustersNow: number | null
  riskClustersPrev: number | null
  turnDaysNow: number | null
  utilitiesOpenNow: number | null
  utilitiesOpenPrev: number | null
  residentSentimentNow: number | null
  residentSentimentPrev: number | null
  residentSentimentDelta: number | null
  churnRiskLabel: 'LOW' | 'MEDIUM' | 'HIGH'
  insightTypes: InsightType[]
}

type PropertyLocationRow = {
  property_id: string
  name: string | null
  street: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  unit_count?: number | null
  market?: string | null
  class?: string | null
  type?: string | null
  latitude: number | null
  longitude: number | null
  insights?: PropertyInsights
}

function getWeekDateKeys(endDate: string): string[] {
  const end = toDateOnly(endDate)
  const start = startOfWeek(end) // Monday
  return Array.from({ length: 7 }, (_, i) => fmtDateOnly(addDays(start, i)))
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function takeLast(points: SparkPoint[], count: number): SparkPoint[] {
  if (points.length <= count) return points
  return points.slice(points.length - count)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeRandomSparkSeries(
  seedKey: string,
  weekDates: string[],
  opts: { min: number; max: number; drift?: number; volatility?: number; zeroChance?: number }
): SparkPoint[] {
  const min = opts.min
  const max = opts.max
  const drift = opts.drift ?? 0
  const volatility = opts.volatility ?? 0.22
  const zeroChance = opts.zeroChance ?? 0
  const rand = mulberry32(hashStringToUint32(seedKey))

  let level = min + rand() * (max - min)

  return weekDates.map((period, i) => {
    if (rand() < zeroChance) {
      return { period, value: 0 }
    }
    const shock = (rand() - 0.5) * volatility * (max - min)
    const driftStep = drift * (i / Math.max(1, weekDates.length - 1)) * (max - min)
    level = clamp(level + shock + driftStep, min, max)
    return { period, value: level }
  })
}

function MetricCard({
  icon,
  label,
  value,
  prevValue,
  deltaLabel,
  sparkData,
  sparkColor,
  loading,
  unavailable,
}: {
  icon: typeof ChartLineData02Icon
  label: string
  value: React.ReactNode
  prevValue?: React.ReactNode
  deltaLabel?: React.ReactNode
  sparkData?: SparkPoint[]
  sparkColor: string
  loading: boolean
  unavailable?: boolean
}) {
  return (
    <UnavailableOutline unavailable={unavailable} radius={16}>
      <Paper withBorder shadow="sm" radius="lg" p="lg" style={{ backgroundColor: 'var(--mantine-color-body)' }}>
        <Stack gap="md">
          <Group gap="sm" wrap="nowrap">
            <Box
              w={28}
              h={28}
              style={{
                borderRadius: 999,
                backgroundColor: 'var(--mantine-color-default-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <HugeiconsIcon icon={icon} size={16} color="var(--mantine-color-text)" />
            </Box>
            <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
              {label}
            </Text>
          </Group>

        {loading ? (
          <Stack gap="sm">
            <Skeleton height={28} width="70%" radius="sm" />
            <Skeleton height={18} width="40%" radius="sm" />
            <Skeleton height={14} width="55%" radius="sm" />
          </Stack>
        ) : (
          <Stack gap={10}>
            <Group gap="sm" align="baseline" wrap="nowrap">
              <Text fw={900} style={{ fontSize: 34, lineHeight: 1.05 }}>
                {value}
              </Text>
              {prevValue != null && (
                <Text
                  size="sm"
                  c="dimmed"
                  style={{
                    textDecoration: 'line-through',
                    textDecorationThickness: 2,
                    textDecorationColor: 'color-mix(in srgb, var(--mantine-color-text) 25%, transparent)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {prevValue}
                </Text>
              )}
            </Group>

            {deltaLabel != null && (
              <Badge
                variant="light"
                color="gray"
                radius="xl"
                styles={{ root: { width: 'fit-content' } }}
              >
                {deltaLabel}
              </Badge>
            )}
          </Stack>
        )}

        {sparkData && sparkData.length > 0 && (
          <Box style={{ marginTop: 'auto' }}>
            <BarChart
              h={58}
              data={sparkData}
              dataKey="period"
              series={[{ name: 'value', color: sparkColor }]}
              withLegend={false}
              withTooltip={false}
              gridAxis="none"
              tickLine="none"
              withXAxis={false}
              withYAxis={false}
              barProps={{ radius: 8, background: { fill: 'var(--mantine-color-default-hover)' } }}
              styles={{
                root: {
                  // Subtle background to match wireframe "rail"
                  backgroundColor: 'transparent',
                },
              }}
            />
          </Box>
        )}
        </Stack>
      </Paper>
    </UnavailableOutline>
  )
}

export function HpmStrategyPage() {
  const theme = useMantineTheme()
  const unavailable = true // strategy metrics are currently seeded/demo (not fully backed by live data feeds yet)
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const { selectedPropertyIds, dateRange } = useInsightsPropertySelection()
  const [loading, setLoading] = useState(false)
  const [vitalsError, setVitalsError] = useState<string | null>(null)
  const [mapLoading, setMapLoading] = useState(false)
  const [mapProperties, setMapProperties] = useState<PropertyLocationRow[]>([])
  const [vitals, setVitals] = useState<Vitals>({
    revenueNow: null,
    revenuePrev: null,
    capexNow: null,
    capexPrev: null,
    paybackYears: null,
    paybackConfidencePct: null,
    turnDaysNow: null,
    turnDaysPrev: null,
    riskClustersNow: null,
    riskClustersPrev: null,
    residentSentimentNow: null,
    residentSentimentPrev: null,
    bullets: [],
  })
  const requestIdRef = useRef(0)
  const mapRequestIdRef = useRef(0)

  const { prevStart, prevEnd } = useMemo(
    () => getPreviousRange(dateRange.startDate, dateRange.endDate),
    [dateRange.startDate, dateRange.endDate]
  )

  const sparkWeekDates = useMemo(() => getWeekDateKeys(dateRange.endDate), [dateRange.endDate])
  const sparkWeekStart = sparkWeekDates[0]
  const sparkWeekEnd = sparkWeekDates[sparkWeekDates.length - 1]

  const [sparks, setSparks] = useState<{
    noi: SparkPoint[]
    capex: SparkPoint[]
    turn: SparkPoint[]
    risk: SparkPoint[]
    sentiment: SparkPoint[]
  }>({ noi: [], capex: [], turn: [], risk: [], sentiment: [] })

  const onGeocoded = useCallback((args: { propertyId: string; latitude: number; longitude: number }) => {
    const { propertyId, latitude, longitude } = args

    // Update local state immediately so marker appears right away.
    setMapProperties((prev) =>
      prev.map((p) => (p.property_id === propertyId ? { ...p, latitude, longitude } : p))
    )

    // Best-effort persistence back to Supabase (depends on RLS).
    // Fire-and-forget to avoid blocking UI.
    void supabaseMetrics
      .from('properties')
      .update({ latitude, longitude })
      .eq('property_id', propertyId)
  }, [])

  useEffect(() => {
    const run = async () => {
      const reqId = ++mapRequestIdRef.current

      setMapLoading(true)
      try {
        const PAGE_SIZE = 1000
        let offset = 0
        let allRows: PropertyLocationRow[] = []
        let hasMore = true

        while (hasMore) {
          const res = await supabaseMetrics
            .from('properties')
            .select('*')
            .range(offset, offset + PAGE_SIZE - 1)

          if (reqId !== mapRequestIdRef.current) return

          const chunk = (res.data ?? []) as PropertyLocationRow[]
          allRows = allRows.concat(chunk)
          hasMore = chunk.length === PAGE_SIZE
          offset += PAGE_SIZE
        }

        if (reqId !== mapRequestIdRef.current) return

        const propertyIds = allRows.map((r) => r.property_id).filter((x): x is string => typeof x === 'string' && x.length > 0)

        const chunkIds = (ids: string[], size: number) => {
          const out: string[][] = []
          for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size))
          return out
        }

        const fetchInChunks = async (table: string, dateKey: string) => {
          const chunks = chunkIds(propertyIds, 500)
          const results = await Promise.all(
            chunks.map((ids) =>
              supabaseMetrics
                .from(table)
                .select('*')
                .in('property_id', ids)
                .gte(dateKey, prevStart)
                .lte(dateKey, dateRange.endDate)
            )
          )
          return results.flatMap((r) => (r.data ?? []) as Array<Record<string, unknown>>)
        }

        // Pull enough real data to compute "insights" per property.
        const [rentRows, occRows, turnsRows, workOrderRows, ratingRows] = await Promise.all([
          fetchInChunks('rent_snapshots', 'snapshot_date'),
          fetchInChunks('occupancy_snapshots', 'snapshot_date'),
          fetchInChunks('make_ready_turns', 'move_out_date'),
          fetchInChunks('work_orders', 'created_on'),
          fetchInChunks('resident_ratings', 'rating_month'),
        ])

        if (reqId !== mapRequestIdRef.current) return

        const latestByPropAndPeriod = <T extends Record<string, unknown>>(rows: T[], dateKey: string, start: string, end: string) => {
          const map = new Map<string, T>()
          rows.forEach((r) => {
            const pid = r.property_id as string | undefined
            const d = asDateKey(r[dateKey])
            if (!pid || !d) return
            if (d < start || d > end) return
            const prev = map.get(pid)
            const prevD = prev ? asDateKey(prev[dateKey]) : null
            if (!prevD || d > prevD) map.set(pid, r)
          })
          return map
        }

        const rentNowByProp = latestByPropAndPeriod(rentRows, 'snapshot_date', dateRange.startDate, dateRange.endDate)
        const rentPrevByProp = latestByPropAndPeriod(rentRows, 'snapshot_date', prevStart, prevEnd)
        const occNowByProp = latestByPropAndPeriod(occRows, 'snapshot_date', dateRange.startDate, dateRange.endDate)
        const occPrevByProp = latestByPropAndPeriod(occRows, 'snapshot_date', prevStart, prevEnd)

        const ratingNowByProp = latestByPropAndPeriod(ratingRows, 'rating_month', dateRange.startDate, dateRange.endDate)
        const ratingPrevByProp = latestByPropAndPeriod(ratingRows, 'rating_month', prevStart, prevEnd)

        const utilitiesKeywords = ['utility', 'utilities', 'water', 'electric', 'gas', 'sewer', 'leak', 'meter']

        const enriched: PropertyLocationRow[] = allRows.map((p) => {
          const pid = p.property_id
          const unitCount = typeof p.unit_count === 'number' ? p.unit_count : asNumber(p.unit_count) ?? null

          const rentNow = rentNowByProp.get(pid) as Record<string, unknown> | undefined
          const rentPrev = rentPrevByProp.get(pid) as Record<string, unknown> | undefined
          const occNow = occNowByProp.get(pid) as Record<string, unknown> | undefined
          const occPrev = occPrevByProp.get(pid) as Record<string, unknown> | undefined

          const avgRentNow = asNumber(rentNow?.avg_effective_rent ?? rentNow?.avg_asking_rent)
          const avgRentPrev = asNumber(rentPrev?.avg_effective_rent ?? rentPrev?.avg_asking_rent)

          const leasedNow = asNumber(occNow?.leased_units ?? occNow?.occupied_units)
          const leasedPrev = asNumber(occPrev?.leased_units ?? occPrev?.occupied_units)

          const occupancyPct =
            leasedNow != null && unitCount != null && unitCount > 0 ? clamp((leasedNow / unitCount) * 100, 0, 100) : null

          const rentGrowthPct =
            avgRentNow != null && avgRentPrev != null && avgRentPrev > 0 ? ((avgRentNow - avgRentPrev) / avgRentPrev) * 100 : null

          const revenueNow = (avgRentNow ?? 0) * (leasedNow ?? 0)
          const revenuePrev = (avgRentPrev ?? 0) * (leasedPrev ?? 0)
          const noiImpactAnnual = (revenueNow - revenuePrev) * 12

          const workOrdersFor = (start: string, end: string) =>
            workOrderRows.filter((r) => {
              const rPid = r.property_id as string | undefined
              if (rPid !== pid) return false
              const d = asDateKey(r.created_on)
              return d != null && d >= start && d <= end
            })

          const openWorkOrders = (rows: Array<Record<string, unknown>>) =>
            rows.filter((r) => {
              const status = String(r.status ?? '').toLowerCase()
              const completedOn = r.completed_on
              const isClosed = Boolean(completedOn) || status.includes('complete') || status.includes('closed')
              return !isClosed
            })

          const clusterCount = (rows: Array<Record<string, unknown>>) => {
            const counts = new Map<string, number>()
            rows.forEach((r) => {
              const cat = String(r.category ?? 'Uncategorized')
                .toLowerCase()
                .replace(/[\s_-]+/g, '')
              counts.set(cat, (counts.get(cat) ?? 0) + 1)
            })
            return Array.from(counts.values()).filter((n) => n >= 3).length
          }

          const woNow = openWorkOrders(workOrdersFor(dateRange.startDate, dateRange.endDate))
          const woPrev = openWorkOrders(workOrdersFor(prevStart, prevEnd))

          const utilitiesCount = (rows: Array<Record<string, unknown>>) =>
            rows.filter((r) => {
              const hay = `${r.category ?? ''} ${r.subcategory ?? ''} ${r.description ?? ''}`.toLowerCase()
              return utilitiesKeywords.some((k) => hay.includes(k))
            }).length

          const utilitiesOpenNow = utilitiesCount(woNow)
          const utilitiesOpenPrev = utilitiesCount(woPrev)

          const riskClustersNow = clusterCount(woNow)
          const riskClustersPrev = clusterCount(woPrev)

          const turnDurationsNow: number[] = []
          turnsRows.forEach((r) => {
            const rPid = r.property_id as string | undefined
            if (rPid !== pid) return
            const d = asDateKey(r.move_out_date)
            if (!d || d < dateRange.startDate || d > dateRange.endDate) return
            const readyKey = asDateKey(r.ready_date)
            if (!readyKey) return
            const move = toDateOnly(d)
            const ready = toDateOnly(readyKey)
            const days = (ready.getTime() - move.getTime()) / MS_PER_DAY
            if (Number.isFinite(days) && days >= 0 && days <= 180) turnDurationsNow.push(days)
          })
          const turnDaysNow = median(turnDurationsNow)

          const ratingNow = asNumber((ratingNowByProp.get(pid) as Record<string, unknown> | undefined)?.rating_value)
          const ratingPrev = asNumber((ratingPrevByProp.get(pid) as Record<string, unknown> | undefined)?.rating_value)
          const residentSentimentDelta = ratingNow != null && ratingPrev != null ? ratingNow - ratingPrev : null

          // Insight flags and "made-up" narrative derived from real data.
          const insightTypes: InsightType[] = []
          if (Math.abs(noiImpactAnnual) >= 50_000) insightTypes.push('NOI Delta')
          if (riskClustersNow >= 1) insightTypes.push('Risk Clusters')
          if (turnDaysNow != null && turnDaysNow >= 10) insightTypes.push('Turn Bottlenecks')
          if (utilitiesOpenNow - utilitiesOpenPrev >= 1 || utilitiesOpenNow >= 2) insightTypes.push('Utilities Drift')
          if ((ratingNow != null && ratingNow < 4.0) || (residentSentimentDelta != null && residentSentimentDelta <= -0.3)) {
            insightTypes.push('Resident Experience')
          }

          const riskScore =
            (riskClustersNow >= 2 ? 2 : riskClustersNow >= 1 ? 1 : 0) +
            (turnDaysNow != null && turnDaysNow >= 12 ? 2 : turnDaysNow != null && turnDaysNow >= 10 ? 1 : 0) +
            (utilitiesOpenNow >= 3 ? 2 : utilitiesOpenNow >= 1 ? 1 : 0) +
            (residentSentimentDelta != null && residentSentimentDelta <= -0.5 ? 2 : residentSentimentDelta != null && residentSentimentDelta <= -0.3 ? 1 : 0)

          const churnRiskLabel: PropertyInsights['churnRiskLabel'] = riskScore >= 5 ? 'HIGH' : riskScore >= 3 ? 'MEDIUM' : 'LOW'

          const insights: PropertyInsights = {
            occupancyPct,
            avgRent: avgRentNow,
            rentGrowthPct,
            noiImpactAnnual: Number.isFinite(noiImpactAnnual) ? noiImpactAnnual : null,
            riskClustersNow,
            riskClustersPrev,
            turnDaysNow,
            utilitiesOpenNow,
            utilitiesOpenPrev,
            residentSentimentNow: ratingNow,
            residentSentimentPrev: ratingPrev,
            residentSentimentDelta,
            churnRiskLabel,
            insightTypes,
          }

          return { ...p, insights }
        })

        setMapProperties(enriched)
      } finally {
        if (reqId === mapRequestIdRef.current) setMapLoading(false)
      }
    }

    run()
  }, [dateRange.startDate, dateRange.endDate, prevStart, prevEnd])

  useEffect(() => {
    const run = async () => {
      const reqId = ++requestIdRef.current

      if (selectedPropertyIds.length === 0) {
        setVitalsError(null)
        setVitals((prev) => ({ ...prev, bullets: [], revenueNow: null, revenuePrev: null, capexNow: null, capexPrev: null, paybackYears: null, paybackConfidencePct: null, turnDaysNow: null, turnDaysPrev: null, riskClustersNow: null, riskClustersPrev: null, residentSentimentNow: null, residentSentimentPrev: null }))
        setSparks({ noi: [], capex: [], turn: [], risk: [], sentiment: [] })
        return
      }

      setLoading(true)
      setVitalsError(null)

      try {
        const latestByPropAndPeriod = <T extends Record<string, unknown>>(
          rows: T[],
          dateKey: string,
          start: string,
          end: string
        ) => {
          const map = new Map<string, T>()
          rows.forEach((r) => {
            const pid = r.property_id as string | undefined
            const d = asDateKey(r[dateKey])
            if (!pid || !d) return
            if (d < start || d > end) return
            const prev = map.get(pid)
            const prevD = prev ? asDateKey(prev[dateKey]) : null
            if (!prevD || d > prevD) map.set(pid, r)
          })
          return map
        }

        // For the "headline" values we still use the selected date range (not just the week sparkline).
        // Fetch a wider window for those values.
        const [rentAllRes, occAllRes, capexAllRes, turnsAllRes, workOrdersAllRes, ratingsAllRes] = await Promise.all([
          supabaseMetrics
            .from('rent_snapshots')
            .select('*')
            .in('property_id', selectedPropertyIds)
            .gte('snapshot_date', prevStart)
            .lte('snapshot_date', dateRange.endDate),
          supabaseMetrics
            .from('occupancy_snapshots')
            .select('*')
            .in('property_id', selectedPropertyIds)
            .gte('snapshot_date', prevStart)
            .lte('snapshot_date', dateRange.endDate),
          supabaseMetrics
            .from('capital_projects')
            .select('*')
            .in('property_id', selectedPropertyIds)
            .gte('started_on', prevStart)
            .lte('started_on', dateRange.endDate),
          supabaseMetrics
            .from('make_ready_turns')
            .select('*')
            .in('property_id', selectedPropertyIds)
            .gte('move_out_date', prevStart)
            .lte('move_out_date', dateRange.endDate),
          supabaseMetrics
            .from('work_orders')
            .select('*')
            .in('property_id', selectedPropertyIds)
            .gte('created_on', prevStart)
            .lte('created_on', dateRange.endDate),
          supabaseMetrics
            .from('resident_ratings')
            .select('*')
            .in('property_id', selectedPropertyIds)
            .gte('rating_month', prevStart)
            .lte('rating_month', dateRange.endDate),
        ])

        if (reqId !== requestIdRef.current) return

        const rentAllRows = (rentAllRes.data ?? []) as Array<Record<string, unknown>>
        const occAllRows = (occAllRes.data ?? []) as Array<Record<string, unknown>>
        const capexAllRows = (capexAllRes.data ?? []) as Array<Record<string, unknown>>
        const turnAllRows = (turnsAllRes.data ?? []) as Array<Record<string, unknown>>
        const workOrderAllRows = (workOrdersAllRes.data ?? []) as Array<Record<string, unknown>>
        const ratingAllRows = (ratingsAllRes.data ?? []) as Array<Record<string, unknown>>

        const rentNowByProp = latestByPropAndPeriod(rentAllRows, 'snapshot_date', dateRange.startDate, dateRange.endDate)
        const rentPrevByProp = latestByPropAndPeriod(rentAllRows, 'snapshot_date', prevStart, prevEnd)
        const occNowByProp = latestByPropAndPeriod(occAllRows, 'snapshot_date', dateRange.startDate, dateRange.endDate)
        const occPrevByProp = latestByPropAndPeriod(occAllRows, 'snapshot_date', prevStart, prevEnd)

        const revenueFor = (rentRow?: Record<string, unknown>, occRow?: Record<string, unknown>) => {
          const rent = asNumber(rentRow?.avg_effective_rent ?? rentRow?.avg_asking_rent) ?? 0
          const occ = asNumber(occRow?.leased_units ?? occRow?.occupied_units) ?? 0
          return rent * occ
        }

        let revenueNow = 0
        let revenuePrev = 0

        selectedPropertyIds.forEach((pid) => {
          revenueNow += revenueFor(rentNowByProp.get(pid), occNowByProp.get(pid))
          revenuePrev += revenueFor(rentPrevByProp.get(pid), occPrevByProp.get(pid))
        })

        // Sparklines: use realistic-looking sample patterns (7 bars),
        // so the UI reads well even when real data is sparse.
        const seedBase = `${[...selectedPropertyIds].sort().join(',')}|${sparkWeekStart}|${sparkWeekEnd}|${dateRange.startDate}|${dateRange.endDate}`
        setSparks({
          noi: makeRandomSparkSeries(`${seedBase}|noi`, sparkWeekDates, { min: 40, max: 100, drift: 0.05, volatility: 0.18 }),
          capex: makeRandomSparkSeries(`${seedBase}|capex`, sparkWeekDates, { min: 0, max: 85, drift: 0.02, volatility: 0.28, zeroChance: 0.15 }),
          turn: makeRandomSparkSeries(`${seedBase}|turn`, sparkWeekDates, { min: 4, max: 16, volatility: 0.22 }),
          risk: makeRandomSparkSeries(`${seedBase}|risk`, sparkWeekDates, { min: 0, max: 7, volatility: 0.35, zeroChance: 0.25 }),
          sentiment: makeRandomSparkSeries(`${seedBase}|sentiment`, sparkWeekDates, { min: 3.5, max: 4.8, volatility: 0.12 }),
        })

        const capexNow = capexAllRows
          .filter((r) => {
            const d = asDateKey(r.started_on)
            return d != null && d >= dateRange.startDate && d <= dateRange.endDate
          })
          .reduce((acc, r) => acc + (asNumber(r.actual_usd ?? r.budget_usd) ?? 0), 0)

        const capexPrev = capexAllRows
          .filter((r) => {
            const d = asDateKey(r.started_on)
            return d != null && d >= prevStart && d <= prevEnd
          })
          .reduce((acc, r) => acc + (asNumber(r.actual_usd ?? r.budget_usd) ?? 0), 0)

        const turnDaysNow = (() => {
          const durations: number[] = []
          turnAllRows.forEach((r) => {
            const d = asDateKey(r.move_out_date)
            if (!d || d < dateRange.startDate || d > dateRange.endDate) return
            const move = toDateOnly(d)
            const readyKey = asDateKey(r.ready_date)
            if (!readyKey) return
            const ready = toDateOnly(readyKey)
            const days = (ready.getTime() - move.getTime()) / MS_PER_DAY
            if (Number.isFinite(days) && days >= 0 && days <= 180) durations.push(days)
          })
          return median(durations)
        })()

        const turnDaysPrev = (() => {
          const durations: number[] = []
          turnAllRows.forEach((r) => {
            const d = asDateKey(r.move_out_date)
            if (!d || d < prevStart || d > prevEnd) return
            const move = toDateOnly(d)
            const readyKey = asDateKey(r.ready_date)
            if (!readyKey) return
            const ready = toDateOnly(readyKey)
            const days = (ready.getTime() - move.getTime()) / MS_PER_DAY
            if (Number.isFinite(days) && days >= 0 && days <= 180) durations.push(days)
          })
          return median(durations)
        })()

        const riskClustersNow = (() => {
          const counts = new Map<string, number>()
          workOrderAllRows.forEach((r) => {
            const d = asDateKey(r.created_on)
            if (!d || d < dateRange.startDate || d > dateRange.endDate) return
            const status = String(r.status ?? '').toLowerCase()
            const completedOn = r.completed_on
            const isClosed = Boolean(completedOn) || status.includes('complete') || status.includes('closed')
            if (isClosed) return
            const cat = String(r.category ?? 'Uncategorized')
              .toLowerCase()
              .replace(/[\s_-]+/g, '')
            counts.set(cat, (counts.get(cat) ?? 0) + 1)
          })
          return Array.from(counts.values()).filter((n) => n >= 3).length
        })()

        const riskClustersPrev = (() => {
          const counts = new Map<string, number>()
          workOrderAllRows.forEach((r) => {
            const d = asDateKey(r.created_on)
            if (!d || d < prevStart || d > prevEnd) return
            const status = String(r.status ?? '').toLowerCase()
            const completedOn = r.completed_on
            const isClosed = Boolean(completedOn) || status.includes('complete') || status.includes('closed')
            if (isClosed) return
            const cat = String(r.category ?? 'Uncategorized')
              .toLowerCase()
              .replace(/[\s_-]+/g, '')
            counts.set(cat, (counts.get(cat) ?? 0) + 1)
          })
          return Array.from(counts.values()).filter((n) => n >= 3).length
        })()

        const residentSentimentNow = (() => {
          const byProp = new Map<string, { date: string; value: number }>()
          ratingAllRows.forEach((r) => {
            const pid = r.property_id as string | undefined
            const d = asDateKey(r.rating_month)
            if (!pid || !d || d < dateRange.startDate || d > dateRange.endDate) return
            const v = asNumber(r.rating_value)
            if (v == null) return
            const prev = byProp.get(pid)
            if (!prev || d > prev.date) byProp.set(pid, { date: d, value: v })
          })
          const vals = Array.from(byProp.values()).map((x) => x.value)
          if (vals.length === 0) return null
          return vals.reduce((a, b) => a + b, 0) / vals.length
        })()

        const residentSentimentPrev = (() => {
          const byProp = new Map<string, { date: string; value: number }>()
          ratingAllRows.forEach((r) => {
            const pid = r.property_id as string | undefined
            const d = asDateKey(r.rating_month)
            if (!pid || !d || d < prevStart || d > prevEnd) return
            const v = asNumber(r.rating_value)
            if (v == null) return
            const prev = byProp.get(pid)
            if (!prev || d > prev.date) byProp.set(pid, { date: d, value: v })
          })
          const vals = Array.from(byProp.values()).map((x) => x.value)
          if (vals.length === 0) return null
          return vals.reduce((a, b) => a + b, 0) / vals.length
        })()

        const revenueDelta = revenueNow - revenuePrev
        let paybackYears =
          capexNow > 0 && revenueDelta > 0 ? capexNow / Math.max(1, revenueDelta * 12) : null

        // Payback is often null when CapEx/NOI deltas are missing or not positive.
        // Provide a realistic, stable (per selection/date range) fallback in the requested range.
        const PAYBACK_MIN = 1.0
        const PAYBACK_MAX = 12.4
        if (paybackYears == null || !Number.isFinite(paybackYears)) {
          const seed = hashStringToUint32(
            `${[...selectedPropertyIds].sort().join(',')}|${dateRange.startDate}|${dateRange.endDate}`
          )
          const rand = mulberry32(seed)()
          paybackYears = PAYBACK_MIN + rand * (PAYBACK_MAX - PAYBACK_MIN)
        } else {
          paybackYears = clamp(paybackYears, PAYBACK_MIN, PAYBACK_MAX)
        }

        const completeness = (() => {
          let present = 0
          selectedPropertyIds.forEach((pid) => {
            if (rentNowByProp.has(pid) && occNowByProp.has(pid)) present += 1
          })
          return present / Math.max(1, selectedPropertyIds.length)
        })()

        const paybackConfidencePct = Math.round(60 + 35 * completeness)

        // Narrative bullets (computed from deltas)
        const bullets: string[] = []
        if (revenueDelta >= 0) {
          bullets.push(
            `NOI proxy improved by ${formatCompactCurrency(revenueDelta, { decimals: 0, suffix: '/mo' })} vs previous period as effective rents and leased units increased.`
          )
        } else {
          bullets.push(
            `NOI proxy declined by ${formatCompactCurrency(Math.abs(revenueDelta), { decimals: 0, suffix: '/mo' })} vs previous period; review pricing and vacancy drivers in the selected set.`
          )
        }

        const capexDelta = capexNow - capexPrev
        if (Math.abs(capexDelta) > 0) {
          // derive top project type for this period
          const typeCounts = new Map<string, number>()
          capexAllRows.forEach((r) => {
            const d = asDateKey(r.started_on)
            if (!d || d < dateRange.startDate || d > dateRange.endDate) return
            const t = String(r.project_type ?? 'CapEx')
            typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1)
          })
          const topType = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]
          bullets.push(
            `CapEx spend ${capexDelta >= 0 ? 'increased' : 'decreased'} by ${formatCompactCurrency(Math.abs(capexDelta), {
              decimals: 0,
            })}${topType ? `, driven mainly by ${topType} projects.` : '.'}`
          )
        }

        if (turnDaysNow != null && turnDaysPrev != null) {
          const delta = turnDaysNow - turnDaysPrev
          bullets.push(
            `Turn time ${delta <= 0 ? 'improved' : 'worsened'} by ${Math.abs(delta).toFixed(1)} days (median) vs previous period.`
          )
        }

        if (riskClustersNow != null && riskClustersPrev != null) {
          const delta = riskClustersNow - riskClustersPrev
          bullets.push(
            `Open work-order clusters ${delta <= 0 ? 'fell' : 'rose'} from ${riskClustersPrev} to ${riskClustersNow}, reducing operational risk exposure.`
          )
        }

        if (residentSentimentNow != null && residentSentimentPrev != null) {
          const delta = residentSentimentNow - residentSentimentPrev
          bullets.push(
            `Resident sentiment moved ${delta >= 0 ? 'up' : 'down'} by ${Math.abs(delta).toFixed(1)} points, with maintenance response as a top driver.`
          )
        }

        setVitals({
          revenueNow,
          revenuePrev,
          capexNow,
          capexPrev,
          paybackYears,
          paybackConfidencePct,
          turnDaysNow,
          turnDaysPrev,
          riskClustersNow,
          riskClustersPrev,
          residentSentimentNow,
          residentSentimentPrev,
          bullets: bullets.slice(0, 4),
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setVitalsError(message)
        // Keep existing vitals values, but clear bullets so the panel can show the error.
        setVitals((prev) => ({ ...prev, bullets: [] }))
      } finally {
        if (reqId === requestIdRef.current) {
          // tiny delay to make recalculation feel intentional when toggling properties
          window.setTimeout(() => {
            if (reqId === requestIdRef.current) setLoading(false)
          }, 220)
        }
      }
    }

    run()
  }, [selectedPropertyIds, dateRange.startDate, dateRange.endDate, prevStart, prevEnd, sparkWeekStart, sparkWeekEnd, sparkWeekDates])

  const panelBg =
    colorScheme === 'dark'
      ? 'color-mix(in srgb, var(--mantine-color-dark-7) 80%, var(--mantine-color-body))'
      : 'color-mix(in srgb, var(--mantine-color-violet-0) 70%, var(--mantine-color-body))'

  const revenueNowLabel =
    vitals.revenueNow == null ? '—' : `${formatCompactCurrency(vitals.revenueNow, { decimals: 0 })}/mo`
  const revenuePrevLabel =
    vitals.revenuePrev == null ? undefined : `${formatCompactCurrency(vitals.revenuePrev, { decimals: 0 })}/mo`
  const revenueDeltaLabel =
    vitals.revenueNow != null && vitals.revenuePrev != null
      ? `${vitals.revenueNow - vitals.revenuePrev >= 0 ? '+' : '-'}${formatCompactCurrency(Math.abs(vitals.revenueNow - vitals.revenuePrev), {
          decimals: 0,
          suffix: '/mo',
        })}`
      : undefined

  const capexNowLabel = vitals.capexNow == null ? '—' : formatCompactCurrency(vitals.capexNow, { decimals: 0 })
  const capexPrevLabel = vitals.capexPrev == null ? undefined : formatCompactCurrency(vitals.capexPrev, { decimals: 0 })
  const capexDeltaLabel =
    vitals.capexNow != null && vitals.capexPrev != null
      ? `${vitals.capexNow - vitals.capexPrev >= 0 ? '+' : '-'}${formatCompactCurrency(Math.abs(vitals.capexNow - vitals.capexPrev), {
          decimals: 0,
        })}`
      : undefined

  const paybackLabel = vitals.paybackYears == null ? '—' : `${vitals.paybackYears.toFixed(vitals.paybackYears < 3 ? 1 : 0)} years`
  const paybackSubLabel = vitals.paybackConfidencePct == null ? undefined : `${vitals.paybackConfidencePct}% confidence`

  const turnNowLabel = vitals.turnDaysNow == null ? '—' : `${vitals.turnDaysNow.toFixed(1)}d`
  const turnPrevLabel = vitals.turnDaysPrev == null ? undefined : `${vitals.turnDaysPrev.toFixed(1)}d`
  const turnDeltaLabel =
    vitals.turnDaysNow != null && vitals.turnDaysPrev != null
      ? `${vitals.turnDaysNow - vitals.turnDaysPrev >= 0 ? '+' : '-'}${Math.abs(vitals.turnDaysNow - vitals.turnDaysPrev).toFixed(1)}d`
      : undefined

  const riskNowLabel = vitals.riskClustersNow == null ? '—' : `${vitals.riskClustersNow} clusters`
  const riskPrevLabel = vitals.riskClustersPrev == null ? undefined : `${vitals.riskClustersPrev} clusters`
  const riskDeltaLabel =
    vitals.riskClustersNow != null && vitals.riskClustersPrev != null
      ? `${vitals.riskClustersNow - vitals.riskClustersPrev >= 0 ? '+' : '-'}${Math.abs(vitals.riskClustersNow - vitals.riskClustersPrev)} clusters`
      : undefined

  const sentimentNowLabel = vitals.residentSentimentNow == null ? '—' : vitals.residentSentimentNow.toFixed(1)
  const sentimentPrevLabel = vitals.residentSentimentPrev == null ? undefined : vitals.residentSentimentPrev.toFixed(1)
  const sentimentDeltaLabel =
    vitals.residentSentimentNow != null && vitals.residentSentimentPrev != null
      ? `${vitals.residentSentimentNow - vitals.residentSentimentPrev >= 0 ? '+' : '-'}${Math.abs(vitals.residentSentimentNow - vitals.residentSentimentPrev).toFixed(1)}`
      : undefined

  const noiSpark = sparks.noi
  const capexSpark = sparks.capex
  const turnSpark = sparks.turn
  const riskSpark = sparks.risk
  const sentimentSpark = sparks.sentiment

  const sectionSurface = 'var(--mantine-color-body)'
  const sectionBorder = 'var(--mantine-color-default-border)'
  const sectionMuted = 'var(--mantine-color-dimmed)'

  function RenovationProgramContent() {
    type ProgramType = 'Light' | 'Standard' | 'Premium'
    type Targeting = 'Highest rent upside' | 'Worst sentiment' | 'High maintenance' | 'Upcoming turns'

    const [programType, setProgramType] = useState<ProgramType>('Standard')
    const [targetUnits, setTargetUnits] = useState<number>(120)
    const [targeting, setTargeting] = useState<Targeting>('Highest rent upside')

    const lift = useMemo(() => {
      // Fake-but-realistic lift assumptions to match the mock.
      const baseByProgram: Record<ProgramType, { rent: number; occ: number; churn: number; sentiment: number }> = {
        Light: { rent: 4, occ: 1, churn: -8, sentiment: 0.3 },
        Standard: { rent: 8, occ: 2, churn: -15, sentiment: 0.6 },
        Premium: { rent: 12, occ: 3, churn: -22, sentiment: 0.9 },
      }

      const stratAdj: Record<Targeting, { rent: number; occ: number; churn: number; sentiment: number }> = {
        'Highest rent upside': { rent: 2, occ: 0, churn: -2, sentiment: 0.0 },
        'Worst sentiment': { rent: 0, occ: 1, churn: -4, sentiment: 0.4 },
        'High maintenance': { rent: 0, occ: 0, churn: -3, sentiment: 0.2 },
        'Upcoming turns': { rent: 1, occ: 1, churn: -1, sentiment: 0.1 },
      }

      const scale = clamp((targetUnits - 20) / (200 - 20), 0, 1)
      const scaleAdj = {
        rent: Math.round(scale * 1),
        occ: Math.round(scale * 1),
        churn: -Math.round(scale * 2),
        sentiment: Number((scale * 0.1).toFixed(1)),
      }

      const base = baseByProgram[programType]
      const adj = stratAdj[targeting]

      return {
        rent: base.rent + adj.rent + scaleAdj.rent,
        occ: base.occ + adj.occ + scaleAdj.occ,
        churn: base.churn + adj.churn + scaleAdj.churn,
        sentiment: Number((base.sentiment + adj.sentiment + scaleAdj.sentiment).toFixed(1)),
      }
    }, [programType, targetUnits, targeting])

    return (
      <Stack gap="md">
        <Stack gap={10}>
          <Text fw={900} size="lg">
            Program Type
          </Text>
          <SegmentedControl
            fullWidth
            radius="xl"
            value={programType}
            onChange={(v) => setProgramType(v as ProgramType)}
            data={['Light', 'Standard', 'Premium']}
            styles={{ label: { fontWeight: 800 } }}
          />
        </Stack>

        <Paper
          radius="lg"
          p="lg"
          style={{
            background: sectionSurface,
            border: `1px solid ${sectionBorder}`,
          }}
        >
          <Stack gap="md">
            <Group justify="space-between" align="baseline">
              <Text fw={900} size="lg">
                Target Units
              </Text>
              <Text fw={900} size="lg" style={{ color: 'var(--mantine-color-blue-6)' }}>
                {targetUnits}
              </Text>
            </Group>

            <Slider
              value={targetUnits}
              onChange={setTargetUnits}
              min={20}
              max={200}
              step={5}
              radius="xl"
              styles={{
                track: { background: 'color-mix(in srgb, var(--mantine-color-default-border) 80%, transparent)' },
                bar: { background: 'var(--mantine-color-blue-6)' },
                thumb: { borderColor: 'var(--mantine-color-blue-6)' },
              }}
            />

            <Group justify="space-between">
              <Text size="sm" c="dimmed" fw={700}>
                20
              </Text>
              <Text size="sm" c="dimmed" fw={700}>
                200
              </Text>
            </Group>
          </Stack>
        </Paper>

        <Stack gap={10}>
          <Text fw={900} size="lg">
            Targeting Strategy
          </Text>

          <Chip.Group value={targeting} onChange={(v) => setTargeting(v as Targeting)} multiple={false}>
            <Group gap="sm">
              {(['Highest rent upside', 'Worst sentiment', 'High maintenance', 'Upcoming turns'] as const).map((v) => (
                <Chip
                  key={v}
                  value={v}
                  radius="xl"
                  variant="light"
                  styles={{ label: { fontWeight: 800, padding: '10px 14px' } }}
                >
                  {v}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Stack>

        <Paper
          radius="lg"
          p="lg"
          style={{
            border: '1px solid color-mix(in srgb, var(--mantine-color-success-6) 25%, var(--mantine-color-default-border))',
            background: 'var(--mantine-color-success-light)',
          }}
        >
          <Stack gap="md">
            <Text size="sm" fw={900} tt="uppercase" style={{ letterSpacing: '0.08em', color: 'var(--mantine-color-text)' }}>
              Expected Lift
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Group justify="space-between">
                <Text fw={800} style={{ color: 'color-mix(in srgb, var(--mantine-color-text) 65%, transparent)' }}>
                  Rent:
                </Text>
                <Text fw={900} style={{ color: 'var(--mantine-color-success-8)' }}>
                  +{lift.rent}%
                </Text>
              </Group>
              <Group justify="space-between">
                <Text fw={800} style={{ color: 'color-mix(in srgb, var(--mantine-color-text) 65%, transparent)' }}>
                  Occupancy:
                </Text>
                <Text fw={900} style={{ color: 'var(--mantine-color-success-8)' }}>
                  +{lift.occ}%
                </Text>
              </Group>
              <Group justify="space-between">
                <Text fw={800} style={{ color: 'color-mix(in srgb, var(--mantine-color-text) 65%, transparent)' }}>
                  Churn:
                </Text>
                <Text fw={900} style={{ color: 'var(--mantine-color-success-8)' }}>
                  {lift.churn}%
                </Text>
              </Group>
              <Group justify="space-between">
                <Text fw={800} style={{ color: 'color-mix(in srgb, var(--mantine-color-text) 65%, transparent)' }}>
                  Sentiment:
                </Text>
                <Text fw={900} style={{ color: 'var(--mantine-color-success-8)' }}>
                  +{lift.sentiment}
                </Text>
              </Group>
            </SimpleGrid>
          </Stack>
        </Paper>
      </Stack>
    )
  }

  function CapexAllocationContent() {
    type Approach = 'De-risk' | 'Grow NOI'

    const [totalBudget, setTotalBudget] = useState<number>(2_400_000)
    const [approach, setApproach] = useState<Approach>('De-risk')

    const budgetLabel = useMemo(() => {
      const m = totalBudget / 1_000_000
      return m >= 1 ? `$${m.toFixed(m < 10 ? 1 : 0)}M` : `$${Math.round(totalBudget / 1_000)}k`
    }, [totalBudget])

    const allocation = useMemo(() => {
      // Fake-but-plausible split that shifts slightly by approach.
      const base =
        approach === 'De-risk'
          ? [
              { label: 'Envelope', pct: 30 },
              { label: 'HVAC', pct: 25 },
              { label: 'Plumbing', pct: 20 },
              { label: 'Interiors', pct: 15 },
              { label: 'Amenities', pct: 10 },
            ]
          : [
              { label: 'Envelope', pct: 22 },
              { label: 'HVAC', pct: 20 },
              { label: 'Plumbing', pct: 18 },
              { label: 'Interiors', pct: 25 },
              { label: 'Amenities', pct: 15 },
            ]

      // Ensure sums to 100 even if we tweak later.
      const sum = base.reduce((a, b) => a + b.pct, 0)
      const normalized = base.map((x) => ({ ...x, pct: Math.round((x.pct / sum) * 100) }))
      const normalizedSum = normalized.reduce((a, b) => a + b.pct, 0)
      if (normalizedSum !== 100) {
        normalized[0] = { ...normalized[0], pct: normalized[0].pct + (100 - normalizedSum) }
      }
      return normalized
    }, [approach])

    return (
      <Stack gap="lg">
        <Paper withBorder radius="xl" p="lg" style={{ background: sectionSurface, borderColor: sectionBorder }}>
          <Stack gap="md">
            <Group justify="space-between" align="baseline">
              <Text fw={900} size="lg">
                Total Budget
              </Text>
              <Text fw={900} size="lg" style={{ color: 'var(--mantine-color-blue-6)' }}>
                {budgetLabel}
              </Text>
            </Group>

            <Slider
              value={totalBudget}
              onChange={setTotalBudget}
              min={1_000_000}
              max={5_000_000}
              step={50_000}
              radius="xl"
              styles={{
                track: { background: 'color-mix(in srgb, var(--mantine-color-default-border) 80%, transparent)' },
                bar: { background: 'var(--mantine-color-blue-6)' },
                thumb: { borderColor: 'var(--mantine-color-blue-6)' },
              }}
            />

            <Group justify="space-between">
              <Text size="sm" c="dimmed" fw={700}>
                $1.0M
              </Text>
              <Text size="sm" c="dimmed" fw={700}>
                $5.0M
              </Text>
            </Group>
          </Stack>
        </Paper>

        <Stack gap="sm">
          <Text fw={900} size="lg">
            Allocation
          </Text>

          <Stack gap="sm">
            {allocation.map((row) => (
              <Group key={row.label} gap="md" wrap="nowrap" align="center">
                <Text fw={700} style={{ width: 120, flexShrink: 0 }}>
                  {row.label}
                </Text>
                <Box style={{ flex: 1 }}>
                  <Progress
                    value={row.pct}
                    radius="xl"
                    size="lg"
                    styles={{
                      root: { background: 'color-mix(in srgb, var(--mantine-color-default-hover) 65%, transparent)' },
                      section: { background: 'var(--mantine-color-violet-6)' },
                    }}
                  />
                </Box>
                <Text fw={900} style={{ width: 44, textAlign: 'right', flexShrink: 0 }}>
                  {row.pct}%
                </Text>
              </Group>
            ))}
          </Stack>
        </Stack>

        <Stack gap="sm">
          <Text fw={900} size="lg">
            Approach
          </Text>
          <SegmentedControl
            fullWidth
            radius="xl"
            value={approach}
            onChange={(v) => setApproach(v as Approach)}
            data={['De-risk', 'Grow NOI']}
            styles={{
              root: { background: 'var(--mantine-color-default-hover)' },
              indicator: {
                background: sectionSurface,
                boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
              },
              label: { fontWeight: 900, fontSize: 18 },
            }}
          />
        </Stack>
      </Stack>
    )
  }

  function OperationalLeversContent() {
    const [vendorConsolidation, setVendorConsolidation] = useState(true)
    const [turnProcessImprovements, setTurnProcessImprovements] = useState(true)
    const [utilitiesOptimization, setUtilitiesOptimization] = useState(false)
    const [compliancePostureUpdate, setCompliancePostureUpdate] = useState(false)

    const row = (label: string, checked: boolean, onChange: (next: boolean) => void) => (
      <Group key={label} justify="space-between" align="center" wrap="nowrap">
        <Text fw={700} style={{ flex: 1 }}>
          {label}
        </Text>
        <Switch checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} />
      </Group>
    )

    return (
      <Stack gap="md">
        {row('Vendor consolidation', vendorConsolidation, setVendorConsolidation)}
        {row('Turn process improvements', turnProcessImprovements, setTurnProcessImprovements)}
        {row('Utilities optimization', utilitiesOptimization, setUtilitiesOptimization)}
        {row('Compliance posture update', compliancePostureUpdate, setCompliancePostureUpdate)}
      </Stack>
    )
  }

  function ImpactWaterfallContent() {
    const rows = [
      { label: 'Renovations', value: 280_000, pct: 68, gradient: 'linear-gradient(90deg, var(--mantine-color-blue-6), var(--mantine-color-violet-6))' },
      { label: 'CapEx Risk Avoidance', value: 140_000, pct: 35, gradient: 'linear-gradient(90deg, var(--mantine-color-cyan-6), var(--mantine-color-blue-6))' },
      { label: 'Vendor Improvements', value: 40_000, pct: 9, gradient: 'linear-gradient(90deg, var(--mantine-color-teal-6), var(--mantine-color-teal-5))' },
      { label: 'Utilities Optimization', value: 20_000, pct: 4, gradient: 'linear-gradient(90deg, var(--mantine-color-green-6), var(--mantine-color-green-5))' },
    ] as const

    const total = rows.reduce((acc, r) => acc + r.value, 0)

    return (
      <Stack gap="lg">
        {rows.map((r) => {
          const amount = formatCompactCurrency(r.value, { decimals: 0 })
          return (
            <Stack key={r.label} gap={8}>
              <Group justify="space-between" align="center" wrap="nowrap">
                <Text fw={900} size="sm" style={{ letterSpacing: '0.02em' }}>
                  {r.label}
                </Text>
                <Text fw={900} size="sm" c="dimmed">
                  +{amount}
                </Text>
              </Group>

              <Box
                style={{
                  height: 32,
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: 'var(--mantine-color-default-hover)',
                  border: `1px solid ${sectionBorder}`,
                }}
              >
                <Box
                  style={{
                    width: `${r.pct}%`,
                    height: '100%',
                    borderRadius: 14,
                    background: r.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 12,
                    color: 'var(--mantine-color-white)',
                    fontWeight: 900,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.pct >= 22 ? amount : null}
                </Box>
              </Box>
            </Stack>
          )
        })}

        <Divider />

        <Group justify="space-between" align="baseline">
          <Text fw={900} size="lg">
            Total NOI Impact
          </Text>
          <Text fw={900} style={{ fontSize: 34, color: 'var(--mantine-color-success-7)', lineHeight: 1.05 }}>
            +{formatCompactCurrency(total, { decimals: 0 })}/mo
          </Text>
        </Group>
      </Stack>
    )
  }

  function PaybackLadderContent() {
    const items = [
      { title: 'Standard Renovations (120 units)', paybackYears: 2.1, confidencePct: 92, dot: 'var(--mantine-color-success-6)' as const },
      { title: 'Envelope CapEx (Cluster A)', paybackYears: 3.4, confidencePct: 78, dot: 'var(--mantine-color-yellow-6)' as const, tag: { label: 'Approval', color: 'yellow' as const } },
      { title: 'Vendor Consolidation', paybackYears: 1.2, confidencePct: 85, dot: 'var(--mantine-color-danger-6)' as const, note: 'At Risk' },
      { title: 'Turn Process Optimization', paybackYears: 0.8, confidencePct: 88, dot: 'var(--mantine-color-success-6)' as const },
    ] as const

    return (
      <Stack gap="sm">
        {items.map((it) => (
          <Paper
            key={it.title}
            withBorder
            shadow="sm"
            radius="lg"
            p="lg"
            style={{
              background: 'var(--mantine-color-body)',
              borderColor: sectionBorder,
            }}
          >
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={8} style={{ minWidth: 0 }}>
                <Text fw={900} size="lg" style={{ lineHeight: 1.2 }}>
                  {it.title}
                </Text>
                <Group gap="sm" c="dimmed" wrap="wrap">
                  <Text size="sm" fw={700} c="dimmed">
                    Payback:
                  </Text>
                  <Text size="sm" fw={900} style={{ color: 'var(--mantine-color-text)' }}>
                    {it.paybackYears.toFixed(1)}y
                  </Text>
                  <Text size="sm" fw={700} c="dimmed">
                    •
                  </Text>
                  <Group gap={8} wrap="nowrap">
                    <HugeiconsIcon icon={StarIcon} size={16} color="var(--mantine-color-success-6)" />
                    <Text size="sm" fw={800} c="dimmed">
                      {it.confidencePct}%
                    </Text>
                  </Group>
                </Group>
              </Stack>

              <Stack gap="sm" align="flex-end" style={{ flexShrink: 0 }}>
                <Box w={14} h={14} style={{ borderRadius: 999, background: it.dot }} />
                {it.tag ? (
                  <Badge color={it.tag.color} variant="light" radius="xl" styles={{ root: { textTransform: 'none', fontWeight: 800 } }}>
                    {it.tag.label}
                  </Badge>
                ) : it.note ? (
                  <Text size="sm" fw={800} c="dimmed">
                    {it.note}
                  </Text>
                ) : null}
              </Stack>
            </Group>
          </Paper>
        ))}
      </Stack>
    )
  }

  function ResidentVoiceShiftContent() {
    const before = vitals.residentSentimentPrev
    const after = vitals.residentSentimentNow
    const hasData = before != null && after != null && Number.isFinite(before) && Number.isFinite(after)
    const delta = hasData ? after - before : null
    const deltaLabel = delta == null ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts`
    const deltaColor = delta == null ? 'var(--mantine-color-dimmed)' : delta >= 0 ? 'var(--mantine-color-success-7)' : 'var(--mantine-color-danger-7)'

    const min = 0
    const max = 5
    const toPct = (v: number) => clamp((v / max) * 100, 0, 100)
    const currentPct = hasData ? toPct(after) : 0
    const prevPct = hasData ? toPct(before) : 0

    const zoneTone = hasData ? (after >= 4 ? 'good' : after >= 3 ? 'warn' : 'bad') : 'warn'
    const fillColor =
      zoneTone === 'good'
        ? 'color-mix(in srgb, var(--mantine-color-success-6) 35%, transparent)'
        : zoneTone === 'warn'
          ? 'color-mix(in srgb, var(--mantine-color-yellow-6) 35%, transparent)'
          : 'color-mix(in srgb, var(--mantine-color-danger-6) 35%, transparent)'
    const markerColor = 'color-mix(in srgb, var(--mantine-color-text) 85%, transparent)'

    return (
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text size="sm" c="dimmed">
              Avg resident satisfaction
            </Text>
            <Text fw={900} size="lg">
              {hasData ? `${after.toFixed(1)}/5` : '—'}
            </Text>
          </Stack>

          <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
            <Group gap={6} wrap="nowrap">
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={16}
                style={{
                  transform: delta != null && delta >= 0 ? 'rotate(180deg)' : undefined,
                  color: deltaColor,
                }}
              />
              <Text size="sm" fw={900} style={{ color: deltaColor }}>
                {deltaLabel}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              vs last period
            </Text>
          </Stack>
        </Group>

        {loading ? (
          <Skeleton height={140} radius="md" />
        ) : !hasData ? (
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
            No resident ratings found for the selected properties in this period.
          </Text>
        ) : (
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                0
              </Text>
              <Group gap="xs" wrap="nowrap">
                <Text size="xs" c="dimmed">
                  Previous period
                </Text>
                <Box w={8} h={8} style={{ borderRadius: 999, background: markerColor }} />
                <Text size="xs" c="dimmed">
                  Current
                </Text>
                <Box w={10} h={10} style={{ borderRadius: 3, background: fillColor, border: `1px solid ${sectionBorder}` }} />
              </Group>
              <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                5
              </Text>
            </Group>

            <Box
              style={{
                position: 'relative',
                height: 44,
                borderRadius: 14,
                overflow: 'hidden',
                border: `1px solid ${sectionBorder}`,
                background: 'var(--mantine-color-default-hover)',
              }}
            >
              {/* Current filled bar */}
              <Box
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: `${currentPct}%`,
                  background: fillColor,
                  borderRight: `1px solid ${sectionBorder}`,
                }}
              />

              {/* Previous marker */}
              <Box
                style={{
                  position: 'absolute',
                  top: 6,
                  bottom: 6,
                  left: `${prevPct}%`,
                  width: 2,
                  borderRadius: 999,
                  background: markerColor,
                  transform: 'translateX(-1px)',
                  boxShadow: `0 0 0 2px color-mix(in srgb, var(--mantine-color-body) 65%, transparent)`,
                }}
              />

              {/* Current label */}
              <Text
                size="xs"
                fw={900}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `min(calc(${currentPct}% + 10px), calc(100% - 48px))`,
                  transform: 'translateY(-50%)',
                  color: 'var(--mantine-color-text)',
                  background: 'color-mix(in srgb, var(--mantine-color-body) 70%, transparent)',
                  border: `1px solid ${sectionBorder}`,
                  padding: '2px 6px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}
              >
                {after.toFixed(1)}
              </Text>
            </Box>
          </Stack>
        )}
      </Stack>
    )
  }

  function ResidentVoiceExperienceSignalsContent() {
    const min = 0
    const max = 5

    const portfolioScore = vitals.residentSentimentNow ?? 3.9
    const peerMedian = 3.4
    const bestInClass = 4.8

    const toPct = (v: number) => clamp((v / max) * 100, 0, 100)
    const portfolioPct = toPct(portfolioScore)
    const peerPct = toPct(peerMedian)
    const bestPct = toPct(bestInClass)

    const fillColor = 'color-mix(in srgb, var(--mantine-color-purple-6) 35%, transparent)'
    const portfolioMarkerColor = 'var(--mantine-color-purple-7)'
    const peerMarkerColor = 'color-mix(in srgb, var(--mantine-color-text) 82%, transparent)'
    const bestMarkerColor = 'color-mix(in srgb, var(--mantine-color-text) 82%, transparent)'

    const drivers = [
      { rank: 1, label: 'Maintenance response time', trend: 'down' as const, evidence: true },
      { rank: 2, label: 'Noise / HVAC issues', trend: 'down' as const, evidence: true },
      { rank: 3, label: 'Common area cleanliness', trend: 'up' as const, evidence: true },
    ] as const

    const coverage = [
      { label: 'Reviews', on: true },
      { label: 'Surveys', on: true },
      { label: 'Call Notes', on: true },
      { label: 'Tickets', on: true },
      { label: 'Inspections', on: false },
    ] as const

    return (
      <Paper withBorder shadow="sm" radius="lg" p="lg" style={{ backgroundColor: sectionSurface, borderColor: sectionBorder }}>
        <Stack gap="lg">
          <Text fw={900} size="lg">
            Resident Voice &amp; Experience Signals
          </Text>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {/* Portfolio Sentiment Distribution */}
            <Stack gap="sm">
              <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Portfolio Sentiment Distribution
              </Text>

              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                    0
                  </Text>
                  <Group gap="md" wrap="wrap" justify="center">
                    <Group gap={6} wrap="nowrap">
                      <Box w={8} h={8} style={{ borderRadius: 999, background: portfolioMarkerColor }} />
                      <Text size="xs" c="dimmed">
                        Portfolio
                      </Text>
                    </Group>
                    <Group gap={6} wrap="nowrap">
                      <Box w={8} h={8} style={{ borderRadius: 999, background: peerMarkerColor }} />
                      <Text size="xs" c="dimmed">
                        Peer median (3.4)
                      </Text>
                    </Group>
                    <Group gap={6} wrap="nowrap">
                      <Box w={8} h={8} style={{ borderRadius: 999, background: bestMarkerColor }} />
                      <Text size="xs" c="dimmed">
                        Best in class (4.8)
                      </Text>
                    </Group>
                  </Group>
                  <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                    5
                  </Text>
                </Group>

                <Box
                  style={{
                    position: 'relative',
                    height: 44,
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: `1px solid ${sectionBorder}`,
                    background: 'var(--mantine-color-default-hover)',
                  }}
                >
                  {/* Portfolio filled bar */}
                  <Box
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: `${portfolioPct}%`,
                      background: fillColor,
                      borderRight: `1px solid ${sectionBorder}`,
                    }}
                  />

                  {/* Peer median marker */}
                  <Box
                    style={{
                      position: 'absolute',
                      top: 6,
                      bottom: 6,
                      left: `${peerPct}%`,
                      width: 2,
                      borderRadius: 999,
                      background: peerMarkerColor,
                      transform: 'translateX(-1px)',
                      boxShadow: `0 0 0 2px color-mix(in srgb, var(--mantine-color-body) 65%, transparent)`,
                    }}
                  />

                  {/* Best-in-class marker */}
                  <Box
                    style={{
                      position: 'absolute',
                      top: 6,
                      bottom: 6,
                      left: `${bestPct}%`,
                      width: 2,
                      borderRadius: 999,
                      background: bestMarkerColor,
                      transform: 'translateX(-1px)',
                      boxShadow: `0 0 0 2px color-mix(in srgb, var(--mantine-color-body) 65%, transparent)`,
                    }}
                  />

                  {/* Portfolio marker */}
                  <Box
                    style={{
                      position: 'absolute',
                      top: 4,
                      bottom: 4,
                      left: `${portfolioPct}%`,
                      width: 3,
                      borderRadius: 999,
                      background: portfolioMarkerColor,
                      transform: 'translateX(-1px)',
                      boxShadow: `0 0 0 2px color-mix(in srgb, var(--mantine-color-body) 65%, transparent)`,
                    }}
                  />

                  {/* Portfolio value label */}
                  <Text
                    size="xs"
                    fw={900}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: `min(calc(${portfolioPct}% + 10px), calc(100% - 56px))`,
                      transform: 'translateY(-50%)',
                      color: 'var(--mantine-color-text)',
                      background: 'color-mix(in srgb, var(--mantine-color-body) 70%, transparent)',
                      border: `1px solid ${sectionBorder}`,
                      padding: '2px 6px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {portfolioScore.toFixed(1)}
                  </Text>
                </Box>
              </Stack>

              <Group justify="space-between">
                <Text size="xs" c="dimmed" fw={700}>
                  {min.toFixed(0)} Poor
                </Text>
                <Text size="xs" c="dimmed" fw={700}>
                  {max.toFixed(0)} Excellent
                </Text>
              </Group>
            </Stack>

            {/* Top 3 Experience Drivers */}
            <Stack gap="sm">
              <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Top 3 Experience Drivers
              </Text>

              <Stack gap="sm">
                {drivers.map((d) => (
                  <Paper
                    key={d.rank}
                    withBorder
                    shadow="sm"
                    radius="lg"
                    p="sm"
                    style={{
                      background: 'var(--mantine-color-body)',
                      borderColor: sectionBorder,
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                        <Text c="dimmed" fw={900} size="sm" style={{ width: 22 }}>
                          #{d.rank}
                        </Text>
                        <Text fw={900} size="sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {d.label}
                        </Text>
                      </Group>

                      {d.evidence ? (
                        <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
                          <Text
                            fw={900}
                            size="xs"
                            style={{
                              color: 'var(--mantine-color-blue-7)',
                              cursor: 'pointer',
                              userSelect: 'none',
                            }}
                          >
                            Evidence
                          </Text>
                        </Group>
                      ) : null}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Stack>

            {/* Source Coverage */}
            <Stack gap="sm">
              <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Source Coverage
              </Text>

              <Group gap="sm">
                {coverage.map((c) => (
                  <Badge
                    key={c.label}
                    radius="xl"
                    variant={c.on ? 'light' : 'outline'}
                    color={c.on ? 'teal' : 'gray'}
                    styles={{ root: { textTransform: 'none', fontWeight: 900, padding: '7px 10px', fontSize: 12 } }}
                  >
                    {c.on ? `✓ ${c.label}` : c.label}
                  </Badge>
                ))}
              </Group>

              <Alert
                variant="light"
                color="yellow"
                radius="lg"
                icon={<HugeiconsIcon icon={Alert02Icon} size={18} color="var(--mantine-color-yellow-6)" />}
                styles={{
                  root: {
                    border: `1px solid color-mix(in srgb, var(--mantine-color-yellow-6) 35%, var(--mantine-color-default-border))`,
                  },
                  title: {
                    fontWeight: 900,
                  },
                }}
                title="Improve signal coverage"
              >
                Enable inspection data integration for deeper insights.
              </Alert>
            </Stack>
          </SimpleGrid>
        </Stack>
      </Paper>
    )
  }

  function RecommendedPlaybookContent() {
    const items = [
      {
        kind: 'renovation',
        approvalRequired: true,
        effort: { label: 'Medium Effort', color: 'yellow' as const },
        title: 'Renovate upcoming turns in high churn-risk buildings',
        metrics: [
          { label: 'NOI Impact', value: '+$280k/yr', tone: 'good' as const },
          { label: 'Sentiment', value: '+0.6', tone: 'neutral' as const },
          { label: 'Risk', value: '-4 clusters', tone: 'good' as const },
        ],
      },
      {
        kind: 'capex',
        approvalRequired: false,
        effort: { label: 'Low Effort', color: 'teal' as const },
        title: 'Prevent water intrusion: envelope inspections for Cluster A',
        metrics: [
          { label: 'NOI Impact', value: 'Avoid -$140k', tone: 'good' as const },
          { label: 'Sentiment', value: '+0.2', tone: 'neutral' as const },
          { label: 'Risk', value: '-8 units', tone: 'good' as const },
        ],
      },
      {
        kind: 'vendor',
        approvalRequired: true,
        effort: { label: 'Low Effort', color: 'teal' as const },
        title: 'Reassign vendor for turns in Austin region',
        metrics: [
          { label: 'NOI Impact', value: '+$40k/yr', tone: 'good' as const },
          { label: 'Sentiment', value: '+0.3', tone: 'neutral' as const },
          { label: 'Risk', value: 'Reduce SLA drift', tone: 'neutral' as const },
        ],
      },
    ] as const

    const metricColor = (tone: 'good' | 'bad' | 'neutral') => {
      if (tone === 'good') return 'var(--mantine-color-success-7)'
      if (tone === 'bad') return 'var(--mantine-color-danger-7)'
      return 'var(--mantine-color-text)'
    }

    return (
      <Stack gap="md">
        {items.map((it) => (
          <Paper
            key={it.title}
            withBorder
            shadow="sm"
            radius="lg"
            p="lg"
            style={{ backgroundColor: 'var(--mantine-color-body)', borderColor: sectionBorder }}
          >
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                  <Badge
                    radius="xl"
                    variant="light"
                    color="gray"
                    styles={{ root: { textTransform: 'none', fontWeight: 900 } }}
                  >
                    {it.kind}
                  </Badge>
                  {it.approvalRequired && (
                    <Text size="xs" fw={800} c="dimmed">
                      Approval required
                    </Text>
                  )}
                </Group>

                <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
                  <Badge
                    radius="xl"
                    variant="light"
                    color={it.effort.color}
                    styles={{ root: { textTransform: 'none', fontWeight: 900 } }}
                  >
                    {it.effort.label}
                  </Badge>
                  <Button
                    radius="xl"
                    color="violet"
                    leftSection={<HugeiconsIcon icon={Rocket01Icon} size={16} color="currentColor" />}
                  >
                    Start workflow
                  </Button>
                </Group>
              </Group>

              <Text fw={900} size="lg" style={{ lineHeight: 1.25 }}>
                {it.title}
              </Text>

              <Group justify="space-between" align="center" wrap="nowrap">
                <Group gap="md" wrap="wrap" c="dimmed">
                  {it.metrics.map((m, idx) => (
                    <Group key={m.label} gap={6} wrap="nowrap">
                      <Text size="sm" c="dimmed" fw={700}>
                        {m.label}:
                      </Text>
                      <Text size="sm" fw={900} style={{ color: metricColor(m.tone) }}>
                        {m.value}
                      </Text>
                      {idx < it.metrics.length - 1 && (
                        <Text size="sm" c="dimmed" fw={700} style={{ marginLeft: 8, marginRight: 8 }}>
                          |
                        </Text>
                      )}
                    </Group>
                  ))}
                </Group>

                <Group gap={6} wrap="nowrap" style={{ flexShrink: 0, color: 'var(--mantine-color-blue-7)' }}>
                  <Text size="sm" fw={900} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Review details
                  </Text>
                  <HugeiconsIcon icon={ArrowRight02Icon} size={16} color="currentColor" />
                </Group>
              </Group>
            </Stack>
          </Paper>
        ))}
      </Stack>
    )
  }

  function TradeoffsGuardrailsContent() {
    const items = [
      {
        tone: 'yellow',
        title: 'CapEx exceeds target by $180k',
        mitigation: 'Defer amenity upgrades to Q4',
      },
      {
        tone: 'red',
        title: 'Vendor capacity risk in Austin region',
        mitigation: 'Pre-contract backup vendor or phase rollout',
      },
      {
        tone: 'blue',
        title: 'Sentiment improvement not guaranteed due to low review volume',
        mitigation: 'Launch review campaign in Q3',
      },
    ] as const

    const tone = (t: (typeof items)[number]['tone']) => {
      if (t === 'yellow') {
        return {
          iconBg: 'var(--mantine-color-yellow-light)',
          iconColor: 'var(--mantine-color-yellow-7)',
          border: 'color-mix(in srgb, var(--mantine-color-yellow-6) 22%, var(--mantine-color-default-border))',
        }
      }
      if (t === 'red') {
        return {
          iconBg: 'var(--mantine-color-danger-light)',
          iconColor: 'var(--mantine-color-danger-7)',
          border: 'color-mix(in srgb, var(--mantine-color-danger-6) 18%, var(--mantine-color-default-border))',
        }
      }
      return {
        iconBg: 'color-mix(in srgb, var(--mantine-color-blue-1) 75%, transparent)',
        iconColor: 'var(--mantine-color-blue-7)',
        border: 'color-mix(in srgb, var(--mantine-color-blue-6) 18%, var(--mantine-color-default-border))',
      }
    }

    return (
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {items.map((it) => {
          const t = tone(it.tone)
          return (
            <Paper
              key={it.title}
              withBorder
              shadow="sm"
              radius="lg"
              p="lg"
              style={{
                backgroundColor: 'var(--mantine-color-body)',
                borderColor: t.border,
              }}
            >
              <Stack gap="sm">
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <Box
                    w={34}
                    h={34}
                    style={{
                      borderRadius: 12,
                      background: t.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <HugeiconsIcon icon={Alert02Icon} size={18} color={t.iconColor} />
                  </Box>

                  <Stack gap={6} style={{ minWidth: 0 }}>
                    <Text fw={900} size="sm" style={{ lineHeight: 1.35 }}>
                      {it.title}
                    </Text>

                    <Text size="sm" c="dimmed" style={{ lineHeight: 1.45 }}>
                      <Text span fw={900} style={{ color: 'var(--mantine-color-success-7)' }}>
                        Mitigation:
                      </Text>{' '}
                      {it.mitigation}
                    </Text>
                  </Stack>
                </Group>
              </Stack>
            </Paper>
          )
        })}
      </SimpleGrid>
    )
  }

  return (
    <InsightsPageShell title="Strategy">
      <Stack gap="lg">
        <Group gap="sm" align="center">
          <HugeiconsIcon icon={ChartLineData02Icon} size={18} color={theme.colors.green?.[6] ?? 'var(--mantine-color-success-6)'} />
          <Text fw={800} size="lg">
            Vital Signs
          </Text>
        </Group>

        <Paper withBorder radius="lg" p="lg" style={{ backgroundColor: panelBg }}>
          <SimpleGrid cols={{ base: 1, md: 4 }} spacing="lg">
            <Stack gap="lg">
              <MetricCard
                icon={ChartLineData02Icon}
                label="NOI delta"
                value={revenueNowLabel}
                prevValue={revenuePrevLabel}
                deltaLabel={revenueDeltaLabel}
                sparkData={noiSpark}
                sparkColor="var(--mantine-color-success-6)"
                loading={loading}
                unavailable={unavailable}
              />
              <MetricCard
                icon={TimeScheduleIcon}
                label="Turn time"
                value={turnNowLabel}
                prevValue={turnPrevLabel}
                deltaLabel={turnDeltaLabel}
                sparkData={turnSpark}
                sparkColor="var(--mantine-color-success-6)"
                loading={loading}
                unavailable={unavailable}
              />
            </Stack>

            <Stack gap="lg">
              <MetricCard
                icon={Briefcase03Icon}
                label="CapEx spend"
                value={capexNowLabel}
                prevValue={capexPrevLabel}
                deltaLabel={capexDeltaLabel}
                sparkData={capexSpark}
                sparkColor="var(--mantine-color-danger-6)"
                loading={loading}
                unavailable={unavailable}
              />
              <MetricCard
                icon={Alert02Icon}
                label="Risk exposure"
                value={riskNowLabel}
                prevValue={riskPrevLabel}
                deltaLabel={riskDeltaLabel}
                sparkData={riskSpark}
                sparkColor="var(--mantine-color-success-6)"
                loading={loading}
                unavailable={unavailable}
              />
            </Stack>

            <Stack gap="lg">
              <UnavailableOutline unavailable={unavailable} radius={16}>
                <Paper withBorder shadow="sm" radius="lg" p="lg" style={{ backgroundColor: 'var(--mantine-color-body)' }}>
                  <Stack gap="md" style={{ height: '100%' }}>
                  <Group gap="sm" wrap="nowrap">
                    <Box
                      w={28}
                      h={28}
                      style={{
                        borderRadius: 999,
                        backgroundColor: 'var(--mantine-color-default-hover)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <HugeiconsIcon icon={Rocket01Icon} size={16} color="var(--mantine-color-text)" />
                    </Box>
                    <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                      Payback
                    </Text>
                  </Group>
                  {loading ? (
                    <Stack gap="sm">
                      <Skeleton height={28} width="70%" radius="sm" />
                      <Skeleton height={16} width="50%" radius="sm" />
                    </Stack>
                  ) : (
                    <Stack gap="xs">
                      <Text fw={900} style={{ fontSize: 34, lineHeight: 1.05 }}>
                        {paybackLabel}
                      </Text>
                      {paybackSubLabel && (
                        <Group gap="xs">
                          <HugeiconsIcon icon={StarIcon} size={16} color="var(--mantine-color-green-6)" />
                          <Text size="sm" c="dimmed" fw={600}>
                            {paybackSubLabel}
                          </Text>
                        </Group>
                      )}
                    </Stack>
                  )}

                    {/* Reserve the same chart space as other metric cards for consistent row height */}
                    <Box h={58} style={{ marginTop: 'auto' }} />
                  </Stack>
                </Paper>
              </UnavailableOutline>

              <MetricCard
                icon={StarIcon}
                label="Resident sentiment"
                value={sentimentNowLabel}
                prevValue={sentimentPrevLabel}
                deltaLabel={sentimentDeltaLabel}
                sparkData={sentimentSpark}
                sparkColor="var(--mantine-color-success-6)"
                loading={loading}
                unavailable={unavailable}
              />
            </Stack>

            <UnavailableOutline unavailable={unavailable} radius={16}>
              <Paper withBorder shadow="sm" radius="lg" p="lg" style={{ backgroundColor: 'var(--mantine-color-body)' }}>
                <Stack gap="md">
                <Group gap="sm" wrap="nowrap">
                  <Box
                    w={28}
                    h={28}
                    style={{
                      borderRadius: 999,
                      backgroundColor: 'var(--mantine-color-default-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <HugeiconsIcon icon={Alert02Icon} size={16} color="var(--mantine-color-text)" />
                  </Box>
                  <Text fw={900} size="lg">
                    What Changed & Why
                  </Text>
                </Group>

                {loading ? (
                  <Stack gap="sm">
                    <Skeleton height={16} width="95%" radius="sm" />
                    <Skeleton height={16} width="92%" radius="sm" />
                    <Skeleton height={16} width="88%" radius="sm" />
                  </Stack>
                ) : vitalsError ? (
                  <Stack gap={6}>
                    <Text size="sm" fw={700} c="dimmed">
                      Couldn’t calculate strategy metrics.
                    </Text>
                    <Text size="xs" c="dimmed">
                      {vitalsError}
                    </Text>
                  </Stack>
                ) : vitals.bullets.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    Select properties to generate a strategy summary.
                  </Text>
                ) : (
                  <Stack gap="md">
                    {vitals.bullets.map((b, i) => (
                      <Group key={i} gap="sm" align="flex-start" wrap="nowrap">
                        <Text c="blue" fw={900} style={{ lineHeight: 1.2 }}>
                          •
                        </Text>
                        <Text size="sm" style={{ lineHeight: 1.5 }}>
                          {b}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                )}
                </Stack>
              </Paper>
            </UnavailableOutline>
          </SimpleGrid>
        </Paper>

        <HpyPropertyMap
          title="Portfolio map"
          properties={mapProperties}
          loading={mapLoading}
          height={380}
          onGeocoded={onGeocoded}
        />

        <Stack gap="md">
          <Group gap="sm" align="center">
            <HugeiconsIcon icon={Briefcase03Icon} size={18} color="var(--mantine-color-violet-6)" />
            <Text fw={800} size="lg">
              Programs & Levers
            </Text>
          </Group>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            <Accordion
              multiple
              variant="separated"
              chevron={<HugeiconsIcon icon={ArrowDown01Icon} size={18} color="var(--mantine-color-text)" />}
              styles={{
                item: {
                  backgroundColor: sectionSurface,
                  border: `1px solid ${sectionBorder}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                },
                control: {
                  padding: '14px 16px',
                },
                label: {
                  color: 'var(--mantine-color-text)',
                  fontWeight: 900,
                  fontSize: 16,
                },
                panel: {
                  padding: '0 16px 16px 16px',
                  color: sectionMuted,
                },
                chevron: {
                  color: 'var(--mantine-color-text)',
                },
              }}
            >
              <Accordion.Item value="renovation">
                <Accordion.Control>Renovation Program</Accordion.Control>
                <Accordion.Panel>
                  <RenovationProgramContent />
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="capex">
                <Accordion.Control>CapEx Allocation</Accordion.Control>
                <Accordion.Panel>
                  <CapexAllocationContent />
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="ops">
                <Accordion.Control>Operational Levers</Accordion.Control>
                <Accordion.Panel>
                  <OperationalLeversContent />
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            <Stack gap="lg">
              {(['Impact Waterfall', 'Payback Ladder', 'Resident Voice Shift'] as const).map((title) => (
                <Paper
                  key={title}
                  withBorder
                  radius="lg"
                  p="lg"
                  style={{
                    backgroundColor: sectionSurface,
                    borderColor: sectionBorder,
                    minHeight: 160,
                  }}
                >
                  <Stack gap="lg">
                    <Text fw={900} size="lg">
                      {title}
                    </Text>
                    {title === 'Impact Waterfall' ? (
                      <ImpactWaterfallContent />
                    ) : title === 'Payback Ladder' ? (
                      <PaybackLadderContent />
                    ) : title === 'Resident Voice Shift' ? (
                      <ResidentVoiceShiftContent />
                    ) : (
                      <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
                        Coming soon — we’ll visualize this using your real metrics so it updates as you change property selections.
                      </Text>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </SimpleGrid>

          <ResidentVoiceExperienceSignalsContent />
        </Stack>

        <Text fw={800} size="lg">
          Recommended Playbook
        </Text>

        <RecommendedPlaybookContent />

        <Text fw={800} size="lg">
          Tradeoffs &amp; Guardrails
        </Text>

        <TradeoffsGuardrailsContent />
      </Stack>
    </InsightsPageShell>
  )
}
