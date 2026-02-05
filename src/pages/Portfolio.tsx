import { useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, Card, Divider, Group, Paper, SegmentedControl, SimpleGrid, Stack, Text, TextInput } from '@mantine/core'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { HpyAppIcon } from '../theme/components/HpyAppIcon'
import { PORTFOLIO_APP_NAV } from './portfolioInsightsNav'
import { supabaseMetrics } from '../lib/supabaseMetrics'
import { AG_GRID_DEFAULT_COL_DEF, AG_GRID_DEFAULT_GRID_PROPS } from '../lib/agGridDefaults'

ModuleRegistry.registerModules([AllCommunityModule])

type PropertyRow = {
  property_id: string
  name: string | null
  market: string | null
  state?: string | null
  unit_count: number | null
  created_at: string | null
}

type RentSnapshot = { property_id: string; snapshot_date: string; avg_effective_rent: number | null; avg_asking_rent: number | null }
type OccSnapshot = { property_id: string; snapshot_date: string; leased_units: number | null; occupied_units: number | null }
type ResidentRating = { property_id: string; rating_month: string; rating_value: number | null; response_count: number | null }
type TurnRow = { property_id: string; move_out_date: string | null; ready_date: string | null }
type WorkOrderRow = { property_id: string; created_on: string | null; completed_on: string | null; status: string | null; category: string | null }
type PhotoRow = { property_id: string; captured_on: string | null }
type PeriodRow = { property_id: string; start_date: string | null }
type DdEventRow = { property_id: string; event_date: string | null }
type CapitalProjectRow = { property_id: string; capital_project_id: string; completed_on: string | null }

type MemoryIndexRow = {
  propertyName: string
  units: number | null
  memoryStrength: string
  benchmarkReadiness: string
  coverage: string
  freshness: string
}

function formatCompactNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(Math.round(value))
}

function yearsSince(dateIso: string | null): number | null {
  if (!dateIso) return null
  const d = new Date(dateIso)
  if (!Number.isFinite(d.getTime())) return null
  const diffMs = Date.now() - d.getTime()
  return Math.max(0, diffMs / (365.25 * 24 * 60 * 60 * 1000))
}

function asNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) ? n : null
}

function asDateKey(value: unknown): string | null {
  return typeof value === 'string' && value.length >= 10 ? value.slice(0, 10) : null
}

async function fetchAll<T = unknown>(args: { table: string; select: string; pageSize?: number }) {
  const pageSize = args.pageSize ?? 1000
  let offset = 0
  let hasMore = true
  const rows: T[] = []

  while (hasMore) {
    const res = await supabaseMetrics.from(args.table).select(args.select).range(offset, offset + pageSize - 1)
    const chunk = (res.data ?? []) as T[]
    rows.push(...chunk)
    hasMore = chunk.length === pageSize
    offset += pageSize
  }

  return rows
}

