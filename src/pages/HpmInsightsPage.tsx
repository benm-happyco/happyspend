import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  MultiSelect,
  Paper,
  Progress,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  ThemeIcon,
  Alert,
  useMantineTheme,
} from '@mantine/core'
import { LineChart, PieChart } from '@mantine/charts'
import '@mantine/charts/styles.css'
import { DateInput } from '@mantine/dates'
import '@mantine/dates/styles.css'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  ChartLineData02Icon,
  Home03Icon,
  StarIcon,
  TimeScheduleIcon,
} from '@hugeicons/core-free-icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { HpyAppIcon } from '../theme/components/HpyAppIcon'
import { useInsightsPropertySelection } from '../contexts/InsightsPropertyContext'
import { useUnavailableHighlight } from '../contexts/UnavailableHighlightContext'
import { metricsSupabaseConfigured, supabaseMetrics } from '../lib/supabaseMetrics'
import { PORTFOLIO_APP_NAV } from './portfolioInsightsNav'
import { getDemoActiveWorkflowCards } from './workflowsDemoData'

type HpmInsightsPageProps = {
  title: string
  searchPlaceholder?: string
}

const DETECTED_PATTERNS = [
  { title: 'Turn Time Bottleneck', unitsAffected: 24, potentialImpact: 18400, confidence: 92 },
  { title: 'HVAC Failures', unitsAffected: 12, potentialImpact: 12400, confidence: 58 },
  { title: 'Water Intrusion Clustering', unitsAffected: 8, potentialImpact: 45000, confidence: 35 },
]

function confidenceBadgeColor(confidence: number): 'green' | 'yellow' | 'orange' {
  if (confidence >= 70) return 'green'
  if (confidence >= 40) return 'yellow'
  return 'orange'
}

function getPreviousPeriod(startDate: string, endDate: string): { startDate: string; endDate: string } {
  const end = new Date(endDate)
  const start = new Date(startDate)
  const days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - days + 1)
  return {
    startDate: prevStart.toISOString().slice(0, 10),
    endDate: prevEnd.toISOString().slice(0, 10),
  }
}

const NEEDS_ATTENTION_TEMPLATES = [
  {
    title: 'Approve HVAC inspection schedule',
    costSavings: '$12,400',
    detail: 'Pattern AC-450 confirmed across 12 units',
    action: 'Approve',
  },
  {
    title: 'Review water intrusion pattern',
    costSavings: '$45,000',
    detail: 'Clustering detected in Bldg 4 after rain',
    action: 'Review',
  },
  {
    title: 'Authorize vendor change',
    costSavings: '$2,800/mo',
    detail: 'Response time drift > 5 days vs benchmark',
    action: 'Authorize',
  },
]

/** Simple linear regression: returns slope, intercept, residual SE, and S_xx for prediction intervals. */
function linearRegression(points: { x: number; y: number }[]): {
  slope: number
  intercept: number
  residualSe: number
  meanX: number
  sxx: number
} {
  const n = points.length
  if (n < 2) {
    const y = points[0]?.y ?? 0
    return { slope: 0, intercept: y, residualSe: 0, meanX: 0, sxx: 1 }
  }
  const sumX = points.reduce((a, p) => a + p.x, 0)
  const sumY = points.reduce((a, p) => a + p.y, 0)
  const sumXX = points.reduce((a, p) => a + p.x * p.x, 0)
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0)
  const meanX = sumX / n
  const meanY = sumY / n
  const sxx = sumXX - n * meanX * meanX
  const slope = sxx !== 0 ? (sumXY - n * meanX * meanY) / sxx : 0
  const intercept = meanY - slope * meanX
  const residuals = points.map((p) => p.y - (intercept + slope * p.x))
  const rss = residuals.reduce((a, r) => a + r * r, 0)
  const residualSe = n > 2 ? Math.sqrt(rss / (n - 2)) : 0
  return { slope, intercept, residualSe, meanX, sxx: sxx || 1 }
}

/** Prediction standard error at new x for 95% interval half-width. */
function predictionSe(residualSe: number, xNew: number, n: number, meanX: number, sxx: number): number {
  return residualSe * Math.sqrt(1 + 1 / n + Math.pow(xNew - meanX, 2) / sxx)
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  const normalized = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  if (normalized.length !== 6) return hex
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return hex
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function parseDateValue(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  return Number.isFinite(date.getTime()) ? date : null
}

function formatDateValue(value: Date | null): string {
  if (!value) return ''
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function HpmInsightsPage({ title, searchPlaceholder = 'Search' }: HpmInsightsPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const appNavOverride = useMemo(() => PORTFOLIO_APP_NAV, [])
  const { selectedPropertyIds, setSelectedPropertyIds, dateRange, setDateRange } = useInsightsPropertySelection()
  const { highlightUnavailable, setHighlightUnavailable } = useUnavailableHighlight()
  const [propertyOptions, setPropertyOptions] = useState<{ value: string; label: string }[]>([])
  const [propertiesById, setPropertiesById] = useState<Map<string, { unit_count?: number | null; market?: string | null }>>(new Map())
  const [mixByPropertyId, setMixByPropertyId] = useState<Map<string, { property_type?: string | null; asset_class?: string | null }>>(new Map())
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [propertiesError, setPropertiesError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<{
    occupancyPct: number | null
    satisfaction: number | null
    avgCompletionDays: number | null
    occupancyPctPrev: number | null
    satisfactionPrev: number | null
    avgCompletionDaysPrev: number | null
  }>({
    occupancyPct: null,
    satisfaction: null,
    avgCompletionDays: null,
    occupancyPctPrev: null,
    satisfactionPrev: null,
    avgCompletionDaysPrev: null,
  })
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  type WhatChangedRow = {
    metric: string
    delta: string
    deltaType: 'good' | 'bad' | 'neutral'
    location: string
    likelyCause: string
  }
  const [whatChangedRows, setWhatChangedRows] = useState<WhatChangedRow[]>([])
  type NoiChartPoint = { month: string; actual?: number; forecast: number; forecastHigh?: number; forecastLow?: number }
  type VarianceDriver = { label: string; value: number; valueLabel: string; color: 'success' | 'danger' | 'warning'; barPct: number }
  const [noiView, setNoiView] = useState<'portfolio' | 'region' | 'property'>('portfolio')
  const [selectedNoiRegion, setSelectedNoiRegion] = useState<string | null>(null)
  const [selectedNoiPropertyId, setSelectedNoiPropertyId] = useState<string | null>(null)
  const [noiChartData, setNoiChartData] = useState<NoiChartPoint[]>([])
  const [varianceDrivers, setVarianceDrivers] = useState<VarianceDriver[]>([])

  // Dashboard filter draft state: avoid expensive queries on every onChange.
  const [draftPropertyIds, setDraftPropertyIds] = useState<string[]>(selectedPropertyIds)
  const [draftDateRange, setDraftDateRange] = useState(dateRange)
  const isDraftDirty = useMemo(() => {
    return (
      JSON.stringify(draftPropertyIds) !== JSON.stringify(selectedPropertyIds) ||
      draftDateRange.startDate !== dateRange.startDate ||
      draftDateRange.endDate !== dateRange.endDate
    )
  }, [draftPropertyIds, selectedPropertyIds, draftDateRange.startDate, draftDateRange.endDate, dateRange.startDate, dateRange.endDate])

  useEffect(() => {
    // Keep draft in sync unless user has pending edits.
    if (isDraftDirty) return
    setDraftPropertyIds(selectedPropertyIds)
    setDraftDateRange(dateRange)
  }, [isDraftDirty, selectedPropertyIds, dateRange])

  const propertyIdSet = useMemo(() => new Set(propertyOptions.map((o) => o.value)), [propertyOptions])
  const normalizedSelectedPropertyIds = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const raw of selectedPropertyIds) {
      if (typeof raw !== 'string') continue
      const id = raw.trim()
      if (!id) continue
      if (seen.has(id)) continue
      // Only enforce "must exist in options" after properties are loaded.
      if (!loadingProperties && propertyIdSet.size > 0 && !propertyIdSet.has(id)) continue
      seen.add(id)
      out.push(id)
    }
    return out
  }, [selectedPropertyIds, loadingProperties, propertyIdSet])

  // If stored/controlled selection contains invalid/duplicate IDs, clean it up.
  // This prevents MultiSelect from getting into a bad controlled state that can lock up the UI.
  useEffect(() => {
    const a = JSON.stringify(selectedPropertyIds)
    const b = JSON.stringify(normalizedSelectedPropertyIds)
    if (a !== b) setSelectedPropertyIds(normalizedSelectedPropertyIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedSelectedPropertyIds])

  // Debounce expensive recalcs/queries when users multi-select quickly (also helps first load
  // when a stored selection immediately triggers lots of work).
  const [debouncedPropertyIds, setDebouncedPropertyIds] = useState<string[]>(normalizedSelectedPropertyIds)
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedPropertyIds(normalizedSelectedPropertyIds), 600)
    return () => window.clearTimeout(t)
  }, [normalizedSelectedPropertyIds])

  const debugFlags = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return {
      debug: params.get('debug') === '1',
      reset: params.get('reset') === '1',
    }
  }, [location.search])

  const [debugPerf, setDebugPerf] = useState<{
    lastMetricsMs: number | null
    lastNoiMs: number | null
    lastMetricsRows: {
      occ: number
      ratings: number
      workOrders: number
      occPrev: number
      ratingsPrev: number
      workOrdersPrev: number
      rent: number
      rentPrev: number
    } | null
    lastNoiRows: { rent: number; occ: number; workOrders: number } | null
    metricsTimeout: boolean
    noiTimeout: boolean
  }>({
    lastMetricsMs: null,
    lastNoiMs: null,
    lastMetricsRows: null,
    lastNoiRows: null,
    metricsTimeout: false,
    noiTimeout: false,
  })

  useEffect(() => {
    if (!debugFlags.reset) return
    // Escape hatch for "hang survives refresh" due to persisted selection/date range.
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 90)
    setSelectedPropertyIds([])
    setDateRange({ startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) })
    navigate('/happy-property/insights/dashboard', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debugFlags.reset])

  const safeDateRange = useMemo(() => {
    const end = parseDateValue(dateRange.endDate)
    const start = parseDateValue(dateRange.startDate)
    if (!end || !start) return dateRange
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1)
    // When users select multiple properties, this dashboard can become very expensive.
    // Clamp the range to keep the UI responsive and avoid "hang on refresh" scenarios.
    const maxDays = debouncedPropertyIds.length > 1 ? 120 : 180
    if (days <= maxDays) return dateRange
    const nextStart = new Date(end)
    nextStart.setDate(nextStart.getDate() - (maxDays - 1))
    return { startDate: formatDateValue(nextStart), endDate: dateRange.endDate }
  }, [dateRange, debouncedPropertyIds.length])

  useEffect(() => {
    if (safeDateRange.startDate !== dateRange.startDate || safeDateRange.endDate !== dateRange.endDate) {
      setDateRange(safeDateRange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeDateRange.startDate, safeDateRange.endDate])

  const noiRegions = useMemo(() => {
    const markets = new Set<string>()
    debouncedPropertyIds.forEach((id) => {
      const m = propertiesById.get(id)?.market
      if (m != null && String(m).trim() !== '') markets.add(String(m).trim())
    })
    return Array.from(markets).sort()
  }, [debouncedPropertyIds, propertiesById])

  const noiPropertyOptions = useMemo(
    () => propertyOptions.filter((o) => debouncedPropertyIds.includes(o.value)),
    [propertyOptions, debouncedPropertyIds]
  )

  const effectiveNoiPropertyIds = useMemo(() => {
    if (debouncedPropertyIds.length === 0) return []
    if (noiView === 'portfolio') return debouncedPropertyIds
    if (noiView === 'region') {
      const region = noiRegions.includes(selectedNoiRegion ?? '') ? selectedNoiRegion : noiRegions[0]
      if (!region) return debouncedPropertyIds
      return debouncedPropertyIds.filter((id) => (propertiesById.get(id)?.market ?? '').trim() === region)
    }
    const id = selectedNoiPropertyId ?? debouncedPropertyIds[0]
    return debouncedPropertyIds.includes(id ?? '') ? [id!] : [debouncedPropertyIds[0]]
  }, [noiView, debouncedPropertyIds, selectedNoiRegion, selectedNoiPropertyId, noiRegions, propertiesById])

  const [loadingNoi, setLoadingNoi] = useState(false)

  // Guardrails: dashboard queries can return huge datasets in prod which can freeze the UI.
  // Since this is a demo dashboard, we cap to recent rows to keep it responsive.
  const queryCaps = useMemo(() => {
    const factor = Math.max(1, debouncedPropertyIds.length)
    return {
      workOrders: Math.max(800, Math.floor(4000 / factor)),
      snapshots: Math.max(1200, Math.floor(5000 / factor)),
      ratings: Math.max(600, Math.floor(3000 / factor)),
    }
  }, [debouncedPropertyIds.length])

  const metricsRunIdRef = useRef(0)
  const noiRunIdRef = useRef(0)
  const propertiesAbortRef = useRef<AbortController | null>(null)
  const metricsAbortRef = useRef<AbortController | null>(null)
  const noiAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchProperties = async () => {
      if (!metricsSupabaseConfigured) {
        if (mounted) {
          setPropertyOptions([])
          setPropertiesById(new Map())
          setMixByPropertyId(new Map())
          setLoadingProperties(false)
          setPropertiesError('Metrics Supabase is not configured in this environment.')
        }
        return
      }
      setPropertiesError(null)
      propertiesAbortRef.current?.abort()
      const abort = new AbortController()
      propertiesAbortRef.current = abort
      // If Supabase/network hangs, don't leave the UI permanently stuck.
      const timeoutId = window.setTimeout(() => {
        if (!mounted) return
        abort.abort()
        setLoadingProperties(false)
        setPropertiesError('Timed out while loading properties. Try resetting saved filters.')
      }, 12_000)
      try {
        // Single fetch (avoid duplicate calls). Use select('*') so we don't assume optional columns.
        const { data, error } = await supabaseMetrics.from('properties').select('*').order('name').abortSignal(abort.signal)
        if (error) throw error
        if (!mounted) return
        const list = (data ?? []) as Record<string, unknown>[]

        // Defensive: MultiSelect requires unique, non-empty option values.
        const uniqueById = new Map<string, Record<string, unknown>>()
        list.forEach((row) => {
          const rawId = row.property_id as string | number | null | undefined
          const id = rawId == null ? '' : String(rawId)
          if (!id) return
          if (!uniqueById.has(id)) uniqueById.set(id, row)
        })
        const uniqueRows = Array.from(uniqueById.values())

        setPropertyOptions(
          uniqueRows.map((p) => ({
            value: String(p.property_id),
            label: (p.name as string | null) ?? 'Unknown property',
          }))
        )
        const byId = new Map<string, { unit_count?: number | null; market?: string | null }>()
        uniqueRows.forEach((p) => {
          const id = String(p.property_id)
          byId.set(id, {
            unit_count: (typeof p.unit_count === 'number' ? p.unit_count : null) ?? null,
            market: (p.market as string | null) ?? null,
          })
        })
        setPropertiesById(byId)
        const mixMap = new Map<string, { property_type?: string | null; asset_class?: string | null }>()
        uniqueRows.forEach((row) => {
          const id = String(row.property_id)
          const propertyType = (row.property_type ?? row.type ?? null) as unknown
          const assetClass = (row.asset_class ?? row.class ?? null) as unknown
          mixMap.set(id, {
            property_type: propertyType != null ? String(propertyType) : null,
            asset_class: assetClass != null ? String(assetClass) : null,
          })
        })
        setMixByPropertyId(mixMap)
      } catch {
        if (mounted) setPropertyOptions([])
        if (mounted) setPropertiesById(new Map())
        if (mounted) setMixByPropertyId(new Map())
        if (mounted) setPropertiesError('Unable to load properties.')
      } finally {
        window.clearTimeout(timeoutId)
        if (mounted) setLoadingProperties(false)
      }
    }
    fetchProperties()
    return () => {
      propertiesAbortRef.current?.abort()
      mounted = false
    }
  }, [])

  const multiSelectData = useMemo(() => {
    if (loadingProperties && selectedPropertyIds.length > 0) {
      return selectedPropertyIds.map((id) => ({ value: id, label: '…' }))
    }
    return propertyOptions
  }, [loadingProperties, selectedPropertyIds, propertyOptions])

  const demoActiveWorkflows = useMemo(() => {
    const featuredProperty = propertyOptions[0]?.label ?? 'Westwood Oaks'
    const vendorProperty = propertyOptions[1]?.label ?? 'Ace Carpentry'
    return getDemoActiveWorkflowCards({ featuredProperty, vendorProperty })
  }, [propertyOptions])

  const badgeStats = useMemo(() => {
    const selected = selectedPropertyIds.length
    let units = 0
    const markets = new Set<string>()
    selectedPropertyIds.forEach((id) => {
      const p = propertiesById.get(id)
      if (p?.unit_count != null && typeof p.unit_count === 'number') units += p.unit_count
      if (p?.market != null && String(p.market).trim() !== '') markets.add(String(p.market).trim())
    })
    return { selected, units, regions: markets.size }
  }, [selectedPropertyIds, propertiesById])

  const needsAttentionItems = useMemo(() => {
    return NEEDS_ATTENTION_TEMPLATES.map((template, i) => {
      const option = propertyOptions[i]
      const meta = option ? propertiesById.get(option.value) : null
      return {
        ...template,
        property: option?.label ?? '—',
        units: meta?.unit_count != null && typeof meta.unit_count === 'number' ? meta.unit_count : 0,
      }
    })
  }, [propertyOptions, propertiesById])

  const regionDistribution = useMemo(() => {
    if (selectedPropertyIds.length === 0) return []
    const byRegion = new Map<string, number>()
    selectedPropertyIds.forEach((id) => {
      const p = propertiesById.get(id)
      const region = p?.market != null && String(p.market).trim() !== '' ? String(p.market).trim() : 'Other'
      byRegion.set(region, (byRegion.get(region) ?? 0) + 1)
    })
    const total = selectedPropertyIds.length
    return Array.from(byRegion.entries())
      .map(([region, count]) => ({ region, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.percentage - a.percentage)
  }, [selectedPropertyIds, propertiesById])

  const propertyTypeDistribution = useMemo(() => {
    if (selectedPropertyIds.length === 0 || mixByPropertyId.size === 0) return []
    const byType = new Map<string, number>()
    selectedPropertyIds.forEach((id) => {
      const v = mixByPropertyId.get(id)?.property_type
      const label = v != null && String(v).trim() !== '' ? String(v).trim() : 'Unspecified'
      byType.set(label, (byType.get(label) ?? 0) + 1)
    })
    const total = selectedPropertyIds.length
    return Array.from(byType.entries())
      .map(([label, count]) => ({ label, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.percentage - a.percentage)
  }, [selectedPropertyIds, mixByPropertyId])

  const assetClassDistribution = useMemo(() => {
    if (selectedPropertyIds.length === 0 || mixByPropertyId.size === 0) return []
    const byClass = new Map<string, number>()
    selectedPropertyIds.forEach((id) => {
      const v = mixByPropertyId.get(id)?.asset_class
      const label = v != null && String(v).trim() !== '' ? String(v).trim() : 'Unspecified'
      byClass.set(label, (byClass.get(label) ?? 0) + 1)
    })
    const total = selectedPropertyIds.length
    return Array.from(byClass.entries())
      .map(([label, count]) => ({ label, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.percentage - a.percentage)
  }, [selectedPropertyIds, mixByPropertyId])

  const avgUnitsPerProperty = useMemo(() => {
    if (badgeStats.selected === 0) return null
    return Math.round((badgeStats.units / badgeStats.selected) * 10) / 10
  }, [badgeStats.selected, badgeStats.units])

  const theme = useMantineTheme()
  const SEGMENT_OPACITIES = [0.35, 0.45, 0.5, 0.6, 0.7, 0.8] as const
  const getRegionColor = (i: number) =>
    hexToRgba(theme.colors.purple[5], SEGMENT_OPACITIES[i % SEGMENT_OPACITIES.length])
  const getPropertyTypeColor = (i: number) =>
    hexToRgba(theme.colors.green[5], SEGMENT_OPACITIES[i % SEGMENT_OPACITIES.length])
  const getAssetClassColor = (i: number) =>
    hexToRgba(theme.colors.blue[5], SEGMENT_OPACITIES[i % SEGMENT_OPACITIES.length])

  const regionPieData = useMemo(
    () => regionDistribution.map(({ region, count }, i) => ({ name: region, value: count, color: getRegionColor(i) })),
    [regionDistribution, theme]
  )
  const propertyTypePieData = useMemo(
    () => propertyTypeDistribution.map(({ label, count }, i) => ({ name: label, value: count, color: getPropertyTypeColor(i) })),
    [propertyTypeDistribution, theme]
  )
  const assetClassPieData = useMemo(
    () => assetClassDistribution.map(({ label, count }, i) => ({ name: label, value: count, color: getAssetClassColor(i) })),
    [assetClassDistribution, theme]
  )

  useEffect(() => {
    if (debouncedPropertyIds.length === 0 || loadingProperties) {
      setMetrics({
        occupancyPct: null,
        satisfaction: null,
        avgCompletionDays: null,
        occupancyPctPrev: null,
        satisfactionPrev: null,
        avgCompletionDaysPrev: null,
      })
      setWhatChangedRows([])
      return
    }
    let mounted = true
    const runId = ++metricsRunIdRef.current
    metricsAbortRef.current?.abort()
    const abort = new AbortController()
    metricsAbortRef.current = abort
    setLoadingMetrics(true)
    setDebugPerf((p) => ({ ...p, metricsTimeout: false }))
    const startedAt = performance.now()
    const timeoutId = window.setTimeout(() => {
      if (!mounted) return
      abort.abort()
      setDebugPerf((p) => ({ ...p, metricsTimeout: true }))
      setLoadingMetrics(false)
    }, 12_000)
    const { startDate, endDate } = safeDateRange
    const prev = getPreviousPeriod(startDate, endDate)
    const queries = [
      supabaseMetrics
        .from('occupancy_snapshots')
        .select('property_id, occupied_units, vacant_units, leased_units')
        .in('property_id', debouncedPropertyIds)
        .gte('snapshot_date', startDate)
        .lte('snapshot_date', endDate)
        .order('snapshot_date', { ascending: false })
        .limit(queryCaps.snapshots)
        .abortSignal(abort.signal),
      supabaseMetrics
        .from('resident_ratings')
        .select('property_id, rating_value')
        .in('property_id', debouncedPropertyIds)
        .gte('rating_month', startDate)
        .lte('rating_month', endDate)
        .order('rating_month', { ascending: false })
        .limit(queryCaps.ratings)
        .abortSignal(abort.signal),
      supabaseMetrics
        .from('work_orders')
        .select('property_id, created_on, completed_on')
        .in('property_id', debouncedPropertyIds)
        .gte('created_on', startDate)
        .lte('created_on', endDate)
        .not('completed_on', 'is', null)
        .order('created_on', { ascending: false })
        .limit(queryCaps.workOrders)
        .abortSignal(abort.signal),
      supabaseMetrics
        .from('occupancy_snapshots')
        .select('property_id, occupied_units, vacant_units, leased_units')
        .in('property_id', debouncedPropertyIds)
        .gte('snapshot_date', prev.startDate)
        .lte('snapshot_date', prev.endDate)
        .order('snapshot_date', { ascending: false })
        .limit(queryCaps.snapshots)
        .abortSignal(abort.signal),
      supabaseMetrics
        .from('resident_ratings')
        .select('property_id, rating_value')
        .in('property_id', debouncedPropertyIds)
        .gte('rating_month', prev.startDate)
        .lte('rating_month', prev.endDate)
        .order('rating_month', { ascending: false })
        .limit(queryCaps.ratings)
        .abortSignal(abort.signal),
      supabaseMetrics
        .from('work_orders')
        .select('property_id, created_on, completed_on')
        .in('property_id', debouncedPropertyIds)
        .gte('created_on', prev.startDate)
        .lte('created_on', prev.endDate)
        .not('completed_on', 'is', null)
        .order('created_on', { ascending: false })
        .limit(queryCaps.workOrders)
        .abortSignal(abort.signal),
      supabaseMetrics
        .from('rent_snapshots')
        .select('property_id, snapshot_date, avg_effective_rent')
        .in('property_id', debouncedPropertyIds)
        .gte('snapshot_date', startDate)
        .lte('snapshot_date', endDate)
        .order('snapshot_date', { ascending: false })
        .limit(queryCaps.snapshots)
        .abortSignal(abort.signal),
      supabaseMetrics
        .from('rent_snapshots')
        .select('property_id, snapshot_date, avg_effective_rent')
        .in('property_id', debouncedPropertyIds)
        .gte('snapshot_date', prev.startDate)
        .lte('snapshot_date', prev.endDate)
        .order('snapshot_date', { ascending: false })
        .limit(queryCaps.snapshots)
        .abortSignal(abort.signal),
    ]
    const idToName = new Map(propertyOptions.map((o) => [o.value, o.label]))
    Promise.allSettled(queries)
      .then((results) => {
        if (!mounted) return
        if (runId !== metricsRunIdRef.current) return
        const ms = performance.now() - startedAt
        const getData = (i: number) => (results[i].status === 'fulfilled' ? results[i].value.data : null)
        const occ = { data: getData(0) ?? [] }
        const ratings = { data: getData(1) ?? [] }
        const workOrders = { data: getData(2) ?? [] }
        const occPrev = { data: getData(3) ?? [] }
        const ratingsPrev = { data: getData(4) ?? [] }
        const workOrdersPrev = { data: getData(5) ?? [] }
        const rent = { data: getData(6) ?? [] }
        const rentPrev = { data: getData(7) ?? [] }
        setDebugPerf((p) => ({
          ...p,
          lastMetricsMs: ms,
          lastMetricsRows: {
            occ: (occ.data as unknown[]).length,
            ratings: (ratings.data as unknown[]).length,
            workOrders: (workOrders.data as unknown[]).length,
            occPrev: (occPrev.data as unknown[]).length,
            ratingsPrev: (ratingsPrev.data as unknown[]).length,
            workOrdersPrev: (workOrdersPrev.data as unknown[]).length,
            rent: (rent.data as unknown[]).length,
            rentPrev: (rentPrev.data as unknown[]).length,
          },
        }))
        type RowOcc = { property_id?: string; occupied_units?: number; vacant_units?: number; leased_units?: number }
        type RowRating = { property_id?: string; rating_value?: number }
        type RowWo = { property_id?: string; created_on?: string; completed_on?: string }
        type RowRent = { property_id?: string; avg_effective_rent?: number }
        const calcOcc = (data: RowOcc[]) => {
          if (data.length === 0) return null
          let totalOcc = 0, totalVac = 0, totalLeased = 0
          data.forEach((r) => {
            totalOcc += r.occupied_units ?? 0
            totalVac += r.vacant_units ?? 0
            totalLeased += r.leased_units ?? 0
          })
          const total = totalOcc + totalVac + totalLeased
          return total > 0 ? (totalOcc / total) * 100 : null
        }
        const calcOccByProperty = (data: RowOcc[]) => {
          const byId = new Map<string, { occ: number; vac: number; leased: number }>()
          data.forEach((r) => {
            const id = r.property_id ?? ''
            const cur = byId.get(id) ?? { occ: 0, vac: 0, leased: 0 }
            cur.occ += r.occupied_units ?? 0
            cur.vac += r.vacant_units ?? 0
            cur.leased += r.leased_units ?? 0
            byId.set(id, cur)
          })
          const out = new Map<string, number>()
          byId.forEach((v, id) => {
            const total = v.occ + v.vac + v.leased
            out.set(id, total > 0 ? (v.occ / total) * 100 : 0)
          })
          return out
        }
        const calcSatisfaction = (data: RowRating[]) =>
          data.length > 0 ? data.reduce((a, r) => a + (r.rating_value ?? 0), 0) / data.length : null
        const calcSatisfactionByProperty = (data: RowRating[]) => {
          const byId = new Map<string, number[]>()
          data.forEach((r) => {
            const id = r.property_id ?? ''
            const list = byId.get(id) ?? []
            list.push(r.rating_value ?? 0)
            byId.set(id, list)
          })
          const out = new Map<string, number>()
          byId.forEach((list, id) => {
            out.set(id, list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0)
          })
          return out
        }
        const calcAvgDays = (data: RowWo[]) => {
          const days: number[] = []
          data.forEach((r) => {
            if (!r.created_on || !r.completed_on) return
            const created = new Date(r.created_on).getTime()
            const completed = new Date(r.completed_on).getTime()
            if (Number.isFinite(created) && Number.isFinite(completed)) {
              days.push((completed - created) / (1000 * 60 * 60 * 24))
            }
          })
          return days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : null
        }
        const calcAvgDaysByProperty = (data: RowWo[]) => {
          const byId = new Map<string, number[]>()
          data.forEach((r) => {
            if (!r.created_on || !r.completed_on) return
            const created = new Date(r.created_on).getTime()
            const completed = new Date(r.completed_on).getTime()
            if (!Number.isFinite(created) || !Number.isFinite(completed)) return
            const id = r.property_id ?? ''
            const list = byId.get(id) ?? []
            list.push((completed - created) / (1000 * 60 * 60 * 24))
            byId.set(id, list)
          })
          const out = new Map<string, number>()
          byId.forEach((list, id) => {
            out.set(id, list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0)
          })
          return out
        }
        const calcRentByProperty = (data: RowRent[]) => {
          const byId = new Map<string, number[]>()
          data.forEach((r) => {
            const id = r.property_id ?? ''
            const v = r.avg_effective_rent
            if (v != null && Number.isFinite(v)) {
              const list = byId.get(id) ?? []
              list.push(v)
              byId.set(id, list)
            }
          })
          const out = new Map<string, number>()
          byId.forEach((list, id) => {
            out.set(id, list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0)
          })
          return out
        }
        const occupancyPct = calcOcc((occ.data ?? []) as RowOcc[])
        const satisfaction = calcSatisfaction((ratings.data ?? []) as RowRating[])
        const avgCompletionDays = calcAvgDays((workOrders.data ?? []) as RowWo[])
        const occupancyPctPrev = calcOcc((occPrev.data ?? []) as RowOcc[])
        const satisfactionPrev = calcSatisfaction((ratingsPrev.data ?? []) as RowRating[])
        const avgCompletionDaysPrev = calcAvgDays((workOrdersPrev.data ?? []) as RowWo[])
        setMetrics({
          occupancyPct,
          satisfaction,
          avgCompletionDays,
          occupancyPctPrev,
          satisfactionPrev,
          avgCompletionDaysPrev,
        })
        const occByProp = calcOccByProperty((occ.data ?? []) as RowOcc[])
        const occByPropPrev = calcOccByProperty((occPrev.data ?? []) as RowOcc[])
        const satByProp = calcSatisfactionByProperty((ratings.data ?? []) as RowRating[])
        const satByPropPrev = calcSatisfactionByProperty((ratingsPrev.data ?? []) as RowRating[])
        const daysByProp = calcAvgDaysByProperty((workOrders.data ?? []) as RowWo[])
        const daysByPropPrev = calcAvgDaysByProperty((workOrdersPrev.data ?? []) as RowWo[])
        const rentByProp = calcRentByProperty((rent?.data ?? []) as RowRent[])
        const rentByPropPrev = calcRentByProperty((rentPrev?.data ?? []) as RowRent[])
        const allIds = new Set(debouncedPropertyIds)
        const pickLocation = (deltas: Map<string, number>) => {
          let bestId = ''
          let bestAbs = -1
          deltas.forEach((d, id) => {
            const abs = Math.abs(d)
            if (abs > bestAbs && idToName.get(id)) {
              bestAbs = abs
              bestId = id
            }
          })
          return bestId ? (idToName.get(bestId) ?? '—') : 'Selected portfolio'
        }
        const rows: WhatChangedRow[] = []
        if (occupancyPct != null && occupancyPctPrev != null) {
          const delta = occupancyPct - occupancyPctPrev
          const deltas = new Map<string, number>()
          allIds.forEach((id) => {
            const c = occByProp.get(id) ?? null
            const p = occByPropPrev.get(id) ?? null
            if (c != null && p != null) deltas.set(id, c - p)
          })
          rows.push({
            metric: 'Occupancy',
            delta: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`,
            deltaType: delta >= 0 ? 'good' : 'bad',
            location: pickLocation(deltas),
            likelyCause: delta < 0 ? 'Move-out spike' : 'Lease-up',
          })
        }
        if (avgCompletionDays != null && avgCompletionDaysPrev != null) {
          const delta = avgCompletionDays - avgCompletionDaysPrev
          const deltas = new Map<string, number>()
          allIds.forEach((id) => {
            const c = daysByProp.get(id) ?? null
            const p = daysByPropPrev.get(id) ?? null
            if (c != null && p != null) deltas.set(id, c - p)
          })
          rows.push({
            metric: 'Turn time',
            delta: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} days`,
            deltaType: delta <= 0 ? 'good' : 'bad',
            location: pickLocation(deltas),
            likelyCause: delta > 0 ? 'Vendor capacity' : 'Faster turns',
          })
        }
        if (satisfaction != null && satisfactionPrev != null) {
          const delta = satisfaction - satisfactionPrev
          const deltas = new Map<string, number>()
          allIds.forEach((id) => {
            const c = satByProp.get(id) ?? null
            const p = satByPropPrev.get(id) ?? null
            if (c != null && p != null) deltas.set(id, c - p)
          })
          rows.push({
            metric: 'Resident satisfaction',
            delta: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`,
            deltaType: delta >= 0 ? 'good' : 'bad',
            location: pickLocation(deltas),
            likelyCause: delta >= 0 ? 'Survey response' : 'Feedback dip',
          })
        }
        const rentCur = rentByProp.size ? Array.from(rentByProp.values()).reduce((a, b) => a + b, 0) / rentByProp.size : null
        const rentPrevVal = rentByPropPrev.size ? Array.from(rentByPropPrev.values()).reduce((a, b) => a + b, 0) / rentByPropPrev.size : null
        if (rentCur != null && rentPrevVal != null && Number.isFinite(rentCur) && Number.isFinite(rentPrevVal)) {
          const delta = rentCur - rentPrevVal
          const deltas = new Map<string, number>()
          allIds.forEach((id) => {
            const c = rentByProp.get(id) ?? null
            const p = rentByPropPrev.get(id) ?? null
            if (c != null && p != null) deltas.set(id, c - p)
          })
          rows.push({
            metric: 'Avg effective rent',
            delta: `${delta >= 0 ? '+' : ''}$${Math.round(delta)}`,
            deltaType: delta >= 0 ? 'good' : 'neutral',
            location: pickLocation(deltas),
            likelyCause: delta >= 0 ? 'Rent growth' : 'Pricing drift',
          })
        }
        setWhatChangedRows(rows)
      })
      .catch(() => {
        if (mounted) {
          setMetrics({
            occupancyPct: null,
            satisfaction: null,
            avgCompletionDays: null,
            occupancyPctPrev: null,
            satisfactionPrev: null,
            avgCompletionDaysPrev: null,
          })
          setWhatChangedRows([])
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId)
        if (mounted) setLoadingMetrics(false)
      })
    return () => {
      window.clearTimeout(timeoutId)
      metricsAbortRef.current?.abort()
      mounted = false
    }
  }, [debouncedPropertyIds, loadingProperties, safeDateRange, queryCaps, propertyOptions])

  useEffect(() => {
    if (effectiveNoiPropertyIds.length === 0) {
      setNoiChartData([])
      setVarianceDrivers([])
      return
    }
    let mounted = true
    const runId = ++noiRunIdRef.current
    noiAbortRef.current?.abort()
    const abort = new AbortController()
    noiAbortRef.current = abort
    setLoadingNoi(true)
    setDebugPerf((p) => ({ ...p, noiTimeout: false }))
    const startedAt = performance.now()
    const timeoutId = window.setTimeout(() => {
      if (!mounted) return
      abort.abort()
      setDebugPerf((p) => ({ ...p, noiTimeout: true }))
      setLoadingNoi(false)
    }, 12_000)
    const endDate = safeDateRange.endDate
    const startChart = new Date(endDate)
    startChart.setMonth(startChart.getMonth() - 5)
    const chartStart = startChart.toISOString().slice(0, 10)
    Promise.all([
      supabaseMetrics
        .from('rent_snapshots')
        .select('snapshot_date, avg_effective_rent, concessions_per_unit')
        .in('property_id', effectiveNoiPropertyIds)
        .gte('snapshot_date', chartStart)
        .lte('snapshot_date', endDate)
        .order('snapshot_date', { ascending: false })
        .limit(queryCaps.snapshots)
        .abortSignal(abort.signal),
      supabaseMetrics
        .from('occupancy_snapshots')
        .select('snapshot_date, occupied_units, vacant_units, leased_units')
        .in('property_id', effectiveNoiPropertyIds)
        .gte('snapshot_date', chartStart)
        .lte('snapshot_date', endDate)
        .order('snapshot_date', { ascending: false })
        .limit(queryCaps.snapshots)
        .abortSignal(abort.signal),
      supabaseMetrics
        .from('work_orders')
        .select('material_cost_usd')
        .in('property_id', effectiveNoiPropertyIds)
        .gte('created_on', chartStart)
        .lte('created_on', endDate)
        .order('created_on', { ascending: false })
        .limit(queryCaps.workOrders)
        .abortSignal(abort.signal),
    ])
      .then(([rentRes, occRes, woRes]) => {
        if (!mounted) return
        if (runId !== noiRunIdRef.current) return
        const ms = performance.now() - startedAt
        setDebugPerf((p) => ({
          ...p,
          lastNoiMs: ms,
          lastNoiRows: {
            rent: ((rentRes.data ?? []) as unknown[]).length,
            occ: ((occRes.data ?? []) as unknown[]).length,
            workOrders: ((woRes.data ?? []) as unknown[]).length,
          },
        }))
        const rentRows = (rentRes.data ?? []) as { snapshot_date?: string; avg_effective_rent?: number; concessions_per_unit?: number }[]
        const occRows = (occRes.data ?? []) as { snapshot_date?: string; occupied_units?: number; vacant_units?: number; leased_units?: number }[]
        const woRows = (woRes.data ?? []) as { material_cost_usd?: number }[]
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const formatMonthYear = (ym: string) => {
          const [y, m] = ym.split('-').map(Number)
          return `${monthNames[(m ?? 1) - 1]} ${y ?? ''}`
        }
        const byMonth = new Map<string, { rentSum: number; rentCount: number; occSum: number; occTotal: number; concessionsSum: number }>()
        rentRows.forEach((r) => {
          const month = r.snapshot_date?.slice(0, 7) ?? ''
          if (!month) return
          const cur = byMonth.get(month) ?? { rentSum: 0, rentCount: 0, occSum: 0, occTotal: 0, concessionsSum: 0 }
          cur.rentSum += r.avg_effective_rent ?? 0
          cur.rentCount += 1
          cur.concessionsSum += (r.concessions_per_unit ?? 0) * 10
          byMonth.set(month, cur)
        })
        occRows.forEach((r) => {
          const month = r.snapshot_date?.slice(0, 7) ?? ''
          if (!month) return
          const cur = byMonth.get(month) ?? { rentSum: 0, rentCount: 0, occSum: 0, occTotal: 0, concessionsSum: 0 }
          const occ = r.occupied_units ?? 0
          const vac = r.vacant_units ?? 0
          const leased = r.leased_units ?? 0
          cur.occSum += occ
          cur.occTotal += occ + vac + leased
          byMonth.set(month, cur)
        })
        const sortedMonths = Array.from(byMonth.keys()).sort().slice(-12)
        const actuals: { x: number; y: number }[] = []
        const historical: { month: string; actual: number }[] = []
        sortedMonths.forEach((ym, i) => {
          const cur = byMonth.get(ym)
          const avgRent = cur && cur.rentCount > 0 ? cur.rentSum / cur.rentCount : 800
          const occPct = cur && cur.occTotal > 0 ? cur.occSum / cur.occTotal : 0.92
          const noiProxy = Math.round(avgRent * occPct * 1.2)
          actuals.push({ x: i, y: noiProxy })
          historical.push({ month: formatMonthYear(ym), actual: noiProxy })
        })
        const n = actuals.length
        const needFill = n < 2
        const lastYmForFill = sortedMonths[sortedMonths.length - 1]
        const fillYear = lastYmForFill ? lastYmForFill.split('-')[0] : new Date().getFullYear().toString()
        if (needFill) {
          const base = actuals[0]?.y ?? 900
          for (let i = actuals.length; i < 6; i++) {
            actuals.push({ x: i, y: base + i * 15 })
            historical.push({ month: `${monthNames[i % 12]} ${fillYear}`, actual: base + i * 15 })
          }
        }
        const { slope, intercept, residualSe, meanX, sxx } = linearRegression(actuals)
        const forecastHorizon = 3
        const z95 = 1.96
        const nAct = Math.max(actuals.length, 1)
        const chartData: NoiChartPoint[] = []
        historical.forEach((h, i) => {
          const fitted = intercept + slope * i
          const se = predictionSe(residualSe, i, nAct, meanX, sxx)
          chartData.push({
            month: h.month,
            actual: h.actual,
            forecast: Math.round(fitted),
            forecastHigh: Math.round(fitted + z95 * se),
            forecastLow: Math.round(fitted - z95 * se),
          })
        })
        const lastX = actuals.length - 1
        const lastYm = sortedMonths[sortedMonths.length - 1] ?? endDate.slice(0, 7) + '-01'
        const lastDate = new Date(lastYm + '-01')
        const existingLabels = new Set(chartData.map((p) => p.month))
        let forecastMonthOffset = 1
        let added = 0
        while (added < forecastHorizon) {
          const futureDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + forecastMonthOffset, 1)
          const monthLabel = `${monthNames[futureDate.getMonth()]} ${futureDate.getFullYear()}`
          if (existingLabels.has(monthLabel)) {
            forecastMonthOffset += 1
            continue
          }
          const x = lastX + forecastMonthOffset
          const forecast = intercept + slope * x
          const se = predictionSe(residualSe, x, nAct, meanX, sxx)
          const halfWidth = z95 * se
          chartData.push({
            month: monthLabel,
            forecast: Math.round(forecast),
            forecastHigh: Math.round(forecast + halfWidth),
            forecastLow: Math.round(forecast - halfWidth),
          })
          existingLabels.add(monthLabel)
          forecastMonthOffset += 1
          added += 1
        }
        setNoiChartData(chartData)
        const turnCost = woRows.reduce((a, r) => a + (r.material_cost_usd ?? 0), 0)
        const concessionsTotal = Array.from(byMonth.values()).reduce((a, c) => a + c.concessionsSum, 0)
        const lossToLease = -18000
        const concessions = Math.round(concessionsTotal) !== 0 ? -Math.round(Math.abs(concessionsTotal) / 100) * 100 : -12000
        const turnCosts = turnCost !== 0 ? -Math.min(turnCost, 8000) : -8000
        const badDebt = -4000
        const other = 2000
        const values = [Math.abs(lossToLease), Math.abs(concessions), Math.abs(turnCosts), Math.abs(badDebt), other]
        const maxVal = Math.max(...values)
        const fmtK = (v: number) => (v >= 0 ? '+' : '') + (v / 1000).toFixed(2) + 'k'
        setVarianceDrivers([
          { label: 'Loss to Lease', value: lossToLease, valueLabel: fmtK(lossToLease), color: 'danger', barPct: Math.min(100, (18000 / maxVal) * 100) },
          { label: 'Concessions', value: concessions, valueLabel: fmtK(concessions), color: 'danger', barPct: Math.min(100, (Math.abs(concessions) / maxVal) * 100) },
          { label: 'Turn Costs', value: turnCosts, valueLabel: fmtK(turnCosts), color: 'warning', barPct: Math.min(100, (8000 / maxVal) * 100) },
          { label: 'Bad Debt', value: badDebt, valueLabel: fmtK(badDebt), color: 'danger', barPct: Math.min(100, (4000 / maxVal) * 100) },
          { label: 'Other', value: other, valueLabel: fmtK(other), color: 'success', barPct: Math.min(100, (other / maxVal) * 100) },
        ])
      })
      .catch(() => {
        if (mounted) {
          setNoiChartData([])
          setVarianceDrivers([])
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId)
        if (mounted) setLoadingNoi(false)
      })
    return () => {
      window.clearTimeout(timeoutId)
      noiAbortRef.current?.abort()
      mounted = false
    }
  }, [effectiveNoiPropertyIds, safeDateRange.endDate, queryCaps])

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
              title={title}
              appIconNode={<HpyAppIcon type="Insights" size={48} radius={8} />}
              hideCta
              trailingContent={
                <Group align="flex-end" gap="md" wrap="wrap">
                  <Box style={{ minWidth: 280, maxWidth: 480 }}>
                    <MultiSelect
                      placeholder={loadingProperties ? 'Loading properties...' : 'Select properties'}
                      data={multiSelectData}
                      value={draftPropertyIds}
                      onChange={(ids) => {
                        const seen = new Set<string>()
                        const next = ids
                          .map((x) => (typeof x === 'string' ? x.trim() : ''))
                          .filter((x) => x && !seen.has(x) && (seen.add(x), true))
                        setDraftPropertyIds(next)
                      }}
                      searchable
                      clearable
                      hidePickedOptions
                    />
                  </Box>
                  <DateInput
                    label="From"
                    value={parseDateValue(draftDateRange.startDate)}
                    onChange={(value) => setDraftDateRange((prev) => ({ ...prev, startDate: formatDateValue(value) }))}
                    maxDate={parseDateValue(draftDateRange.endDate) ?? undefined}
                    rightSection={<HugeiconsIcon icon={Calendar03Icon} size={16} />}
                    rightSectionPointerEvents="none"
                    styles={{
                      input: {
                        backgroundColor: 'var(--mantine-color-body)',
                        borderColor: 'var(--mantine-color-default-border)',
                      },
                    }}
                    style={{ minWidth: 140 }}
                  />
                  <DateInput
                    label="To"
                    value={parseDateValue(draftDateRange.endDate)}
                    onChange={(value) => setDraftDateRange((prev) => ({ ...prev, endDate: formatDateValue(value) }))}
                    minDate={parseDateValue(draftDateRange.startDate) ?? undefined}
                    rightSection={<HugeiconsIcon icon={Calendar03Icon} size={16} />}
                    rightSectionPointerEvents="none"
                    styles={{
                      input: {
                        backgroundColor: 'var(--mantine-color-body)',
                        borderColor: 'var(--mantine-color-default-border)',
                      },
                    }}
                    style={{ minWidth: 140 }}
                  />
                  <Button
                    size="sm"
                    color="purple"
                    disabled={!isDraftDirty}
                    onClick={() => {
                      // Normalize + validate against loaded options when available
                      const seen = new Set<string>()
                      const nextIds = draftPropertyIds
                        .map((x) => x.trim())
                        .filter((x) => x && !seen.has(x) && (seen.add(x), true))
                        .filter((id) => (loadingProperties || propertyIdSet.size === 0 ? true : propertyIdSet.has(id)))
                      setSelectedPropertyIds(nextIds)
                      setDateRange(draftDateRange)
                    }}
                  >
                    Apply
                  </Button>
                </Group>
              }
            />

            {!metricsSupabaseConfigured && (
              <Alert color="yellow" title="Metrics data not configured">
                This environment is missing the Metrics Supabase env vars. The dashboard will still load, but data queries will be disabled.
              </Alert>
            )}
            {propertiesError && (
              <Alert
                color="yellow"
                title="Dashboard data is still loading"
              >
                <Stack gap="sm">
                  <Text size="sm">{propertiesError}</Text>
                  <Group gap="sm">
                    <Button size="xs" variant="light" onClick={() => navigate('/happy-property/insights/dashboard?reset=1', { replace: true })}>
                      Reset saved filters
                    </Button>
                    <Button size="xs" variant="subtle" onClick={() => window.location.reload()}>
                      Reload
                    </Button>
                  </Group>
                </Stack>
              </Alert>
            )}
            {debugFlags.debug && (
              <Alert color="gray" title="Dashboard debug">
                <Stack gap={6}>
                  <Text size="xs">
                    Selected properties: <b>{selectedPropertyIds.length}</b> (debounced: <b>{debouncedPropertyIds.length}</b>) · Date range:{' '}
                    <b>{safeDateRange.startDate}</b> → <b>{safeDateRange.endDate}</b>
                  </Text>
                  <Text size="xs">
                    Properties: {loadingProperties ? <b>loading</b> : <b>idle</b>}
                    {propertiesError ? ` · error: ${propertiesError}` : ''}
                  </Text>
                  <Text size="xs">
                    Query caps: workOrders <b>{queryCaps.workOrders}</b>, snapshots <b>{queryCaps.snapshots}</b>, ratings <b>{queryCaps.ratings}</b>
                  </Text>
                  <Text size="xs">
                    Metrics: {loadingMetrics ? <b>loading</b> : <b>idle</b>}
                    {debugPerf.metricsTimeout ? ' (timed out)' : ''} · last: <b>{debugPerf.lastMetricsMs?.toFixed(0) ?? '—'}ms</b>
                  </Text>
                  <Text size="xs">
                    NOI: {loadingNoi ? <b>loading</b> : <b>idle</b>}
                    {debugPerf.noiTimeout ? ' (timed out)' : ''} · last: <b>{debugPerf.lastNoiMs?.toFixed(0) ?? '—'}ms</b>
                  </Text>
                  {debugPerf.lastMetricsRows && (
                    <Text size="xs">
                      Rows (metrics): occ {debugPerf.lastMetricsRows.occ}, ratings {debugPerf.lastMetricsRows.ratings}, workOrders{' '}
                      {debugPerf.lastMetricsRows.workOrders} · rent {debugPerf.lastMetricsRows.rent}
                    </Text>
                  )}
                  {debugPerf.lastNoiRows && (
                    <Text size="xs">
                      Rows (NOI): rent {debugPerf.lastNoiRows.rent}, occ {debugPerf.lastNoiRows.occ}, workOrders {debugPerf.lastNoiRows.workOrders}
                    </Text>
                  )}
                  <Group gap="sm">
                    <Button size="xs" variant="light" onClick={() => navigate('/happy-property/insights/dashboard?reset=1', { replace: true })}>
                      Reset persisted selection
                    </Button>
                    <Button size="xs" variant="subtle" onClick={() => navigate('/happy-property/insights/dashboard', { replace: true })}>
                      Hide debug
                    </Button>
                  </Group>
                </Stack>
              </Alert>
            )}

            <Text component="h1" fw={800} size="xl" mb="sm">
              {badgeStats.selected === 1 ? 'Property Summary' : 'Properties Summary'}
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg">
              <Paper withBorder p="md" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                      Occupancy
                    </Text>
                    <Text fw={700} size="xl">
                      {loadingMetrics
                        ? '—'
                        : selectedPropertyIds.length === 0
                          ? '—'
                          : metrics.occupancyPct != null
                            ? `${metrics.occupancyPct.toFixed(1)}%`
                            : '—'}
                    </Text>
                    {selectedPropertyIds.length > 0 &&
                      !loadingMetrics &&
                      metrics.occupancyPct != null &&
                      metrics.occupancyPctPrev != null && (
                        <Group gap={4} mt={4}>
                          <HugeiconsIcon
                            icon={ArrowDown01Icon}
                            size={14}
                            style={{
                              transform: metrics.occupancyPct >= metrics.occupancyPctPrev ? 'rotate(180deg)' : undefined,
                              color:
                                metrics.occupancyPct >= metrics.occupancyPctPrev
                                  ? 'var(--mantine-color-success-6)'
                                  : 'var(--mantine-color-danger-6)',
                            }}
                          />
                          <Text
                            size="xs"
                            fw={600}
                            c={metrics.occupancyPct >= metrics.occupancyPctPrev ? 'success' : 'danger'}
                          >
                            {(metrics.occupancyPct - metrics.occupancyPctPrev >= 0 ? '+' : '') +
                              (metrics.occupancyPct - metrics.occupancyPctPrev).toFixed(1)}
                            % vs last period
                          </Text>
                        </Group>
                      )}
                  </div>
                  <ThemeIcon size={38} radius="md" variant="light" color="success">
                    <HugeiconsIcon icon={Home03Icon} size={24} />
                  </ThemeIcon>
                </Group>
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                      Resident satisfaction
                    </Text>
                    <Text fw={700} size="xl">
                      {loadingMetrics
                        ? '—'
                        : selectedPropertyIds.length === 0
                          ? '—'
                          : metrics.satisfaction != null
                            ? `${metrics.satisfaction.toFixed(1)}/5`
                            : '—'}
                    </Text>
                    {selectedPropertyIds.length > 0 &&
                      !loadingMetrics &&
                      metrics.satisfaction != null &&
                      metrics.satisfactionPrev != null && (
                        <Group gap={4} mt={4}>
                          <HugeiconsIcon
                            icon={ArrowDown01Icon}
                            size={14}
                            style={{
                              transform: metrics.satisfaction >= metrics.satisfactionPrev ? 'rotate(180deg)' : undefined,
                              color:
                                metrics.satisfaction >= metrics.satisfactionPrev
                                  ? 'var(--mantine-color-success-6)'
                                  : 'var(--mantine-color-danger-6)',
                            }}
                          />
                          <Text
                            size="xs"
                            fw={600}
                            c={metrics.satisfaction >= metrics.satisfactionPrev ? 'success' : 'danger'}
                          >
                            {(metrics.satisfaction - metrics.satisfactionPrev >= 0 ? '+' : '') +
                              (metrics.satisfaction - metrics.satisfactionPrev).toFixed(1)}{' '}
                            vs last period
                          </Text>
                        </Group>
                      )}
                  </div>
                  <ThemeIcon size={38} radius="md" variant="light" color="yellow">
                    <HugeiconsIcon icon={StarIcon} size={24} />
                  </ThemeIcon>
                </Group>
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                      Avg work order completion
                    </Text>
                    <Text fw={700} size="xl">
                      {loadingMetrics
                        ? '—'
                        : selectedPropertyIds.length === 0
                          ? '—'
                          : metrics.avgCompletionDays != null
                            ? `${metrics.avgCompletionDays.toFixed(1)} days`
                            : '—'}
                    </Text>
                    {selectedPropertyIds.length > 0 &&
                      !loadingMetrics &&
                      metrics.avgCompletionDays != null &&
                      metrics.avgCompletionDaysPrev != null && (
                        <Group gap={4} mt={4}>
                          <HugeiconsIcon
                            icon={ArrowDown01Icon}
                            size={14}
                            style={{
                              transform:
                                metrics.avgCompletionDays <= metrics.avgCompletionDaysPrev ? 'rotate(180deg)' : undefined,
                              color:
                                metrics.avgCompletionDays <= metrics.avgCompletionDaysPrev
                                  ? 'var(--mantine-color-success-6)'
                                  : 'var(--mantine-color-danger-6)',
                            }}
                          />
                          <Text
                            size="xs"
                            fw={600}
                            c={
                              metrics.avgCompletionDays <= metrics.avgCompletionDaysPrev ? 'success' : 'danger'
                            }
                          >
                            {(metrics.avgCompletionDays - metrics.avgCompletionDaysPrev >= 0 ? '+' : '') +
                              (metrics.avgCompletionDays - metrics.avgCompletionDaysPrev).toFixed(1)}{' '}
                            days vs last period
                          </Text>
                        </Group>
                      )}
                  </div>
                  <ThemeIcon size={38} radius="md" variant="light" color="blue">
                    <HugeiconsIcon icon={TimeScheduleIcon} size={24} />
                  </ThemeIcon>
                </Group>
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                      Critical Risks
                    </Text>
                    <Text fw={700} size="xl">
                      —
                    </Text>
                  </div>
                  <ThemeIcon size={38} radius="md" variant="light" color="danger">
                    <HugeiconsIcon icon={TimeScheduleIcon} size={24} />
                  </ThemeIcon>
                </Group>
              </Paper>
            </SimpleGrid>

            <Stack gap="lg" mb="lg">
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
                <Paper withBorder p="md" radius="md">
                  <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                    Total properties
                  </Text>
                  <Text fw={700} size="xl" mt={4}>
                    {badgeStats.selected}
                  </Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                    Total units
                  </Text>
                  <Text fw={700} size="xl" mt={4}>
                    {badgeStats.units.toLocaleString()}
                  </Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                    Avg units/property
                  </Text>
                  <Text fw={700} size="xl" mt={4}>
                    {selectedPropertyIds.length === 0 ? '—' : avgUnitsPerProperty != null ? avgUnitsPerProperty.toLocaleString() : '—'}
                  </Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Text c="dimmed" tt="uppercase" fw={700} size="xs">
                    Avg occupancy
                  </Text>
                  <Text fw={700} size="xl" mt={4}>
                    {loadingMetrics || selectedPropertyIds.length === 0
                      ? '—'
                      : metrics.occupancyPct != null
                        ? `${metrics.occupancyPct.toFixed(1)}%`
                        : '—'}
                  </Text>
                </Paper>
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                <Paper withBorder p="md" radius="md">
                  <Text c="dimmed" tt="uppercase" fw={700} size="xs" mb="xs">
                    Properties by region
                  </Text>
                  {regionPieData.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      Select properties to see region mix.
                    </Text>
                  ) : (
                    <Stack gap="sm" align="center">
                      <PieChart
                        data={regionPieData}
                        withTooltip
                        tooltipDataSource="segment"
                        valueFormatter={(value) => `${value} properties`}
                        withLabelsLine
                        withLabels
                        labelsType="percent"
                        size={200}
                      />
                      <Group gap="md" justify="center" wrap="wrap">
                        {regionPieData.map((segment) => (
                          <Group key={segment.name} gap="xs">
                            <Box
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 2,
                                backgroundColor: segment.color,
                              }}
                            />
                            <Text size="xs">
                              {segment.name} ({segment.value})
                            </Text>
                          </Group>
                        ))}
                      </Group>
                    </Stack>
                  )}
                </Paper>

                <Paper withBorder p="md" radius="md">
                  <Text c="dimmed" tt="uppercase" fw={700} size="xs" mb="xs">
                    Property type mix
                  </Text>
                  {propertyTypePieData.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      Select properties to see property type mix.
                    </Text>
                  ) : (
                    <Stack gap="sm" align="center">
                      <PieChart
                        data={propertyTypePieData}
                        withTooltip
                        tooltipDataSource="segment"
                        valueFormatter={(value) => `${value} properties`}
                        withLabelsLine
                        withLabels
                        labelsType="percent"
                        size={200}
                      />
                      <Group gap="md" justify="center" wrap="wrap">
                        {propertyTypePieData.map((segment) => (
                          <Group key={segment.name} gap="xs">
                            <Box
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 2,
                                backgroundColor: segment.color,
                              }}
                            />
                            <Text size="xs">
                              {segment.name} ({segment.value})
                            </Text>
                          </Group>
                        ))}
                      </Group>
                    </Stack>
                  )}
                </Paper>

                <Paper withBorder p="md" radius="md">
                  <Text c="dimmed" tt="uppercase" fw={700} size="xs" mb="xs">
                    Asset class mix
                  </Text>
                  {assetClassPieData.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      Select properties to see asset class mix.
                    </Text>
                  ) : (
                    <Stack gap="sm" align="center">
                      <PieChart
                        data={assetClassPieData}
                        withTooltip
                        tooltipDataSource="segment"
                        valueFormatter={(value) => `${value} properties`}
                        withLabelsLine
                        withLabels
                        labelsType="percent"
                        size={200}
                      />
                      <Group gap="md" justify="center" wrap="wrap">
                        {assetClassPieData.map((segment) => (
                          <Group key={segment.name} gap="xs">
                            <Box
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 2,
                                backgroundColor: segment.color,
                              }}
                            />
                            <Text size="xs">
                              {segment.name} ({segment.value})
                            </Text>
                          </Group>
                        ))}
                      </Group>
                    </Stack>
                  )}
                </Paper>
              </SimpleGrid>
            </Stack>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="lg">
              <Card withBorder radius="md" padding="md">
                <Group justify="space-between" align="center" mb="md">
                  <Group gap="xs">
                    <Text size="md" fw={700}>
                      Needs Attention
                    </Text>
                    <Badge size="sm" variant="light" color="purple">
                      {needsAttentionItems.length}
                    </Badge>
                  </Group>
                </Group>
                <Stack gap="md">
                  {needsAttentionItems.map((item, i) => (
                    <Card key={i} withBorder padding="sm" radius="md" shadow="xs">
                      <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                        <Stack gap={2}>
                          <Text size="sm" fw={700}>
                            {item.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {item.property}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {item.units} units
                          </Text>
                        </Stack>
                        <Stack gap="xs" align="flex-end">
                          <Text size="sm" fw={700} c="green">
                            {item.costSavings} cost savings
                          </Text>
                          <Button size="xs" variant="light" color="purple">
                            {item.action}
                          </Button>
                        </Stack>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="md">
                <Group justify="space-between" align="center" mb="md">
                  <Group gap="xs">
                    <Text size="md" fw={700}>
                      Detected Patterns
                    </Text>
                    <Badge size="sm" variant="light" color="gray">
                      {DETECTED_PATTERNS.length}
                    </Badge>
                  </Group>
                </Group>
                <Stack gap="md">
                  {DETECTED_PATTERNS.map((pattern, i) => (
                    <Card key={i} withBorder padding="sm" radius="md" shadow="xs">
                      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                        <Stack gap={2}>
                          <Text size="sm" fw={700}>
                            {pattern.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {pattern.unitsAffected} units affected
                          </Text>
                        </Stack>
                        <Stack gap="xs" align="flex-end">
                          <Text size="xs" fw={600} c="green" style={{ whiteSpace: 'nowrap' }}>
                            Potential impact ${pattern.potentialImpact.toLocaleString()}
                          </Text>
                          <Badge size="sm" variant="light" color={confidenceBadgeColor(pattern.confidence)}>
                            Confidence {pattern.confidence}%
                          </Badge>
                        </Stack>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Card>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="lg">
              <Stack gap="md">
                <Card withBorder radius="md" padding="md">
                  <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                      <ThemeIcon size="sm" radius="sm" variant="light" color="blue">
                        <HugeiconsIcon icon={ChartLineData02Icon} size={18} />
                      </ThemeIcon>
                      <div>
                        <Text fw={700} size="md">
                          NOI Forecast
                        </Text>
                        <Text size="xs" c="dimmed">
                          Projected performance with confidence intervals.
                        </Text>
                      </div>
                    </Group>
                    <SegmentedControl
                      size="xs"
                      value={noiView}
                      onChange={(v) => {
                        const next = v as 'portfolio' | 'region' | 'property'
                        setNoiView(next)
                        if (next === 'region' && noiRegions.length > 0 && !selectedNoiRegion) setSelectedNoiRegion(noiRegions[0])
                        if (next === 'property' && selectedPropertyIds.length > 0 && !selectedNoiPropertyId) setSelectedNoiPropertyId(selectedPropertyIds[0])
                      }}
                      data={[
                        { label: 'Portfolio', value: 'portfolio' },
                        { label: 'Region', value: 'region' },
                        { label: 'Property', value: 'property' },
                      ]}
                    />
                  </Group>
                  {(noiView === 'region' && noiRegions.length > 0) || (noiView === 'property' && noiPropertyOptions.length > 0) ? (
                    <Group gap="xs" mb="sm">
                      {noiView === 'region' && (
                        <Select
                          size="xs"
                          label="Region"
                          placeholder="Select region"
                          data={noiRegions.map((r) => ({ value: r, label: r }))}
                          value={selectedNoiRegion ?? noiRegions[0]}
                          onChange={(val) => setSelectedNoiRegion(val)}
                          styles={{ root: { maxWidth: 180 } }}
                        />
                      )}
                      {noiView === 'property' && (
                        <Select
                          size="xs"
                          label="Property"
                          placeholder="Select property"
                          data={noiPropertyOptions}
                          value={selectedNoiPropertyId ?? selectedPropertyIds[0] ?? null}
                          onChange={(val) => setSelectedNoiPropertyId(val)}
                          styles={{ root: { maxWidth: 220 } }}
                        />
                      )}
                    </Group>
                  ) : null}
                  <Group align="stretch" gap="md" wrap="nowrap" style={{ alignItems: 'flex-start' }}>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      {loadingNoi ? (
                        <Box h={260} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Text size="sm" c="dimmed">
                            Loading…
                          </Text>
                        </Box>
                      ) : noiChartData.length === 0 ? (
                        <Box h={260} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Text size="sm" c="dimmed">
                            Select properties to see NOI forecast.
                          </Text>
                        </Box>
                      ) : (
                        <LineChart
                          h={260}
                          data={noiChartData}
                          dataKey="month"
                          series={[
                            { name: 'actual', color: 'var(--mantine-color-success-6)' },
                            { name: 'forecast', color: 'var(--mantine-color-blue-6)' },
                            { name: 'forecastHigh', color: 'var(--mantine-color-blue-3)' },
                            { name: 'forecastLow', color: 'var(--mantine-color-blue-3)' },
                          ]}
                          curveType="linear"
                          tickLine="none"
                          gridAxis="y"
                          xAxisProps={{ interval: 0 }}
                          valueFormatter={(value) => `$${Number(value).toLocaleString()}`}
                        />
                      )}
                    </Box>
                    <Stack gap="sm" style={{ width: 200, flexShrink: 0 }}>
                      <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                        Variance drivers (MTD)
                      </Text>
                      {varianceDrivers.length === 0 && !loadingNoi ? (
                        <Text size="xs" c="dimmed">
                          —
                        </Text>
                      ) : (
                        varianceDrivers.map((d, i) => (
                          <Box key={i}>
                            <Group justify="space-between" gap="xs" mb={4}>
                              <Text size="xs" fw={500}>
                                {d.label}
                              </Text>
                              <Text
                                size="xs"
                                fw={600}
                                c={d.value >= 0 ? 'success' : d.color === 'warning' ? 'warning' : 'danger'}
                              >
                                {d.valueLabel}
                              </Text>
                            </Group>
                            <Progress
                              value={d.barPct}
                              size="sm"
                              color={d.color}
                              style={{ maxWidth: '100%' }}
                            />
                          </Box>
                        ))
                      )}
                    </Stack>
                  </Group>
                </Card>
                <Card withBorder radius="md" padding="md">
                  <Text fw={700} size="md" mb="md">
                    What changed since last period
                  </Text>
                  {whatChangedRows.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      Select properties and a date range to see period-over-period changes.
                    </Text>
                  ) : (
                    <Stack gap={0}>
                      <Group gap="md" mb="xs" wrap="nowrap" align="flex-start" style={{ borderBottom: '1px solid var(--mantine-color-default-border)', paddingBottom: 8 }}>
                        <Box style={{ flex: '1 1 0', minWidth: 0 }}>
                          <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ textAlign: 'left', display: 'block' }}>
                            Metric
                          </Text>
                        </Box>
                        <Box style={{ width: 100, flexShrink: 0, textAlign: 'left' }}>
                          <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ display: 'block' }}>
                            Delta
                          </Text>
                        </Box>
                        <Box style={{ width: 120, flexShrink: 0, textAlign: 'left' }}>
                          <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ display: 'block' }}>
                            Location
                          </Text>
                        </Box>
                        <Box style={{ width: 140, flexShrink: 0, display: 'flex', justifyContent: 'flex-start' }}>
                          <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ display: 'block' }}>
                            Likely cause
                          </Text>
                        </Box>
                      </Group>
                      {whatChangedRows.map((row, i) => (
                        <Group
                          key={i}
                          gap="md"
                          wrap="nowrap"
                          align="flex-start"
                          style={{
                            paddingTop: 10,
                            paddingBottom: 10,
                            borderBottom: i < whatChangedRows.length - 1 ? '1px solid var(--mantine-color-default-border)' : undefined,
                          }}
                        >
                          <Box style={{ flex: '1 1 0', minWidth: 0, textAlign: 'left' }}>
                            <Text size="sm" fw={600} style={{ display: 'block' }}>
                              {row.metric}
                            </Text>
                          </Box>
                          <Box style={{ width: 100, flexShrink: 0, textAlign: 'left' }}>
                            <Text
                              size="sm"
                              fw={600}
                              style={{
                                display: 'block',
                                color:
                                  row.deltaType === 'good'
                                    ? 'var(--mantine-color-success-6)'
                                    : row.deltaType === 'bad'
                                      ? 'var(--mantine-color-danger-6)'
                                      : 'var(--mantine-color-warning-6)',
                              }}
                            >
                              {row.delta}
                            </Text>
                          </Box>
                          <Box style={{ width: 120, flexShrink: 0, textAlign: 'left', overflow: 'hidden' }}>
                            <Text size="sm" c="dimmed" truncate style={{ display: 'block' }}>
                              {row.location}
                            </Text>
                          </Box>
                          <Box style={{ width: 140, flexShrink: 0, display: 'flex', justifyContent: 'flex-start' }}>
                            <Badge size="sm" variant="light" color="gray" style={{ width: 'fit-content' }}>
                              {row.likelyCause}
                            </Badge>
                          </Box>
                        </Group>
                      ))}
                    </Stack>
                  )}
                </Card>
              </Stack>
              <Card withBorder radius="md" padding="md">
                <Text fw={700} size="md" mb="xs">
                  Workflow Pipeline
                </Text>
                <Stack gap="sm" mt="sm">
                  {demoActiveWorkflows.map((wf) => (
                    <Paper
                      key={wf.id}
                      withBorder
                      radius="md"
                      p="sm"
                      style={{ background: 'var(--mantine-color-default)' }}
                    >
                      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
                        <Stack gap={4} style={{ minWidth: 0, flex: '1 1 0' }}>
                          <Group gap={6} wrap="wrap">
                            <Badge
                              size="xs"
                              variant="light"
                              color={wf.status === 'RUNNING' ? 'success' : 'gray'}
                            >
                              {wf.status === 'RUNNING' ? 'Running' : 'Waiting'}
                            </Badge>
                            <Badge size="xs" variant="light" color="gray">
                              {wf.category}
                            </Badge>
                          </Group>
                          <Text size="sm" fw={600} truncate>
                            {wf.title}
                          </Text>
                          <Group gap={6} wrap="wrap">
                            <Text size="xs" c="dimmed">
                              {wf.nextActionLabel}
                            </Text>
                            <Text size="xs" c="dimmed">
                              •
                            </Text>
                            <Text size="xs" fw={600} c={wf.dueLabel === 'Due today' ? 'danger' : 'dimmed'}>
                              {wf.dueLabel}
                            </Text>
                          </Group>
                        </Stack>
                        <Stack gap={0} align="flex-end" style={{ flexShrink: 0 }}>
                          <Text size="sm" fw={700}>
                            {wf.impactValue}
                          </Text>
                          <Text size="xs" c="dimmed">
                            impact
                          </Text>
                        </Stack>
                      </Group>
                      <Progress
                        value={wf.progressPct}
                        size="sm"
                        mt="xs"
                        color={wf.accent === 'teal' ? 'success' : 'blue'}
                      />
                    </Paper>
                  ))}
                  <Button
                    mt="xs"
                    variant="light"
                    size="sm"
                    rightSection={<HugeiconsIcon icon={ArrowRight01Icon} size={18} />}
                    onClick={() => navigate('/happy-property/insights/workflows')}
                  >
                    View Workflows
                  </Button>
                </Stack>
              </Card>
            </SimpleGrid>

            <Divider my="lg" />

            <Group gap="sm" mt="xl" pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
              <Switch
                checked={highlightUnavailable}
                onChange={(e) => setHighlightUnavailable(e.currentTarget.checked)}
                label="Highlight unavailable metrics"
              />
              <Text size="xs" c="dimmed">
                Marks cards with unavailable data (e.g. placeholder metrics) with a yellow border.
              </Text>
            </Group>
          </Stack>
        </Box>
      </Box>
    </>
  )
}