export function Portfolio() {
  const appNavOverride = useMemo(() => PORTFOLIO_APP_NAV, [])

  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [rent, setRent] = useState<RentSnapshot[]>([])
  const [occ, setOcc] = useState<OccSnapshot[]>([])
  const [ratings, setRatings] = useState<ResidentRating[]>([])
  const [turns, setTurns] = useState<TurnRow[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([])
  const [photos, setPhotos] = useState<PhotoRow[]>([])
  const [periods, setPeriods] = useState<PeriodRow[]>([])
  const [ddEvents, setDdEvents] = useState<DdEventRow[]>([])
  const [capitalProjects, setCapitalProjects] = useState<CapitalProjectRow[]>([])
  const [comparison, setComparison] = useState<'Portfolio peers' | 'Region' | 'US industry'>('Portfolio peers')
  const [memorySearch, setMemorySearch] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabaseMetrics
          .from('properties')
          .select('property_id, name, market, state, unit_count, created_at')
          .order('name')
        if (error) throw error
        if (!mounted) return
        setProperties((data ?? []) as PropertyRow[])
      } catch {
        if (mounted) setProperties([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (properties.length === 0) return
      setMetricsLoading(true)
      try {
        const [rentRows, occRows, ratingRows, turnRows, woRows, photoRows, periodRows, ddRows] = await Promise.all([
          fetchAll<RentSnapshot>({ table: 'rent_snapshots', select: 'property_id, snapshot_date, avg_effective_rent, avg_asking_rent' }),
          fetchAll<OccSnapshot>({ table: 'occupancy_snapshots', select: 'property_id, snapshot_date, leased_units, occupied_units' }),
          fetchAll<ResidentRating>({ table: 'resident_ratings', select: 'property_id, rating_month, rating_value, response_count' }),
          fetchAll<TurnRow>({ table: 'make_ready_turns', select: 'property_id, move_out_date, ready_date' }),
          fetchAll<WorkOrderRow>({ table: 'work_orders', select: 'property_id, created_on, completed_on, status, category' }),
          fetchAll<PhotoRow>({ table: 'photos', select: 'property_id, captured_on' }),
          fetchAll<PeriodRow>({ table: 'property_periods', select: 'property_id, start_date' }),
          fetchAll<DdEventRow>({ table: 'due_diligence_events', select: 'property_id, event_date' }),
        ])
        const capexRows = await fetchAll<CapitalProjectRow>({
          table: 'capital_projects',
          select: 'property_id, capital_project_id, completed_on',
        })

        if (!mounted) return
        setRent(rentRows)
        setOcc(occRows)
        setRatings(ratingRows)
        setTurns(turnRows)
        setWorkOrders(woRows)
        setPhotos(photoRows)
        setPeriods(periodRows)
        setDdEvents(ddRows)
        setCapitalProjects(capexRows)
      } catch {
        if (!mounted) return
        setRent([])
        setOcc([])
        setRatings([])
        setTurns([])
        setWorkOrders([])
        setPhotos([])
        setPeriods([])
        setDdEvents([])
        setCapitalProjects([])
      } finally {
        if (mounted) setMetricsLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [properties.length])

  const portfolioStats = useMemo(() => {
    const totalProperties = properties.length
    const units = properties.reduce((acc, p) => acc + (typeof p.unit_count === 'number' ? p.unit_count : 0), 0)

    const years = properties
      .map((p) => yearsSince(p.created_at))
      .filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
    const recordDepthYears = years.length ? years.reduce((a, b) => a + b, 0) / years.length : null

    return { totalProperties, units, recordDepthYears }
  }, [properties])

  const kpis = useMemo(() => {
    const byId = new Map<string, PropertyRow>()
    properties.forEach((p) => byId.set(p.property_id, p))

    const latestByProp = <T extends Record<string, unknown>>(rows: T[], dateKey: string) => {
      const out = new Map<string, T>()
      rows.forEach((r) => {
        const pid = r.property_id as string | undefined
        const d = asDateKey(r[dateKey])
        if (!pid || !d) return
        const prev = out.get(pid)
        const prevD = prev ? asDateKey(prev[dateKey]) : null
        if (!prevD || d > prevD) out.set(pid, r)
      })
      return out
    }

    const rentLatest = latestByProp(rent as unknown as Array<Record<string, unknown>>, 'snapshot_date')
    const occLatest = latestByProp(occ as unknown as Array<Record<string, unknown>>, 'snapshot_date')
    const ratingLatest = latestByProp(ratings as unknown as Array<Record<string, unknown>>, 'rating_month')

    // Portfolio occupancy (weighted)
    let leasedSum = 0
    let unitsSum = 0
    properties.forEach((p) => {
      const occRow = occLatest.get(p.property_id) as Record<string, unknown> | undefined
      const leased = asNumber(occRow?.leased_units ?? occRow?.occupied_units) ?? 0
      const units = typeof p.unit_count === 'number' ? p.unit_count : 0
      leasedSum += leased
      unitsSum += units
    })
    const occupancyPct = unitsSum > 0 ? (leasedSum / unitsSum) * 100 : null

    // Portfolio avg rent (weighted by leased)
    let rentWeighted = 0
    let rentWeight = 0
    properties.forEach((p) => {
      const r = rentLatest.get(p.property_id) as Record<string, unknown> | undefined
      const o = occLatest.get(p.property_id) as Record<string, unknown> | undefined
      const avg = asNumber(r?.avg_effective_rent ?? r?.avg_asking_rent)
      const leased = asNumber(o?.leased_units ?? o?.occupied_units)
      if (avg == null || leased == null) return
      rentWeighted += avg * leased
      rentWeight += leased
    })
    const avgRent = rentWeight > 0 ? rentWeighted / rentWeight : null

    // Resident score (simple average of latest ratings)
    const ratingVals = properties
      .map((p) => asNumber((ratingLatest.get(p.property_id) as Record<string, unknown> | undefined)?.rating_value))
      .filter((x): x is number => x != null)
    const residentScore = ratingVals.length ? ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length : null

    // Evidence coverage: % properties with at least one photo + one WO + one ownership/management period.
    const photoProps = new Set(photos.map((r) => r.property_id))
    const woProps = new Set(workOrders.map((r) => r.property_id))
    const periodProps = new Set(periods.map((r) => r.property_id))
    const covered = properties.filter((p) => photoProps.has(p.property_id) && woProps.has(p.property_id) && periodProps.has(p.property_id)).length
    const evidenceCoveragePct = properties.length ? (covered / properties.length) * 100 : null

    // Turn time (median days) from turns in last ~365 days.
    const nowKey = new Date().toISOString().slice(0, 10)
    const oneYearAgo = new Date()
    oneYearAgo.setDate(oneYearAgo.getDate() - 365)
    const yearAgoKey = oneYearAgo.toISOString().slice(0, 10)
    const durations: number[] = []
    turns.forEach((t) => {
      const d = asDateKey(t.move_out_date)
      const r = asDateKey(t.ready_date)
      if (!d || !r) return
      if (d < yearAgoKey || d > nowKey) return
      const start = new Date(`${d}T00:00:00`)
      const end = new Date(`${r}T00:00:00`)
      const days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
      if (Number.isFinite(days) && days >= 0 && days <= 180) durations.push(days)
    })
    durations.sort((a, b) => a - b)
    const turnMedian = durations.length
      ? durations.length % 2 === 0
        ? (durations[durations.length / 2 - 1] + durations[durations.length / 2]) / 2
        : durations[Math.floor(durations.length / 2)]
      : null

    // Risk exposure proxy: count of open work orders in last 90 days.
    const ninetyAgo = new Date()
    ninetyAgo.setDate(ninetyAgo.getDate() - 90)
    const ninetyKey = ninetyAgo.toISOString().slice(0, 10)
    const openRecent = workOrders.filter((w) => {
      const d = asDateKey(w.created_on)
      if (!d || d < ninetyKey) return false
      const status = String(w.status ?? '').toLowerCase()
      const isClosed = Boolean(w.completed_on) || status.includes('complete') || status.includes('closed')
      return !isClosed
    }).length

    return {
      occupancyPct,
      avgRent,
      residentScore,
      evidenceCoveragePct,
      turnMedianDays: turnMedian,
      openWorkOrdersRecent: openRecent,
    }
  }, [properties, rent, occ, ratings, photos, workOrders, periods, turns])

  const institutionalCounts = useMemo(() => {
    const docs = ddEvents.length
    const photoCount = photos.length
    const approvals = capitalProjects.filter((p) => p.completed_on == null).length
    return { docs, photoCount, approvals }
  }, [ddEvents.length, photos.length, capitalProjects])

  const performanceLists = useMemo(() => {
    const propsById = new Map(properties.map((p) => [p.property_id, p]))

    const latestByProp = <T extends { property_id: string }>(rows: T[], dateKey: keyof T) => {
      const map = new Map<string, T>()
      rows.forEach((r) => {
        const d = asDateKey(r[dateKey])
        if (!d) return
        const prev = map.get(r.property_id)
        const prevD = prev ? asDateKey(prev[dateKey]) : null
        if (!prevD || d > prevD) map.set(r.property_id, r)
      })
      return map
    }

    const ratingLatest = latestByProp(ratings, 'rating_month')

    // YoY rent growth per property (latest vs ~12 months prior)
    const yoyGrowth: Array<{ name: string; value: number }> = []
    const rentByProp = new Map<string, RentSnapshot[]>()
    rent.forEach((r) => {
      const list = rentByProp.get(r.property_id) ?? []
      list.push(r)
      rentByProp.set(r.property_id, list)
    })
    rentByProp.forEach((list, pid) => {
      list.sort((a, b) => (a.snapshot_date < b.snapshot_date ? -1 : 1))
      const latest = list.length > 0 ? list[list.length - 1] : undefined
      if (!latest) return
      const latestRent = latest.avg_effective_rent ?? latest.avg_asking_rent
      if (latestRent == null) return
      const latestDate = latest.snapshot_date
      const target = new Date(`${latestDate}T00:00:00`)
      target.setFullYear(target.getFullYear() - 1)
      const targetKey = target.toISOString().slice(0, 10)
      // pick closest on/after target
      const prior = list.find((x) => x.snapshot_date >= targetKey) ?? list[Math.max(0, list.length - 13)]
      const priorRent = prior?.avg_effective_rent ?? prior?.avg_asking_rent
      if (priorRent == null || priorRent <= 0) return
      const growth = ((latestRent - priorRent) / priorRent) * 100
      const name = propsById.get(pid)?.name ?? 'Unknown'
      if (Number.isFinite(growth)) yoyGrowth.push({ name, value: growth })
    })

    const resident: Array<{ name: string; value: number }> = []
    ratingLatest.forEach((r, pid) => {
      const v = r.rating_value
      if (v == null) return
      const name = propsById.get(pid)?.name ?? 'Unknown'
      resident.push({ name, value: v })
    })

    const top = <T extends { value: number }>(arr: T[], n: number) => [...arr].sort((a, b) => b.value - a.value).slice(0, n)
    const bottom = <T extends { value: number }>(arr: T[], n: number) => [...arr].sort((a, b) => a.value - b.value).slice(0, n)

    return {
      outperforming: {
        rentGrowth: top(yoyGrowth, 3),
        residentScore: top(resident, 3),
      },
      underperforming: {
        rentGrowth: bottom(yoyGrowth, 3),
        residentScore: bottom(resident, 3),
      },
    }
  }, [properties, rent, ratings])

  const memoryIndexRows = useMemo<MemoryIndexRow[]>(() => {
    const byProp = new Map<string, PropertyRow>()
    properties.forEach((p) => byProp.set(p.property_id, p))

    const countBy = (rows: Array<{ property_id: string }>) => {
      const map = new Map<string, number>()
      rows.forEach((r) => map.set(r.property_id, (map.get(r.property_id) ?? 0) + 1))
      return map
    }

    const latestDateBy = (rows: Array<{ property_id: string; date: string | null }>) => {
      const map = new Map<string, string>()
      rows.forEach((r) => {
        const d = asDateKey(r.date)
        if (!d) return
        const prev = map.get(r.property_id)
        if (!prev || d > prev) map.set(r.property_id, d)
      })
      return map
    }

    const photoCounts = countBy(photos)
    const woCounts = countBy(workOrders)
    const ratingCounts = countBy(ratings)
    const periodCounts = countBy(periods)
    const ddCounts = countBy(ddEvents)

    const latestPhoto = latestDateBy(photos.map((p) => ({ property_id: p.property_id, date: p.captured_on })))
    const latestWo = latestDateBy(workOrders.map((w) => ({ property_id: w.property_id, date: w.created_on })))
    const latestRating = latestDateBy(ratings.map((r) => ({ property_id: r.property_id, date: r.rating_month })))

    const freshnessFor = (pid: string) => {
      const dates = [latestPhoto.get(pid), latestWo.get(pid), latestRating.get(pid)].filter((x): x is string => typeof x === 'string')
      if (dates.length === 0) return '—'
      dates.sort()
      const latest = dates[dates.length - 1]
      return latest ?? '—'
    }

    return properties.map((p) => {
      const pid = p.property_id
      const c = {
        photos: photoCounts.get(pid) ?? 0,
        workOrders: woCounts.get(pid) ?? 0,
        ratings: ratingCounts.get(pid) ?? 0,
        periods: periodCounts.get(pid) ?? 0,
        dd: ddCounts.get(pid) ?? 0,
      }

      const coverageParts = [c.photos > 0, c.workOrders > 0, c.ratings > 0, c.periods > 0, c.dd > 0]
      const coveragePct = Math.round((coverageParts.filter(Boolean).length / coverageParts.length) * 100)

      // Score: log-scaled so big tables don't dominate.
      const score =
        Math.round(
          22 * Math.log10(1 + c.photos) +
            22 * Math.log10(1 + c.workOrders) +
            18 * Math.log10(1 + c.ratings) +
            20 * Math.log10(1 + c.periods) +
            18 * Math.log10(1 + c.dd)
        ) ?? 0

      const memoryStrength = score >= 160 ? 'High' : score >= 110 ? 'Medium' : 'Low'
      const benchmarkReadiness = coveragePct >= 80 ? 'High' : coveragePct >= 60 ? 'Medium' : 'Low'

      return {
      propertyName: p.name ?? 'Unknown property',
      units: p.unit_count ?? null,
      memoryStrength,
      benchmarkReadiness,
      coverage: `${coveragePct}%`,
      freshness: freshnessFor(pid),
    }
    })
  }, [properties])

  const filteredMemoryRows = useMemo(() => {
    const q = memorySearch.trim().toLowerCase()
    if (!q) return memoryIndexRows
    return memoryIndexRows.filter((r) => r.propertyName.toLowerCase().includes(q))
  }, [memoryIndexRows, memorySearch])

  const memoryCols = useMemo<ColDef<MemoryIndexRow>[]>(() => {
    return [
      { headerName: 'Property', field: 'propertyName', minWidth: 240 },
      {
        headerName: 'Units',
        field: 'units',
        width: 120,
        valueFormatter: (p) => (typeof p.value === 'number' ? p.value.toLocaleString() : '—'),
      },
      { headerName: 'Memory strength', field: 'memoryStrength', width: 160 },
      { headerName: 'Benchmark readiness', field: 'benchmarkReadiness', width: 180 },
      { headerName: 'Coverage', field: 'coverage', width: 140 },
      { headerName: 'Freshness', field: 'freshness', width: 140 },
    ]
  }, [])

  return (
    <>
      <GlobalHeader variant="product" />
      <Box
        style={{
          paddingTop: GLOBAL_HEADER_HEIGHT,
          height: '100vh',
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <HpySidebar
          height={`calc(100vh - ${GLOBAL_HEADER_HEIGHT}px)`}
          appNavOverride={appNavOverride}
        />
        <Box
          style={{
            flex: 1,
            padding: 56,
            overflowY: 'auto',
            height: `calc(100vh - ${GLOBAL_HEADER_HEIGHT}px)`,
          }}
        >
          <Stack gap="xl">
            <HpyPageHeader
              title="Portfolio"
              appIconNode={<HpyAppIcon type="Insights" size={48} radius={8} />}
              searchPlaceholder="Search signals, assets, or topics"
              hideCta
            />

            <Paper withBorder radius="lg" p="lg">
              <SimpleGrid cols={{ base: 1, md: 4 }} spacing="lg">
                <Stack gap="xs" style={{ gridColumn: 'span 2' }}>
                  <Text fw={900}>Institutional Memory</Text>
                  <Text size="sm" c="dimmed">
                    A durable system of record that survives staff turnover, with hard evidence across inspections, work orders, photos, and more.
                  </Text>
                </Stack>
                <SimpleGrid cols={3} spacing="sm" style={{ gridColumn: 'span 2' }}>
                  {[
                    { label: 'Docs', value: institutionalCounts.docs },
                    { label: 'Photos', value: institutionalCounts.photoCount },
                    { label: 'Approvals', value: institutionalCounts.approvals },
                  ].map((x) => (
                    <Card key={x.label} withBorder radius="md" p="md">
                      <Stack gap={4}>
                        <Text fw={900} size="sm">
                          {x.label}
                        </Text>
                        <Text fw={900} size="xl">
                          {metricsLoading ? '—' : formatCompactNumber(x.value)}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </SimpleGrid>

              <Divider my="lg" />

              <SimpleGrid cols={{ base: 2, md: 5 }} spacing="lg">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                    Record depth
                  </Text>
                  <Text fw={900} size="xl">
                    {portfolioStats.recordDepthYears == null ? '—' : `${portfolioStats.recordDepthYears.toFixed(1)}y`}
                  </Text>
                </Stack>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                    Evidence coverage
                  </Text>
                  <Text fw={900} size="xl">
                    {kpis.evidenceCoveragePct == null ? '—' : `${Math.round(kpis.evidenceCoveragePct)}%`}
                  </Text>
                </Stack>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                    Inspection faith
                  </Text>
                  <Text fw={900} size="xl">
                    —
                  </Text>
                </Stack>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                    Standardization
                  </Text>
                  <Text fw={900} size="xl">
                    —
                  </Text>
                </Stack>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                    Confidence uplift
                  </Text>
                  <Text fw={900} size="xl">
                    —
                  </Text>
                </Stack>
              </SimpleGrid>
            </Paper>

            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={900}>Benchmarking Scorecard</Text>
                <SegmentedControl
                  value={comparison}
                  onChange={(v) => setComparison(v as typeof comparison)}
                  data={['Portfolio peers', 'Region', 'US industry']}
                />
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                {[
                  { label: 'Occupancy', value: kpis.occupancyPct == null ? '—' : `${Math.round(kpis.occupancyPct)}%`, badge: comparison },
                  { label: 'Avg rent', value: kpis.avgRent == null ? '—' : `$${Math.round(kpis.avgRent).toLocaleString()}`, badge: comparison },
                  { label: 'Turn time (median)', value: kpis.turnMedianDays == null ? '—' : `${kpis.turnMedianDays.toFixed(1)}d`, badge: comparison },
                  { label: 'Evidence coverage', value: kpis.evidenceCoveragePct == null ? '—' : `${Math.round(kpis.evidenceCoveragePct)}%`, badge: comparison },
                  { label: 'Resident score', value: kpis.residentScore == null ? '—' : `${kpis.residentScore.toFixed(1)}/5`, badge: comparison },
                  { label: 'Open WOs (90d)', value: String(kpis.openWorkOrdersRecent ?? 0), badge: comparison },
                ].map((m) => (
                  <Card key={m.label} withBorder radius="lg" p="lg">
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={6}>
                        <Text fw={900}>{m.label}</Text>
                        <Text fw={900} size="xl">
                          {m.value}
                        </Text>
                      </Stack>
                      <Badge variant="light" color="gray" radius="xl">
                        {m.badge}
                      </Badge>
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>
            </Stack>

            <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
              <Paper withBorder radius="lg" p="lg">
                <Text fw={900}>Outperforming</Text>
                <Stack gap="sm" mt="sm">
                  <Group justify="space-between">
                    <Text size="sm" fw={800} c="dimmed">
                      Rent Growth
                    </Text>
                    <Text size="sm" fw={800} c="dimmed">
                      YoY
                    </Text>
                  </Group>
                  {performanceLists.outperforming.rentGrowth.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      No rent history yet.
                    </Text>
                  ) : (
                    performanceLists.outperforming.rentGrowth.map((r) => (
                      <Group key={r.name} justify="space-between" wrap="nowrap">
                        <Text size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.name}
                        </Text>
                        <Text size="sm" fw={900} style={{ color: 'var(--mantine-color-success-7)' }}>
                          +{r.value.toFixed(1)}%
                        </Text>
                      </Group>
                    ))
                  )}

                  <Divider />

                  <Group justify="space-between">
                    <Text size="sm" fw={800} c="dimmed">
                      Resident Score
                    </Text>
                    <Text size="sm" fw={800} c="dimmed">
                      Latest
                    </Text>
                  </Group>
                  {performanceLists.outperforming.residentScore.slice(0, 3).map((r) => (
                    <Group key={r.name} justify="space-between" wrap="nowrap">
                      <Text size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.name}
                      </Text>
                      <Text size="sm" fw={900} style={{ color: 'var(--mantine-color-success-7)' }}>
                        {r.value.toFixed(1)}/5
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
              <Paper withBorder radius="lg" p="lg">
                <Text fw={900}>Underperforming</Text>
                <Stack gap="sm" mt="sm">
                  <Group justify="space-between">
                    <Text size="sm" fw={800} c="dimmed">
                      Rent Growth
                    </Text>
                    <Text size="sm" fw={800} c="dimmed">
                      YoY
                    </Text>
                  </Group>
                  {performanceLists.underperforming.rentGrowth.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      No rent history yet.
                    </Text>
                  ) : (
                    performanceLists.underperforming.rentGrowth.map((r) => (
                      <Group key={r.name} justify="space-between" wrap="nowrap">
                        <Text size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.name}
                        </Text>
                        <Text size="sm" fw={900} style={{ color: 'var(--mantine-color-danger-7)' }}>
                          {r.value.toFixed(1)}%
                        </Text>
                      </Group>
                    ))
                  )}

                  <Divider />

                  <Group justify="space-between">
                    <Text size="sm" fw={800} c="dimmed">
                      Resident Score
                    </Text>
                    <Text size="sm" fw={800} c="dimmed">
                      Latest
                    </Text>
                  </Group>
                  {performanceLists.underperforming.residentScore.slice(0, 3).map((r) => (
                    <Group key={r.name} justify="space-between" wrap="nowrap">
                      <Text size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.name}
                      </Text>
                      <Text size="sm" fw={900} style={{ color: 'var(--mantine-color-danger-7)' }}>
                        {r.value.toFixed(1)}/5
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
              <Paper withBorder radius="lg" p="lg">
                <Text fw={900}>Market Signals</Text>
                <Stack gap="xs" mt="sm">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed" fw={800}>
                      Avg rent (portfolio)
                    </Text>
                    <Text size="sm" fw={900}>
                      {kpis.avgRent == null ? '—' : `$${Math.round(kpis.avgRent).toLocaleString()}`}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed" fw={800}>
                      Occupancy (portfolio)
                    </Text>
                    <Text size="sm" fw={900}>
                      {kpis.occupancyPct == null ? '—' : `${Math.round(kpis.occupancyPct)}%`}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed" fw={800}>
                      Open work orders (90d)
                    </Text>
                    <Text size="sm" fw={900}>
                      {kpis.openWorkOrdersRecent}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed" mt="sm">
                    Signals shown are derived from available metrics tables in Supabase.
                  </Text>
                </Stack>
              </Paper>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
              <Paper withBorder radius="lg" p="lg">
                <Group justify="space-between">
                  <Stack gap={4}>
                    <Text fw={900}>Benchmark Readiness</Text>
                    <Text size="sm" c="dimmed">
                      Data availability snapshot for portfolio benchmarking.
                    </Text>
                  </Stack>
                  <Badge variant="light" color="teal" radius="xl">
                    Real-time
                  </Badge>
                </Group>

                <Divider my="md" />

                <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                      Properties
                    </Text>
                    <Text fw={900} size="xl">
                      {portfolioStats.totalProperties}
                    </Text>
                  </Stack>
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                      Units
                    </Text>
                    <Text fw={900} size="xl">
                      {formatCompactNumber(portfolioStats.units)}
                    </Text>
                  </Stack>
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                      Standardization
                    </Text>
                    <Text fw={900} size="xl">
                      —
                    </Text>
                  </Stack>
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                      Coverage
                    </Text>
                    <Text fw={900} size="xl">
                      {kpis.evidenceCoveragePct == null ? '—' : `${Math.round(kpis.evidenceCoveragePct)}%`}
                    </Text>
                  </Stack>
                </SimpleGrid>
              </Paper>

              <Paper withBorder radius="lg" p="lg">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={6}>
                    <Text fw={900}>Benchmark Pack</Text>
                    <Text size="sm" c="dimmed">
                      A shareable summary for investment &amp; ops review.
                    </Text>
                  </Stack>
                  <Badge variant="light" color="gray" radius="xl">
                    Draft
                  </Badge>
                </Group>

                <Divider my="md" />

                <Group>
                  <Button variant="light">View</Button>
                  <Button variant="outline">PDF</Button>
                </Group>
              </Paper>
            </SimpleGrid>

            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={900}>Property Memory Index</Text>
                <Group gap="sm">
                  <TextInput
                    placeholder="Search properties"
                    value={memorySearch}
                    onChange={(e) => setMemorySearch(e.currentTarget.value)}
                    style={{ minWidth: 260 }}
                  />
                  <Button variant="light">View all</Button>
                </Group>
              </Group>

              {/* AG Grid must not be wrapped in Paper */}
              <Box className="ag-theme-alpine" style={{ width: '100%', height: 420 }}>
                <AgGridReact<MemoryIndexRow>
                  {...AG_GRID_DEFAULT_GRID_PROPS}
                  defaultColDef={AG_GRID_DEFAULT_COL_DEF}
                  columnDefs={memoryCols}
                  rowData={filteredMemoryRows}
                  loading={loading}
                />
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </>
  )
}
