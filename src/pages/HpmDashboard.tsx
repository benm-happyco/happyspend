import {
  Alert,
  Badge,
  Box,
  Card,
  Group,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  useMantineTheme,
} from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { AreaChart, BarChart, DonutChart, LineChart } from '@mantine/charts'
import '@mantine/charts/styles.css'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import {
  CartesianGrid,
  ResponsiveContainer,
  Sankey,
  Scatter,
  ScatterChart as RechartsScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { PropertyPicker } from '../theme/components/PropertyPicker'
import { supabaseMetrics } from '../lib/supabaseMetrics'
import { AG_GRID_DEFAULT_COL_DEF, AG_GRID_DEFAULT_GRID_PROPS } from '../lib/agGridDefaults'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([AllCommunityModule])

type PropertyBaseline = {
  property_id: string
  name: string
  market: string | null
  unit_count: number
  year_built: number | null
}

type PropertyContinuity = {
  property_id: string
  name: string
  first_seen_date: string | null
  owner_groups_count: number
  management_periods_count: number
  dd_waves_count: number
  photo_count: number
}

type TimelineSegment = {
  property_id: string
  property_name: string
  start_date: string
  end_date: string
  owner_group: string
  management_company: string
  acquisition_type: string | null
  exit_type: string | null
}

type InspectionMonthly = {
  property_id: string
  month: string
  inspection_type: string
  inspections_count: number
}

type PhotoMonthly = {
  property_id: string
  month: string
  location_area: string
  photos_count: number
}

type CapitalProjectRow = {
  property_id: string
  capital_project_id: string
  project_type: string
  started_on: string
  completed_on: string
  budget_usd: number
  actual_usd: number | null
  units_impacted: number | null
  vendor_name: string | null
}

type ScorecardRow = {
  property_id: string
  name: string
  market: string | null
  unit_count: number
  avg_overall_score: number | null
  overall_score_delta: number | null
  emergency_rate: number | null
  median_wo_days: number | null
  capex_usd: number | null
  photo_count: number | null
}

export function HpmDashboard() {
  const theme = useMantineTheme()
  const sectionPalette = useMemo(
    () => ({
      ownership: 'blue',
      physical: 'grape',
      capital: 'teal',
      operations: 'orange',
      revenue: 'green',
      resident: 'indigo',
    }),
    []
  )
  const [searchValue, setSearchValue] = useState('')
  const [propertyOptions, setPropertyOptions] = useState<{ value: string; label: string }[]>([])
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState('2022-01-01')
  const [endDate, setEndDate] = useState('2026-02-01')
  const [draftPropertyIds, setDraftPropertyIds] = useState<string[]>([])
  const [draftStartDate, setDraftStartDate] = useState('2022-01-01')
  const [draftEndDate, setDraftEndDate] = useState('2026-02-01')
  const [baseline, setBaseline] = useState<PropertyBaseline[]>([])
  const [continuity, setContinuity] = useState<PropertyContinuity[]>([])
  const [timelineSegments, setTimelineSegments] = useState<TimelineSegment[]>([])
  const [inspectionSeries, setInspectionSeries] = useState<{ month: string; [key: string]: number | string }[]>([])
  const [photoSeries, setPhotoSeries] = useState<{ month: string; [key: string]: number | string }[]>([])
  const [inspectionKeys, setInspectionKeys] = useState<string[]>([])
  const [photoKeys, setPhotoKeys] = useState<string[]>([])
  const [photoScatterPoints, setPhotoScatterPoints] = useState<
    { monthIndex: number; areaIndex: number; count: number; monthLabel: string; areaLabel: string }[]
  >([])
  const [photoMonthLabels, setPhotoMonthLabels] = useState<string[]>([])
  const [photoAreaLabels, setPhotoAreaLabels] = useState<string[]>([])
  const [workOrderSeries, setWorkOrderSeries] = useState<{ month: string; [key: string]: number | string }[]>([])
  const [workOrderKeys, setWorkOrderKeys] = useState<string[]>([])
  const [emergencyRateSeries, setEmergencyRateSeries] = useState<
    { month: string; emergency_rate: number }[]
  >([])
  const [completionMedianSeries, setCompletionMedianSeries] = useState<
    { month: string; median_days_to_complete: number }[]
  >([])
  const [turnDaysSeries, setTurnDaysSeries] = useState<{ month: string; median_turn_days: number }[]>([])
  const [turnCostSeries, setTurnCostSeries] = useState<{ month: string; avg_turn_cost: number }[]>([])
  const [occupancySeries, setOccupancySeries] = useState<{ date: string; occupancy_rate: number }[]>([])
  const [rentSeries, setRentSeries] = useState<
    { date: string; avg_effective_rent: number; avg_asking_rent: number }[]
  >([])
  const [concessionSeries, setConcessionSeries] = useState<{ date: string; concessions_per_unit: number }[]>([])
  const [ratingSeries, setRatingSeries] = useState<{ month: string; [key: string]: number | string }[]>([])
  const [ratingKeys, setRatingKeys] = useState<string[]>([])
  const [responseSeries, setResponseSeries] = useState<{ month: string; [key: string]: number | string }[]>([])
  const [responseKeys, setResponseKeys] = useState<string[]>([])
  const [scorecardRows, setScorecardRows] = useState<ScorecardRow[]>([])
  const [loadingScorecard, setLoadingScorecard] = useState(false)
  const [capexRows, setCapexRows] = useState<CapitalProjectRow[]>([])
  const [capexTotals, setCapexTotals] = useState<{ name: string; value: number; color: string }[]>([])
  const [loadingCapex, setLoadingCapex] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [capexDeltaData, setCapexDeltaData] = useState<
    { period: string; occupancy_rate: number; avg_effective_rent: number; overall_score: number }[]
  >([])
  const [loadingCapexDelta, setLoadingCapexDelta] = useState(false)
  const [capexMetric, setCapexMetric] = useState<'occupancy_rate' | 'avg_effective_rent' | 'overall_score'>(
    'occupancy_rate'
  )
  const [revenueChart, setRevenueChart] = useState<'occupancy' | 'rent' | 'concessions'>('occupancy')
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingBaseline, setLoadingBaseline] = useState(false)
  const [loadingContinuity, setLoadingContinuity] = useState(false)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [loadingCharts, setLoadingCharts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const MAX_SELECTED_PROPERTIES = 25

  const idsKey = useMemo(() => (ids: string[]) => ids.join('\u0000'), [])
  const isDraftDirty = useMemo(() => {
    return (
      idsKey(draftPropertyIds) !== idsKey(selectedPropertyIds) ||
      draftStartDate !== startDate ||
      draftEndDate !== endDate
    )
  }, [draftPropertyIds, selectedPropertyIds, draftStartDate, draftEndDate, startDate, endDate, idsKey])

  useEffect(() => {
    // Keep draft controls in sync with applied values.
    setDraftPropertyIds(selectedPropertyIds)
    setDraftStartDate(startDate)
    setDraftEndDate(endDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchProperties = async () => {
      try {
        setLoadingOptions(true)
        setError(null)
        const { data, error: supabaseError } = await supabaseMetrics
          .from('properties')
          .select('property_id, name')
          .order('name')

        if (supabaseError) throw supabaseError
        if (!isMounted) return

        const options =
          data?.map((property) => ({
            value: property.property_id,
            label: property.name,
          })) ?? []

        setPropertyOptions(options)
      } catch (err) {
        if (!isMounted) return
        const message =
          (err as Error).message ||
          'Connection issue: Unable to load properties from the metrics database.'
        setError(message)
      } finally {
        if (!isMounted) return
        setLoadingOptions(false)
      }
    }

    fetchProperties()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchBaseline = async () => {
      if (selectedPropertyIds.length === 0) {
        setBaseline([])
        setContinuity([])
        setTimelineSegments([])
        setInspectionSeries([])
        setPhotoSeries([])
        setInspectionKeys([])
        setPhotoKeys([])
        setPhotoScatterPoints([])
        setPhotoMonthLabels([])
        setPhotoAreaLabels([])
        setWorkOrderSeries([])
        setWorkOrderKeys([])
        setEmergencyRateSeries([])
        setCompletionMedianSeries([])
        setTurnDaysSeries([])
        setTurnCostSeries([])
        setOccupancySeries([])
        setRentSeries([])
        setConcessionSeries([])
        setRatingSeries([])
        setRatingKeys([])
        setResponseSeries([])
        setResponseKeys([])
        setScorecardRows([])
        setCapexRows([])
        setCapexTotals([])
        setSelectedProjectId(null)
        setCapexDeltaData([])
        return
      }

      try {
        setLoadingBaseline(true)
        setError(null)
        const { data, error: supabaseError } = await supabaseMetrics
          .from('properties')
          .select('property_id, name, market, unit_count, year_built')
          .in('property_id', selectedPropertyIds)
          .order('name')

        if (supabaseError) throw supabaseError
        if (!isMounted) return
        setBaseline((data ?? []) as PropertyBaseline[])
      } catch (err) {
        if (!isMounted) return
        const message =
          (err as Error).message ||
          'Connection issue: Unable to load property baseline data from the metrics database.'
        setError(message)
      } finally {
        if (!isMounted) return
        setLoadingBaseline(false)
      }
    }

    fetchBaseline()

    return () => {
      isMounted = false
    }
  }, [selectedPropertyIds])

  useEffect(() => {
    let isMounted = true

    const fetchContinuity = async () => {
      if (selectedPropertyIds.length === 0) {
        setContinuity([])
        return
      }

      try {
        setLoadingContinuity(true)
        setError(null)

        const [properties, periods, ddEvents, photos] = await Promise.all([
          supabaseMetrics
            .from('properties')
            .select('property_id, name')
            .in('property_id', selectedPropertyIds),
          supabaseMetrics
            .from('property_periods')
            .select('property_id, start_date, owner_group_id')
            .in('property_id', selectedPropertyIds),
          supabaseMetrics
            .from('due_diligence_events')
            .select('property_id, dd_event_id')
            .in('property_id', selectedPropertyIds),
          supabaseMetrics.from('photos').select('property_id, photo_id').in('property_id', selectedPropertyIds),
        ])

        const errors = [properties.error, periods.error, ddEvents.error, photos.error].filter(Boolean)
        if (errors.length > 0) {
          throw errors[0]
        }

        if (!isMounted) return

        const byProperty = new Map()

        ;(properties.data ?? []).forEach((property) => {
          byProperty.set(property.property_id, {
            property_id: property.property_id,
            name: property.name,
            first_seen_date: null,
            owner_groups: new Set(),
            management_periods_count: 0,
            dd_events: new Set(),
            photo_count: 0,
          })
        })

        ;(periods.data ?? []).forEach((period) => {
          const entry = byProperty.get(period.property_id)
          if (!entry) return
          entry.management_periods_count += 1
          if (period.owner_group_id) {
            entry.owner_groups.add(period.owner_group_id)
          }
          if (period.start_date) {
            const current = entry.first_seen_date
            if (!current || period.start_date < current) {
              entry.first_seen_date = period.start_date
            }
          }
        })

        ;(ddEvents.data ?? []).forEach((event) => {
          const entry = byProperty.get(event.property_id)
          if (!entry) return
          if (event.dd_event_id) {
            entry.dd_events.add(event.dd_event_id)
          }
        })

        ;(photos.data ?? []).forEach((photo) => {
          const entry = byProperty.get(photo.property_id)
          if (!entry) return
          entry.photo_count += 1
        })

        const summary = Array.from(byProperty.values()).map((entry) => ({
          property_id: entry.property_id,
          name: entry.name,
          first_seen_date: entry.first_seen_date,
          owner_groups_count: entry.owner_groups.size,
          management_periods_count: entry.management_periods_count,
          dd_waves_count: entry.dd_events.size,
          photo_count: entry.photo_count,
        }))

        setContinuity(summary)
      } catch (err) {
        if (!isMounted) return
        const message =
          (err as Error).message ||
          'Connection issue: Unable to load continuity stats from the metrics database.'
        setError(message)
      } finally {
        if (!isMounted) return
        setLoadingContinuity(false)
      }
    }

    fetchContinuity()

    return () => {
      isMounted = false
    }
  }, [selectedPropertyIds])

  useEffect(() => {
    let isMounted = true

    const fetchCharts = async () => {
      if (selectedPropertyIds.length === 0) {
        setInspectionSeries([])
        setPhotoSeries([])
        setInspectionKeys([])
        setPhotoKeys([])
        return
      }

      if (!startDate || !endDate) {
        setInspectionSeries([])
        setPhotoSeries([])
        setInspectionKeys([])
        setPhotoKeys([])
        setPhotoScatterPoints([])
        setPhotoMonthLabels([])
        setPhotoAreaLabels([])
        setWorkOrderSeries([])
        setWorkOrderKeys([])
        setEmergencyRateSeries([])
        setCompletionMedianSeries([])
        setTurnDaysSeries([])
        setTurnCostSeries([])
        setOccupancySeries([])
        setRentSeries([])
        setConcessionSeries([])
        setRatingSeries([])
        setRatingKeys([])
        setResponseSeries([])
        setResponseKeys([])
        setScorecardRows([])
        return
      }

      try {
        setLoadingCharts(true)
        setError(null)

        const [
          inspections,
          photos,
          workOrders,
          turns,
          occupancy,
          rentSnapshots,
          ratings,
          scoreProperties,
          scorecardsScores,
          scorecardsWorkOrders,
          scorecardsCapex,
          scorecardsPhotos,
        ] = await Promise.all([
          supabaseMetrics
            .from('inspections')
            .select('property_id, inspection_date, inspection_type')
            .in('property_id', selectedPropertyIds)
            .gte('inspection_date', startDate)
            .lte('inspection_date', endDate),
          supabaseMetrics
            .from('photos')
            .select('property_id, captured_on, location_area')
            .in('property_id', selectedPropertyIds)
            .gte('captured_on', startDate)
            .lte('captured_on', endDate),
          supabaseMetrics
            .from('work_orders')
            .select('property_id, created_on, completed_on, category, priority')
            .in('property_id', selectedPropertyIds)
            .gte('created_on', startDate)
            .lte('created_on', endDate),
          supabaseMetrics
            .from('make_ready_turns')
            .select('property_id, move_out_date, ready_date, cost_usd')
            .in('property_id', selectedPropertyIds)
            .gte('move_out_date', startDate)
            .lte('move_out_date', endDate)
            .not('ready_date', 'is', null),
          supabaseMetrics
            .from('occupancy_snapshots')
            .select('property_id, snapshot_date, occupied_units, vacant_units, leased_units')
            .in('property_id', selectedPropertyIds)
            .gte('snapshot_date', startDate)
            .lte('snapshot_date', endDate),
          supabaseMetrics
            .from('rent_snapshots')
            .select('property_id, snapshot_date, avg_effective_rent, avg_asking_rent, concessions_per_unit')
            .in('property_id', selectedPropertyIds)
            .gte('snapshot_date', startDate)
            .lte('snapshot_date', endDate),
          supabaseMetrics
            .from('resident_ratings')
            .select('property_id, rating_month, source, rating_value, response_count')
            .in('property_id', selectedPropertyIds)
            .gte('rating_month', startDate)
            .lte('rating_month', endDate),
          supabaseMetrics
            .from('properties')
            .select('property_id, name, market, unit_count')
            .in('property_id', selectedPropertyIds),
          supabaseMetrics
            .from('property_condition_scores')
            .select('property_id, score_type, score_value, score_date')
            .in('property_id', selectedPropertyIds)
            .eq('score_type', 'Overall'),
          supabaseMetrics
            .from('work_orders')
            .select('property_id, created_on, completed_on, priority')
            .in('property_id', selectedPropertyIds)
            .gte('created_on', startDate)
            .lte('created_on', endDate),
          supabaseMetrics
            .from('capital_projects')
            .select('property_id, actual_usd, budget_usd, started_on')
            .in('property_id', selectedPropertyIds)
            .gte('started_on', startDate)
            .lte('started_on', endDate),
          supabaseMetrics
            .from('photos')
            .select('property_id, captured_on')
            .in('property_id', selectedPropertyIds)
            .gte('captured_on', startDate)
            .lte('captured_on', endDate),
        ])

        const errors = [
          inspections.error,
          photos.error,
          workOrders.error,
          turns.error,
          occupancy.error,
          rentSnapshots.error,
          ratings.error,
          scoreProperties.error,
          scorecardsScores.error,
          scorecardsWorkOrders.error,
          scorecardsCapex.error,
          scorecardsPhotos.error,
        ].filter(Boolean)
        if (errors.length > 0) {
          throw errors[0]
        }

        if (!isMounted) return

        const inspectionRows: InspectionMonthly[] =
          inspections.data?.map((row) => ({
            property_id: row.property_id,
            month: new Date(row.inspection_date).toISOString().slice(0, 7),
            inspection_type: row.inspection_type,
            inspections_count: 1,
          })) ?? []

        const photoRows: PhotoMonthly[] =
          photos.data?.map((row) => ({
            property_id: row.property_id,
            month: new Date(row.captured_on).toISOString().slice(0, 7),
            location_area: row.location_area,
            photos_count: 1,
          })) ?? []

        const workOrderRows =
          workOrders.data?.map((row) => ({
            property_id: row.property_id,
            month: new Date(row.created_on).toISOString().slice(0, 7),
            category: row.category ?? 'Uncategorized',
            work_orders_count: 1,
            priority: row.priority ?? 'Unknown',
            created_on: row.created_on,
            completed_on: row.completed_on ?? null,
          })) ?? []

        const aggregate = <T extends { month: string; [key: string]: unknown }>(
          rows: T[],
          categoryKey: keyof T,
          countKey: string
        ) => {
          const seriesMap = new Map<string, Record<string, number>>()
          const categories = new Set<string>()

          rows.forEach((row) => {
            const month = row.month
            const category = String(row[categoryKey] ?? 'Unknown')
            categories.add(category)
            const existing = seriesMap.get(month) ?? {}
            existing[category] = (existing[category] ?? 0) + 1
            seriesMap.set(month, existing)
          })

          const months = Array.from(seriesMap.keys()).sort()
          const data = months.map((month) => ({
            month,
            ...seriesMap.get(month),
          }))

          return {
            data,
            keys: Array.from(categories.values()),
          }
        }

        const inspectionAggregate = aggregate(inspectionRows, 'inspection_type', 'inspections_count')
        const photoAggregate = aggregate(photoRows, 'location_area', 'photos_count')
        const workOrderAggregate = aggregate(workOrderRows, 'category', 'work_orders_count')

        const emergencyByMonth = new Map<string, { emergency: number; total: number }>()
        workOrderRows.forEach((row) => {
          const month = row.month
          const entry = emergencyByMonth.get(month) ?? { emergency: 0, total: 0 }
          entry.total += 1
          if (row.priority === 'Emergency') {
            entry.emergency += 1
          }
          emergencyByMonth.set(month, entry)
        })
        const emergencySeries = Array.from(emergencyByMonth.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, counts]) => ({
            month,
            emergency_rate: counts.total ? counts.emergency / counts.total : 0,
          }))

        const completionByMonth = new Map<string, number[]>()
        workOrderRows.forEach((row) => {
          if (!row.completed_on) return
          const created = new Date(row.created_on).getTime()
          const completed = new Date(row.completed_on).getTime()
          if (!Number.isFinite(created) || !Number.isFinite(completed)) return
          const days = (completed - created) / (1000 * 60 * 60 * 24)
          const list = completionByMonth.get(row.month) ?? []
          list.push(days)
          completionByMonth.set(row.month, list)
        })

        const median = (values: number[]) => {
          if (values.length === 0) return 0
          const sorted = [...values].sort((a, b) => a - b)
          const mid = Math.floor(sorted.length / 2)
          return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
        }

        const completionSeries = Array.from(completionByMonth.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, values]) => ({
            month,
            median_days_to_complete: median(values),
          }))

        const turnByMonth = new Map<string, { days: number[]; costs: number[] }>()
        ;(turns.data ?? []).forEach((row) => {
          const month = new Date(row.move_out_date).toISOString().slice(0, 7)
          const start = new Date(row.move_out_date).getTime()
          const end = new Date(row.ready_date).getTime()
          if (!Number.isFinite(start) || !Number.isFinite(end)) return
          const days = (end - start) / (1000 * 60 * 60 * 24)
          const entry = turnByMonth.get(month) ?? { days: [], costs: [] }
          entry.days.push(days)
          if (row.cost_usd !== null && row.cost_usd !== undefined) {
            entry.costs.push(row.cost_usd)
          }
          turnByMonth.set(month, entry)
        })

        const average = (values: number[]) =>
          values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length

        const turnDays = Array.from(turnByMonth.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, values]) => ({
            month,
            median_turn_days: median(values.days),
          }))

        const turnCosts = Array.from(turnByMonth.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, values]) => ({
            month,
            avg_turn_cost: average(values.costs),
          }))

        const unitCountByProperty = new Map<string, number>()
        baseline.forEach((property) => {
          unitCountByProperty.set(property.property_id, property.unit_count)
        })

        const occupancyByDate = new Map<string, number[]>()
        ;(occupancy.data ?? []).forEach((row) => {
          const units = unitCountByProperty.get(row.property_id) ?? 0
          if (!units) return
          const rate = row.occupied_units / units
          const list = occupancyByDate.get(row.snapshot_date) ?? []
          list.push(rate)
          occupancyByDate.set(row.snapshot_date, list)
        })
        const occupancySeries = Array.from(occupancyByDate.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, values]) => ({
            date,
            occupancy_rate: average(values),
          }))

        const rentByDate = new Map<string, { effective: number[]; asking: number[]; concessions: number[] }>()
        ;(rentSnapshots.data ?? []).forEach((row) => {
          const entry = rentByDate.get(row.snapshot_date) ?? {
            effective: [],
            asking: [],
            concessions: [],
          }
          if (row.avg_effective_rent !== null && row.avg_effective_rent !== undefined) {
            entry.effective.push(row.avg_effective_rent)
          }
          if (row.avg_asking_rent !== null && row.avg_asking_rent !== undefined) {
            entry.asking.push(row.avg_asking_rent)
          }
          if (row.concessions_per_unit !== null && row.concessions_per_unit !== undefined) {
            entry.concessions.push(row.concessions_per_unit)
          }
          rentByDate.set(row.snapshot_date, entry)
        })

        const rentSeries = Array.from(rentByDate.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, values]) => ({
            date,
            avg_effective_rent: average(values.effective),
            avg_asking_rent: average(values.asking),
          }))

        const concessionSeries = Array.from(rentByDate.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, values]) => ({
            date,
            concessions_per_unit: average(values.concessions),
          }))

        const ratingByMonth = new Map<string, Record<string, { values: number[]; responses: number }>>()
        ;(ratings.data ?? []).forEach((row) => {
          const month = new Date(row.rating_month).toISOString().slice(0, 7)
          const source = row.source ?? 'Unknown'
          const entry = ratingByMonth.get(month) ?? {}
          if (!entry[source]) {
            entry[source] = { values: [], responses: 0 }
          }
          if (row.rating_value !== null && row.rating_value !== undefined) {
            entry[source].values.push(row.rating_value)
          }
          if (row.response_count !== null && row.response_count !== undefined) {
            entry[source].responses += row.response_count
          }
          ratingByMonth.set(month, entry)
        })

        const months = Array.from(ratingByMonth.keys()).sort()
        const sources = new Set<string>()
        months.forEach((month) => {
          Object.keys(ratingByMonth.get(month) ?? {}).forEach((source) => sources.add(source))
        })

        const ratingSeries = months.map((month) => {
          const entry = ratingByMonth.get(month) ?? {}
          const record: Record<string, number | string> = { month }
          sources.forEach((source) => {
            const values = entry[source]?.values ?? []
            record[source] = average(values)
          })
          return record
        })

        const responseSeries = months.map((month) => {
          const entry = ratingByMonth.get(month) ?? {}
          const record: Record<string, number | string> = { month }
          sources.forEach((source) => {
            record[source] = entry[source]?.responses ?? 0
          })
          return record
        })

        const scoreByProperty = new Map<
          string,
          { values: number[]; inRangeValues: number[] }
        >()
        ;(scorecardsScores.data ?? []).forEach((row) => {
          const entry = scoreByProperty.get(row.property_id) ?? { values: [], inRangeValues: [] }
          if (row.score_value !== null && row.score_value !== undefined) {
            entry.values.push(row.score_value)
            if (row.score_date >= startDate && row.score_date <= endDate) {
              entry.inRangeValues.push(row.score_value)
            }
          }
          scoreByProperty.set(row.property_id, entry)
        })

        const workOrdersByProperty = new Map<
          string,
          { emergencyCount: number; totalCount: number; completionDays: number[] }
        >()
        ;(scorecardsWorkOrders.data ?? []).forEach((row) => {
          const entry = workOrdersByProperty.get(row.property_id) ?? {
            emergencyCount: 0,
            totalCount: 0,
            completionDays: [],
          }
          entry.totalCount += 1
          if (row.priority === 'Emergency') {
            entry.emergencyCount += 1
          }
          if (row.completed_on) {
            const created = new Date(row.created_on).getTime()
            const completed = new Date(row.completed_on).getTime()
            if (Number.isFinite(created) && Number.isFinite(completed)) {
              entry.completionDays.push((completed - created) / (1000 * 60 * 60 * 24))
            }
          }
          workOrdersByProperty.set(row.property_id, entry)
        })

        const capexByProperty = new Map<string, number>()
        ;(scorecardsCapex.data ?? []).forEach((row) => {
          const value = row.actual_usd ?? row.budget_usd ?? 0
          capexByProperty.set(row.property_id, (capexByProperty.get(row.property_id) ?? 0) + value)
        })

        const photosByProperty = new Map<string, number>()
        ;(scorecardsPhotos.data ?? []).forEach((row) => {
          photosByProperty.set(row.property_id, (photosByProperty.get(row.property_id) ?? 0) + 1)
        })

        const medianValue = (values: number[]) => {
          if (values.length === 0) return null
          const sorted = [...values].sort((a, b) => a - b)
          const mid = Math.floor(sorted.length / 2)
          return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
        }

        const scorecardRows = (scoreProperties.data ?? []).map((property) => {
          const scoreEntry = scoreByProperty.get(property.property_id)
          const workEntry = workOrdersByProperty.get(property.property_id)
          const avgScore = scoreEntry ? average(scoreEntry.inRangeValues) : null
          const delta =
            scoreEntry && scoreEntry.values.length > 0
              ? Math.max(...scoreEntry.values) - Math.min(...scoreEntry.values)
              : null
          const emergencyRate =
            workEntry && workEntry.totalCount > 0 ? workEntry.emergencyCount / workEntry.totalCount : null
          const medianWoDays = workEntry ? medianValue(workEntry.completionDays) : null
          return {
            property_id: property.property_id,
            name: property.name,
            market: property.market ?? null,
            unit_count: property.unit_count,
            avg_overall_score: avgScore,
            overall_score_delta: delta,
            emergency_rate: emergencyRate,
            median_wo_days: medianWoDays,
            capex_usd: capexByProperty.get(property.property_id) ?? null,
            photo_count: photosByProperty.get(property.property_id) ?? null,
          }
        })

        const buildMonthRange = (start: string, end: string) => {
          const months: string[] = []
          const startDateObj = new Date(start)
          const endDateObj = new Date(end)
          if (!Number.isFinite(startDateObj.getTime()) || !Number.isFinite(endDateObj.getTime())) {
            return months
          }
          const cursor = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1)
          const endCursor = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), 1)
          while (cursor <= endCursor) {
            months.push(cursor.toISOString().slice(0, 7))
            cursor.setMonth(cursor.getMonth() + 1)
          }
          return months
        }

        const inspectionKeys = inspectionAggregate.keys
        const monthRange = buildMonthRange(startDate, endDate)
        const inspectionMap = new Map(inspectionAggregate.data.map((row) => [String(row.month), row]))
        const inspectionSeries = monthRange.map((month) => {
          const row = inspectionMap.get(month) ?? { month }
          const record: Record<string, number | string> = { month }
          inspectionKeys.forEach((key) => {
            record[key] = Number(row[key] ?? 0)
          })
          return record
        })

        const photoKeys = photoAggregate.keys
        const photoMap = new Map(photoAggregate.data.map((row) => [String(row.month), row]))
        const photoSeries = monthRange.map((month) => {
          const row = photoMap.get(month) ?? { month }
          const record: Record<string, number | string> = { month }
          photoKeys.forEach((key) => {
            record[key] = Number(row[key] ?? 0)
          })
          return record
        })

        const photoScatterPoints: {
          monthIndex: number
          areaIndex: number
          count: number
          monthLabel: string
          areaLabel: string
        }[] = []
        monthRange.forEach((month, monthIndex) => {
          const row = photoSeries[monthIndex]
          photoKeys.forEach((key, areaIndex) => {
            const count = Number(row?.[key] ?? 0)
            if (count <= 0) return
            photoScatterPoints.push({
              monthIndex,
              areaIndex,
              count,
              monthLabel: month,
              areaLabel: key,
            })
          })
        })

        setInspectionSeries(inspectionSeries)
        setInspectionKeys(inspectionKeys)
        setPhotoSeries(photoSeries)
        setPhotoKeys(photoKeys)
        setPhotoScatterPoints(photoScatterPoints)
        setPhotoMonthLabels(monthRange)
        setPhotoAreaLabels(photoKeys)
        setWorkOrderSeries(workOrderAggregate.data)
        setWorkOrderKeys(workOrderAggregate.keys)
        setEmergencyRateSeries(emergencySeries)
        setCompletionMedianSeries(completionSeries)
        setTurnDaysSeries(turnDays)
        setTurnCostSeries(turnCosts)
        setOccupancySeries(occupancySeries)
        setRentSeries(rentSeries)
        setConcessionSeries(concessionSeries)
        setRatingSeries(ratingSeries)
        setRatingKeys(Array.from(sources))
        setResponseSeries(responseSeries)
        setResponseKeys(Array.from(sources))
        setScorecardRows(scorecardRows)
      } catch (err) {
        if (!isMounted) return
        const message =
          (err as Error).message ||
          'Connection issue: Unable to load inspection/photo charts from the metrics database.'
        setError(message)
      } finally {
        if (!isMounted) return
        setLoadingCharts(false)
      }
    }

    fetchCharts()

    return () => {
      isMounted = false
    }
  }, [selectedPropertyIds, startDate, endDate])

  useEffect(() => {
    let isMounted = true

    const fetchCapex = async () => {
      if (selectedPropertyIds.length === 0) {
        setCapexRows([])
        setCapexTotals([])
        setSelectedProjectId(null)
        return
      }

      if (!startDate || !endDate) {
        setCapexRows([])
        setCapexTotals([])
        setSelectedProjectId(null)
        return
      }

      try {
        setLoadingCapex(true)
        setError(null)

        const { data, error: supabaseError } = await supabaseMetrics
          .from('capital_projects')
          .select(
            'property_id, capital_project_id, project_type, started_on, completed_on, budget_usd, actual_usd, units_impacted, vendor_name'
          )
          .in('property_id', selectedPropertyIds)
          .lte('started_on', endDate)
          .or(`completed_on.gte.${startDate},completed_on.is.null`)
          .order('started_on', { ascending: true })

        if (supabaseError) throw supabaseError
        if (!isMounted) return

        const rows = (data ?? []).map((row) => ({
          ...row,
          completed_on: row.completed_on ?? new Date().toISOString().slice(0, 10),
        })) as CapitalProjectRow[]

        const totalsMap = new Map<string, number>()
        rows.forEach((row) => {
          const value = row.actual_usd ?? row.budget_usd ?? 0
          totalsMap.set(row.project_type, (totalsMap.get(row.project_type) ?? 0) + value)
        })
        const totals = Array.from(totalsMap.entries()).map(([label, value], index) => ({
          name: label,
          value,
          color: getShades(sectionPalette.capital, totalsMap.size)[index] ?? getPrimary(sectionPalette.capital),
        }))

        setCapexRows(rows)
        setCapexTotals(totals)

        if (rows.length > 0 && !selectedProjectId) {
          setSelectedProjectId(rows[0].capital_project_id)
        }
      } catch (err) {
        if (!isMounted) return
        const message =
          (err as Error).message || 'Connection issue: Unable to load capital projects from the metrics database.'
        setError(message)
      } finally {
        if (!isMounted) return
        setLoadingCapex(false)
      }
    }

    fetchCapex()

    return () => {
      isMounted = false
    }
  }, [selectedPropertyIds, startDate, endDate, selectedProjectId])

  useEffect(() => {
    let isMounted = true

    const fetchCapexDelta = async () => {
      if (!selectedProjectId) {
        setCapexDeltaData([])
        return
      }

      try {
        setLoadingCapexDelta(true)
        setError(null)

        const { data: projectData, error: projectError } = await supabaseMetrics
          .from('capital_projects')
          .select('property_id, started_on, completed_on')
          .eq('capital_project_id', selectedProjectId)
          .single()

        if (projectError) throw projectError
        if (!isMounted) return

        const projectEnd = projectData.completed_on ?? new Date().toISOString().slice(0, 10)
        const preStart = new Date(projectData.started_on)
        preStart.setDate(preStart.getDate() - 180)
        const postEnd = new Date(projectEnd)
        postEnd.setDate(postEnd.getDate() + 180)

        const [properties, occupancy, rent, scores] = await Promise.all([
          supabaseMetrics.from('properties').select('property_id, unit_count').eq('property_id', projectData.property_id),
          supabaseMetrics
            .from('occupancy_snapshots')
            .select('snapshot_date, occupied_units')
            .eq('property_id', projectData.property_id)
            .gte('snapshot_date', preStart.toISOString().slice(0, 10))
            .lte('snapshot_date', postEnd.toISOString().slice(0, 10)),
          supabaseMetrics
            .from('rent_snapshots')
            .select('snapshot_date, avg_effective_rent')
            .eq('property_id', projectData.property_id)
            .gte('snapshot_date', preStart.toISOString().slice(0, 10))
            .lte('snapshot_date', postEnd.toISOString().slice(0, 10)),
          supabaseMetrics
            .from('property_condition_scores')
            .select('score_date, score_value')
            .eq('property_id', projectData.property_id)
            .eq('score_type', 'Overall')
            .gte('score_date', preStart.toISOString().slice(0, 10))
            .lte('score_date', postEnd.toISOString().slice(0, 10)),
        ])

        const errors = [properties.error, occupancy.error, rent.error, scores.error].filter(Boolean)
        if (errors.length > 0) throw errors[0]

        if (!isMounted) return

        const unitCount = properties.data?.[0]?.unit_count ?? 0
        const occupancyByDate = new Map(
          (occupancy.data ?? []).map((row) => [
            row.snapshot_date,
            unitCount ? row.occupied_units / unitCount : null,
          ])
        )
        const rentByDate = new Map((rent.data ?? []).map((row) => [row.snapshot_date, row.avg_effective_rent]))
        const scoreByDate = new Map((scores.data ?? []).map((row) => [row.score_date, row.score_value]))

        const splitMetrics = {
          pre: { occupancy_rate: [] as number[], avg_effective_rent: [] as number[], overall_score: [] as number[] },
          post: { occupancy_rate: [] as number[], avg_effective_rent: [] as number[], overall_score: [] as number[] },
        }

        const startedOn = new Date(projectData.started_on).getTime()
        const completedOn = new Date(projectEnd).getTime()

        const dates = new Set<string>([
          ...occupancyByDate.keys(),
          ...rentByDate.keys(),
          ...scoreByDate.keys(),
        ])

        dates.forEach((date) => {
          const timestamp = new Date(date).getTime()
          const bucket = timestamp < startedOn ? 'pre' : timestamp > completedOn ? 'post' : null
          if (!bucket) return
          const occupancyValue = occupancyByDate.get(date)
          const rentValue = rentByDate.get(date)
          const scoreValue = scoreByDate.get(date)
          if (occupancyValue !== null && occupancyValue !== undefined) {
            splitMetrics[bucket].occupancy_rate.push(occupancyValue)
          }
          if (rentValue !== null && rentValue !== undefined) {
            splitMetrics[bucket].avg_effective_rent.push(rentValue)
          }
          if (scoreValue !== null && scoreValue !== undefined) {
            splitMetrics[bucket].overall_score.push(scoreValue)
          }
        })

        const average = (values: number[]) =>
          values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length

        setCapexDeltaData([
          {
            period: 'pre',
            occupancy_rate: average(splitMetrics.pre.occupancy_rate),
            avg_effective_rent: average(splitMetrics.pre.avg_effective_rent),
            overall_score: average(splitMetrics.pre.overall_score),
          },
          {
            period: 'post',
            occupancy_rate: average(splitMetrics.post.occupancy_rate),
            avg_effective_rent: average(splitMetrics.post.avg_effective_rent),
            overall_score: average(splitMetrics.post.overall_score),
          },
        ])
      } catch (err) {
        if (!isMounted) return
        const message =
          (err as Error).message ||
          'Connection issue: Unable to load pre/post capital project KPIs from the metrics database.'
        setError(message)
      } finally {
        if (!isMounted) return
        setLoadingCapexDelta(false)
      }
    }

    fetchCapexDelta()

    return () => {
      isMounted = false
    }
  }, [selectedProjectId])

  useEffect(() => {
    let isMounted = true

    const fetchTimeline = async () => {
      if (selectedPropertyIds.length === 0) {
        setTimelineSegments([])
        return
      }

      try {
        setLoadingTimeline(true)
        setError(null)

        const [periods, properties, ownerGroups, managementCompanies] = await Promise.all([
          supabaseMetrics
            .from('property_periods')
            .select('property_id, start_date, end_date, owner_group_id, management_company_id, acquisition_type, exit_type')
            .in('property_id', selectedPropertyIds)
            .order('start_date', { ascending: true }),
          supabaseMetrics.from('properties').select('property_id, name').in('property_id', selectedPropertyIds),
          supabaseMetrics.from('owner_groups').select('owner_group_id, name'),
          supabaseMetrics.from('management_companies').select('management_company_id, name'),
        ])

        const errors = [periods.error, properties.error, ownerGroups.error, managementCompanies.error].filter(Boolean)
        if (errors.length > 0) {
          throw errors[0]
        }

        if (!isMounted) return

        const propertyNameById = new Map(
          (properties.data ?? []).map((property) => [property.property_id, property.name])
        )
        const ownerGroupById = new Map(
          (ownerGroups.data ?? []).map((group) => [group.owner_group_id, group.name])
        )
        const managementById = new Map(
          (managementCompanies.data ?? []).map((company) => [company.management_company_id, company.name])
        )

        const segments = (periods.data ?? []).map((period) => ({
          property_id: period.property_id,
          property_name: propertyNameById.get(period.property_id) ?? period.property_id,
          start_date: period.start_date,
          end_date: period.end_date ?? new Date().toISOString().slice(0, 10),
          owner_group: ownerGroupById.get(period.owner_group_id) ?? 'Unknown owner',
          management_company: managementById.get(period.management_company_id) ?? 'Unknown manager',
          acquisition_type: period.acquisition_type ?? null,
          exit_type: period.exit_type ?? null,
        }))

        setTimelineSegments(segments as TimelineSegment[])
      } catch (err) {
        if (!isMounted) return
        const message =
          (err as Error).message ||
          'Connection issue: Unable to load ownership timeline data from the metrics database.'
        setError(message)
      } finally {
        if (!isMounted) return
        setLoadingTimeline(false)
      }
    }

    fetchTimeline()

    return () => {
      isMounted = false
    }
  }, [selectedPropertyIds])

  const filteredBaseline = useMemo(() => {
    if (!searchValue) return baseline
    const search = searchValue.toLowerCase()
    return baseline.filter((property) => property.name.toLowerCase().includes(search))
  }, [baseline, searchValue])

  const topBaselineCards = useMemo(() => filteredBaseline.slice(0, 2), [filteredBaseline])
  const remainingBaselineCards = useMemo(() => filteredBaseline.slice(2), [filteredBaseline])

  const timelineByProperty = useMemo(() => {
    const map = new Map<string, TimelineSegment[]>()
    timelineSegments.forEach((segment) => {
      const list = map.get(segment.property_id) ?? []
      list.push(segment)
      map.set(segment.property_id, list)
    })
    return map
  }, [timelineSegments])

  const resolveColorKey = (colorKey: string) =>
    (Object.prototype.hasOwnProperty.call(theme.colors, colorKey)
      ? (colorKey as keyof typeof theme.colors)
      : 'gray') as keyof typeof theme.colors

  const getShades = (colorKey: string, count: number) => {
    const palette = theme.colors[resolveColorKey(colorKey)] ?? theme.colors.gray
    const indexes = [6, 5, 4, 3, 2, 1, 0]
    const shades = indexes.map((index) => palette[index]).filter(Boolean)
    return shades.slice(0, Math.max(1, count))
  }

  const getPrimary = (colorKey: string) => getShades(colorKey, 1)[0]

  const buildSeries = (keys: string[], colorKey: string) => {
    const shades = getShades(colorKey, Math.max(1, keys.length))
    return keys.map((key, index) => ({
      name: key,
      color: shades[index] ?? shades[0],
    }))
  }

  const SectionTitle = ({ label, color }: { label: string; color: string }) => (
    <Group gap="sm" align="center">
      <Box style={{ width: 6, height: 24, borderRadius: 999, backgroundColor: color }} />
      <Text fw={600}>{label}</Text>
    </Group>
  )


  const volumeSeveritySeries = useMemo(() => {
    if (workOrderSeries.length === 0 && emergencyRateSeries.length === 0) return []
    const emergencyMap = new Map(emergencyRateSeries.map((row) => [row.month, row.emergency_rate]))
    return workOrderSeries.map((row) => {
      const total = workOrderKeys.reduce((sum, key) => sum + Number(row[key] ?? 0), 0)
      return {
        month: row.month,
        total_work_orders: total,
        emergency_rate_pct: Number(((emergencyMap.get(String(row.month)) ?? 0) * 100).toFixed(1)),
      }
    })
  }, [workOrderSeries, workOrderKeys, emergencyRateSeries])

  const speedCostSeries = useMemo(() => {
    if (completionMedianSeries.length === 0 && turnCostSeries.length === 0) return []
    const completionMap = new Map(completionMedianSeries.map((row) => [row.month, row.median_days_to_complete]))
    const costMap = new Map(turnCostSeries.map((row) => [row.month, row.avg_turn_cost]))
    const months = Array.from(new Set([...completionMap.keys(), ...costMap.keys()])).sort()
    return months.map((month) => ({
      month,
      median_days_to_complete: completionMap.get(month) ?? null,
      avg_turn_cost: costMap.get(month) ?? null,
    }))
  }, [completionMedianSeries, turnCostSeries])

  const capexTotalValue = useMemo(
    () => capexTotals.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0),
    [capexTotals]
  )

  const capexColumns = useMemo<ColDef<CapitalProjectRow>[]>(() => {
    const rangeStart = startDate ? new Date(startDate).getTime() : 0
    const rangeEnd = endDate ? new Date(endDate).getTime() : 0
    const rangeSpan = Math.max(1, rangeEnd - rangeStart)

    return [
      { field: 'project_type', headerName: 'Project', flex: 1, minWidth: 180 },
      { field: 'vendor_name', headerName: 'Vendor', flex: 1, minWidth: 160 },
      { field: 'started_on', headerName: 'Start', minWidth: 120 },
      { field: 'completed_on', headerName: 'End', minWidth: 120 },
      {
        headerName: 'Timeline',
        minWidth: 200,
        flex: 1,
        sortable: false,
        filter: false,
        valueGetter: () => '',
        cellRenderer: (params) => {
          if (!startDate || !endDate) return null
          const start = new Date(params.data.started_on).getTime()
          const end = new Date(params.data.completed_on).getTime()
          const left = ((start - rangeStart) / rangeSpan) * 100
          const width = ((end - start) / rangeSpan) * 100
          return (
            <Box
              style={{
                position: 'relative',
                height: 10,
                borderRadius: 999,
                backgroundColor: 'var(--mantine-color-default)',
                overflow: 'hidden',
              }}
            >
              <Box
                style={{
                  position: 'absolute',
                  left: `${Math.max(0, left)}%`,
                  width: `${Math.max(2, width)}%`,
                  top: 0,
                  bottom: 0,
                  backgroundColor: getPrimary(sectionPalette.capital),
                }}
              />
            </Box>
          )
        },
      },
      {
        field: 'budget_usd',
        headerName: 'Budget',
        minWidth: 140,
        valueFormatter: ({ value }) => (value ? `$${Number(value).toLocaleString()}` : '—'),
      },
      {
        field: 'actual_usd',
        headerName: 'Actual',
        minWidth: 140,
        valueFormatter: ({ value }) => (value ? `$${Number(value).toLocaleString()}` : '—'),
      },
      {
        field: 'units_impacted',
        headerName: 'Units impacted',
        minWidth: 140,
        valueFormatter: ({ value }) => (value ?? '—'),
      },
    ]
  }, [startDate, endDate, sectionPalette])

  const scorecardColumns = useMemo<ColDef<ScorecardRow>[]>(() => {
    return [
      { field: 'name', headerName: 'Property', flex: 1, minWidth: 180 },
      { field: 'market', headerName: 'Market', minWidth: 140 },
      { field: 'unit_count', headerName: 'Units', minWidth: 100 },
      {
        field: 'avg_overall_score',
        headerName: 'Avg score',
        minWidth: 120,
        valueFormatter: ({ value }) => (value === null || value === undefined ? '—' : Number(value).toFixed(2)),
      },
      {
        field: 'overall_score_delta',
        headerName: 'Score delta',
        minWidth: 120,
        valueFormatter: ({ value }) => (value === null || value === undefined ? '—' : Number(value).toFixed(2)),
      },
      {
        field: 'emergency_rate',
        headerName: 'Emergency rate',
        minWidth: 140,
        valueFormatter: ({ value }) =>
          value === null || value === undefined ? '—' : `${(Number(value) * 100).toFixed(1)}%`,
      },
      {
        field: 'median_wo_days',
        headerName: 'Median WO days',
        minWidth: 140,
        valueFormatter: ({ value }) => (value === null || value === undefined ? '—' : `${Number(value).toFixed(1)}d`),
      },
      {
        field: 'capex_usd',
        headerName: 'Capex',
        minWidth: 140,
        valueFormatter: ({ value }) => (value === null || value === undefined ? '—' : `$${Number(value).toLocaleString()}`),
      },
      {
        field: 'photo_count',
        headerName: 'Photos',
        minWidth: 110,
        valueFormatter: ({ value }) => (value === null || value === undefined ? '—' : Number(value).toLocaleString()),
      },
    ]
  }, [])

  const ownerColor = (ownerGroup: string) => {
    const shades = getShades(sectionPalette.ownership, 6)
    const index = Math.abs(
      ownerGroup.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
    )
    return shades[index % shades.length]
  }

  const formatDateLabel = (value: string) => {
    if (!value) return 'N/A'
    return value
  }

  const capexMetricHasData = useMemo(() => {
    return capexDeltaData.some((row) => row[capexMetric] !== null && row[capexMetric] !== undefined)
  }, [capexDeltaData, capexMetric])

  const sankeyData = useMemo(() => {
    if (timelineSegments.length === 0) return null

    const nodeIndex = new Map<string, number>()
    const nodes: { name: string }[] = []
    const links: { source: number; target: number; value: number }[] = []
    const linkValues = new Map<string, number>()

    const getNodeIndex = (name: string) => {
      if (nodeIndex.has(name)) return nodeIndex.get(name) as number
      const index = nodes.length
      nodes.push({ name })
      nodeIndex.set(name, index)
      return index
    }

    timelineSegments.forEach((segment) => {
      const owner = segment.owner_group || 'Unknown owner'
      const manager = segment.management_company || 'Unknown manager'
      const property = `Property: ${segment.property_name}`

      const start = new Date(segment.start_date).getTime()
      const end = new Date(segment.end_date).getTime()
      const days = Number.isFinite(start) && Number.isFinite(end) ? Math.max(1, (end - start) / (1000 * 60 * 60 * 24)) : 1

      const ownerIdx = getNodeIndex(owner)
      const propertyIdx = getNodeIndex(property)
      const managerIdx = getNodeIndex(manager)

      const ownerKey = `${ownerIdx}-${propertyIdx}`
      const managerKey = `${propertyIdx}-${managerIdx}`
      linkValues.set(ownerKey, (linkValues.get(ownerKey) ?? 0) + days)
      linkValues.set(managerKey, (linkValues.get(managerKey) ?? 0) + days)
    })

    linkValues.forEach((value, key) => {
      const [source, target] = key.split('-').map((item) => Number(item))
      if (Number.isFinite(source) && Number.isFinite(target)) {
        links.push({ source, target, value })
      }
    })

    if (nodes.length === 0 || links.length === 0) return null
    return { nodes, links }
  }, [timelineSegments])

  const formatCapexMetricValue = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    if (capexMetric === 'occupancy_rate') {
      return `${(value * 100).toFixed(1)}%`
    }
    if (capexMetric === 'avg_effective_rent') {
      return `$${Number(value).toLocaleString()}`
    }
    return Number(value).toFixed(2)
  }

  return (
    <>
      <GlobalHeader variant="product" />
      <Box
        style={{
          paddingTop: GLOBAL_HEADER_HEIGHT,
          height: '100vh',
          display: 'flex',
          alignItems: 'stretch',
          overflow: 'hidden',
        }}
      >
        <HpySidebar height={`calc(100vh - ${GLOBAL_HEADER_HEIGHT}px)`} />
        <Box
          style={{
            flex: 1,
            padding: 56,
            display: 'flex',
            flexDirection: 'column',
            height: `calc(100vh - ${GLOBAL_HEADER_HEIGHT}px)`,
            overflowY: 'auto',
          }}
        >
          <Stack gap="xl">
            <HpyPageHeader
              title="Dashboard"
              appIconType="Insights"
              searchPlaceholder="Search dashboard"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              ctaLabel="Create report"
            />
            <Stack gap="lg">
              <Card padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Text fw={600}>Property baseline</Text>
                    <Badge variant="light" color="purple">
                      {selectedPropertyIds.length} selected
                    </Badge>
                  </Group>
                  <Group align="flex-end" wrap="wrap" gap="md">
                    <PropertyPicker
                      options={propertyOptions}
                      value={draftPropertyIds}
                      onChange={(next) => setDraftPropertyIds(next.slice(0, MAX_SELECTED_PROPERTIES))}
                      loading={loadingOptions}
                      maxSelected={MAX_SELECTED_PROPERTIES}
                      label="Properties"
                    />
                    <TextInput
                      type="date"
                      label="Start date"
                      value={draftStartDate}
                      onChange={(event) => setDraftStartDate(event.currentTarget.value)}
                      styles={{
                        input: {
                          backgroundColor: 'var(--mantine-color-body)',
                          borderColor: 'var(--mantine-color-default-border)',
                        },
                      }}
                    />
                    <TextInput
                      type="date"
                      label="End date"
                      value={draftEndDate}
                      onChange={(event) => setDraftEndDate(event.currentTarget.value)}
                      styles={{
                        input: {
                          backgroundColor: 'var(--mantine-color-body)',
                          borderColor: 'var(--mantine-color-default-border)',
                        },
                      }}
                    />
                    <Button
                      size="sm"
                      color="purple"
                      disabled={!isDraftDirty}
                      onClick={() => {
                        setSelectedPropertyIds(draftPropertyIds.slice(0, MAX_SELECTED_PROPERTIES))
                        setStartDate(draftStartDate)
                        setEndDate(draftEndDate)
                      }}
                    >
                      Apply
                    </Button>
                  </Group>
                </Stack>
              </Card>

              {error ? (
                <Alert color="red" title="Connection Issue">
                  <Text size="sm">{error}</Text>
                </Alert>
              ) : loadingBaseline ? (
                <Stack gap="sm">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} height={88} radius="md" />
                  ))}
                </Stack>
              ) : filteredBaseline.length === 0 ? (
                <Card padding="lg" radius="md" withBorder>
                  <Text size="sm" c="dimmed">
                    Select properties to view the baseline details.
                  </Text>
                </Card>
              ) : (
                <Stack gap="lg">
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    {filteredBaseline.map((property) => (
                      <Card key={property.property_id} padding="lg" radius="md" withBorder>
                        <Group justify="space-between" align="center" wrap="wrap">
                          <Stack gap={2}>
                            <Text fw={600}>{property.name}</Text>
                            <Text size="sm" c="dimmed">
                              {property.market ?? 'Unknown market'}
                            </Text>
                          </Stack>
                          <Group gap="xs" wrap="wrap">
                            <Badge color="gray" variant="light">
                              {property.unit_count} units
                            </Badge>
                            <Badge color="gray" variant="light">
                              {property.year_built ? `Built ${property.year_built}` : 'Year built N/A'}
                            </Badge>
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>

                  <Stack gap="sm">
                    <SectionTitle label="Ownership & lifecycle timeline" color={getPrimary(sectionPalette.ownership)} />
                    {loadingTimeline ? (
                      <Stack gap="sm">
                        {Array.from({ length: 2 }).map((_, index) => (
                          <Skeleton key={index} height={120} radius="md" />
                        ))}
                      </Stack>
                    ) : timelineByProperty.size === 0 ? (
                      <Card padding="lg" radius="md" withBorder>
                        <Text size="sm" c="dimmed">
                          No data to show for those dates and properties.
                        </Text>
                      </Card>
                    ) : (
                      <Stack gap="md">
                        {Array.from(timelineByProperty.entries()).map(([propertyId, segments]) => {
                          const sorted = [...segments].sort((a, b) => a.start_date.localeCompare(b.start_date))
                          const start = sorted[0]?.start_date ?? ''
                          const end = sorted[sorted.length - 1]?.end_date ?? ''
                          const startTs = start ? new Date(start).getTime() : 0
                          const endTs = end ? new Date(end).getTime() : startTs + 1
                          const span = Math.max(1, endTs - startTs)

                          return (
                            <Card key={propertyId} padding="lg" radius="md" withBorder>
                              <Stack gap="sm">
                                <Group justify="space-between" align="center" wrap="wrap">
                                  <Text fw={600}>{segments[0]?.property_name ?? propertyId}</Text>
                                  <Text size="sm" c="dimmed">
                                    {formatDateLabel(start)} – {formatDateLabel(end)}
                                  </Text>
                                </Group>
                                <Box
                                  style={{
                                    position: 'relative',
                                    height: 18,
                                    borderRadius: 999,
                                    backgroundColor: 'var(--mantine-color-default)',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {sorted.map((segment, index) => {
                                    const segStart = new Date(segment.start_date).getTime()
                                    const segEnd = new Date(segment.end_date).getTime()
                                    const left = ((segStart - startTs) / span) * 100
                                    const width = ((segEnd - segStart) / span) * 100
                                    return (
                                      <Box
                                        key={`${segment.property_id}-${index}`}
                                        style={{
                                          position: 'absolute',
                                          left: `${left}%`,
                                          width: `${Math.max(0.5, width)}%`,
                                          top: 0,
                                          bottom: 0,
                                          backgroundColor: ownerColor(segment.owner_group),
                                        }}
                                      />
                                    )
                                  })}
                                </Box>
                                <Stack gap={4}>
                                  {sorted.map((segment, index) => (
                                    <Group key={`${segment.property_id}-legend-${index}`} gap="xs" wrap="wrap">
                                      <Box
                                        style={{
                                          width: 10,
                                          height: 10,
                                          borderRadius: 2,
                                          backgroundColor: ownerColor(segment.owner_group),
                                        }}
                                      />
                                      <Text size="sm">
                                        {segment.owner_group} • {segment.management_company}
                                      </Text>
                                      <Text size="sm" c="dimmed">
                                        {segment.acquisition_type ?? 'Acquisition'} → {segment.exit_type ?? 'Current'}
                                      </Text>
                                    </Group>
                                  ))}
                                </Stack>
                              </Stack>
                            </Card>
                          )
                        })}
                      </Stack>
                    )}
                  </Stack>

                  <Stack gap="sm">
                    <SectionTitle label="Inspections frequency" color={getPrimary(sectionPalette.physical)} />
                    {loadingCharts ? (
                      <Skeleton height={260} radius="md" />
                    ) : inspectionSeries.length === 0 ? (
                      <Card padding="lg" radius="md" withBorder>
                        <Text size="sm" c="dimmed">
                          No data to show for those dates and properties.
                        </Text>
                      </Card>
                    ) : (
                      <Card padding="lg" radius="md" withBorder>
                        <AreaChart
                          h={260}
                          data={inspectionSeries}
                          dataKey="month"
                          withLegend
                          type="stacked"
                          withGradient={false}
                          series={buildSeries(inspectionKeys, sectionPalette.physical)}
                          tickLine="none"
                          gridAxis="y"
                          strokeDasharray="4 4"
                        />
                      </Card>
                    )}
                  </Stack>

                  <Stack gap="sm">
                    <SectionTitle label="Photo density" color={getPrimary(sectionPalette.physical)} />
                    {loadingCharts ? (
                      <Skeleton height={260} radius="md" />
                    ) : photoSeries.length === 0 ? (
                      <Card padding="lg" radius="md" withBorder>
                        <Text size="sm" c="dimmed">
                          No data to show for those dates and properties.
                        </Text>
                      </Card>
                    ) : (
                      <Card padding="lg" radius="md" withBorder>
                        <Box style={{ width: '100%', height: 260 }}>
                          <ResponsiveContainer>
                            <RechartsScatterChart>
                              <CartesianGrid strokeDasharray="4 4" />
                              <XAxis
                                dataKey="monthIndex"
                                type="number"
                                domain={[0, Math.max(0, photoMonthLabels.length - 1)]}
                                ticks={photoMonthLabels.map((_, index) => index)}
                                tickFormatter={(value) => photoMonthLabels[value] ?? ''}
                              />
                              <YAxis
                                dataKey="areaIndex"
                                type="number"
                                domain={[0, Math.max(0, photoAreaLabels.length - 1)]}
                                ticks={photoAreaLabels.map((_, index) => index)}
                                tickFormatter={(value) => photoAreaLabels[value] ?? ''}
                                width={140}
                              />
                              <ZAxis dataKey="count" range={[20, 120]} />
                              <Tooltip
                                formatter={(value, _, payload) => {
                                  if (!payload?.payload) return value
                                  return `${payload.payload.count} photos`
                                }}
                                labelFormatter={(_, payload) => {
                                  const point = payload?.[0]?.payload
                                  if (!point) return ''
                                  return `${point.monthLabel} • ${point.areaLabel}`
                                }}
                              />
                              <Scatter
                                data={photoScatterPoints}
                                fill={getPrimary(sectionPalette.physical)}
                                fillOpacity={0.6}
                              />
                            </RechartsScatterChart>
                          </ResponsiveContainer>
                        </Box>
                      </Card>
                    )}
                  </Stack>

                  <Stack gap="sm">
                    <SectionTitle label="Capital projects" color={getPrimary(sectionPalette.capital)} />
                    {loadingCapex ? (
                      <Skeleton height={280} radius="md" />
                    ) : capexRows.length === 0 ? (
                      <Card padding="lg" radius="md" withBorder>
                        <Text size="sm" c="dimmed">
                          No data to show for those dates and properties.
                        </Text>
                      </Card>
                    ) : (
                      <Box className="ag-theme-alpine">
                        <AgGridReact
                          {...AG_GRID_DEFAULT_GRID_PROPS}
                          pagination={false}
                          domLayout="autoHeight"
                          rowData={capexRows}
                          columnDefs={capexColumns}
                          defaultColDef={AG_GRID_DEFAULT_COL_DEF}
                          overlayNoRowsTemplate="No capital projects found."
                        />
                      </Box>
                    )}
                  </Stack>

                  <Stack gap="sm">
                    <SectionTitle label="Capex totals by type" color={getPrimary(sectionPalette.capital)} />
                    {loadingCapex ? (
                      <Skeleton height={260} radius="md" />
                    ) : capexTotals.length === 0 || capexTotalValue === 0 ? (
                      <Card padding="lg" radius="md" withBorder>
                        <Text size="sm" c="dimmed">
                          No data to show for those dates and properties.
                        </Text>
                      </Card>
                    ) : (
                      <Card padding="lg" radius="md" withBorder style={{ minHeight: 280 }}>
                        <Box style={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
                          <DonutChart
                            data={capexTotals}
                            thickness={24}
                            size={240}
                            withLabelsLine
                            withLabels
                          />
                        </Box>
                      </Card>
                    )}
                  </Stack>

                  <Stack gap="sm">
                    <SectionTitle label="Pre/Post project KPI deltas" color={getPrimary(sectionPalette.capital)} />
                    {capexRows.length === 0 ? (
                      <Card padding="lg" radius="md" withBorder>
                        <Text size="sm" c="dimmed">
                          No data to show for those dates and properties.
                        </Text>
                      </Card>
                    ) : (
                      <Card padding="lg" radius="md" withBorder>
                        <Stack gap="md">
                          <Group justify="space-between" align="center" wrap="wrap">
                            <Select
                              label="Project"
                              placeholder="Select a project"
                              data={capexRows.map((row) => ({
                                value: row.capital_project_id,
                                label: `${row.project_type} • ${row.vendor_name ?? 'Vendor N/A'}`,
                              }))}
                              value={selectedProjectId}
                              onChange={setSelectedProjectId}
                              searchable
                              clearable
                              styles={{
                                input: {
                                  backgroundColor: 'var(--mantine-color-body)',
                                  borderColor: 'var(--mantine-color-default-border)',
                                },
                              }}
                              style={{ minWidth: 280, flex: 1 }}
                            />
                            <SegmentedControl
                              value={capexMetric}
                              onChange={(value) =>
                                setCapexMetric(value as 'occupancy_rate' | 'avg_effective_rent' | 'overall_score')
                              }
                              data={[
                                { label: 'Occupancy', value: 'occupancy_rate' },
                                { label: 'Rent', value: 'avg_effective_rent' },
                                { label: 'Score', value: 'overall_score' },
                              ]}
                            />
                          </Group>
                          {loadingCapexDelta ? (
                            <Skeleton height={240} radius="md" />
                          ) : !capexMetricHasData ? (
                            <Text size="sm" c="dimmed">
                              No data to show for those dates and properties.
                            </Text>
                          ) : (
                            <BarChart
                              h={240}
                              data={capexDeltaData}
                              dataKey="period"
                              series={[
                                {
                                  name: capexMetric,
                                  color: getPrimary(sectionPalette.capital),
                                },
                              ]}
                              tickLine="none"
                              gridAxis="y"
                              strokeDasharray="4 4"
                              valueFormatter={(value) => formatCapexMetricValue(value as number)}
                            />
                          )}
                        </Stack>
                      </Card>
                    )}
                  </Stack>

                  <Stack gap="sm">
                    <SectionTitle label="Operations performance" color={getPrimary(sectionPalette.operations)} />
                    <Stack gap="sm">
                      <Text fw={600}>Volume & Severity</Text>
                      {loadingCharts ? (
                        <Skeleton height={260} radius="md" />
                      ) : volumeSeveritySeries.length === 0 ? (
                        <Card padding="lg" radius="md" withBorder>
                          <Text size="sm" c="dimmed">
                            No data to show for those dates and properties.
                          </Text>
                        </Card>
                      ) : (
                        <Card padding="lg" radius="md" withBorder>
                          <BarChart
                            h={260}
                            data={volumeSeveritySeries}
                            dataKey="month"
                            withLegend
                            series={[
                              { name: 'total_work_orders', color: getPrimary(sectionPalette.operations) },
                              {
                                name: 'emergency_rate_pct',
                                color: getShades(sectionPalette.operations, 2)[1] ?? getPrimary(sectionPalette.operations),
                              },
                            ]}
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                            valueFormatter={(value, name) =>
                              name === 'emergency_rate_pct'
                                ? `${Number(value).toFixed(1)}%`
                                : Number(value).toLocaleString()
                            }
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="sm">
                      <Text fw={600}>Speed & Cost</Text>
                      {loadingCharts ? (
                        <Skeleton height={260} radius="md" />
                      ) : speedCostSeries.length === 0 ? (
                        <Card padding="lg" radius="md" withBorder>
                          <Text size="sm" c="dimmed">
                            No data to show for those dates and properties.
                          </Text>
                        </Card>
                      ) : (
                        <Card padding="lg" radius="md" withBorder>
                          <LineChart
                            h={260}
                            data={speedCostSeries}
                            dataKey="month"
                            withLegend
                            series={[
                              { name: 'median_days_to_complete', color: getPrimary(sectionPalette.operations) },
                              {
                                name: 'avg_turn_cost',
                                color: getShades(sectionPalette.operations, 2)[1] ?? getPrimary(sectionPalette.operations),
                              },
                            ]}
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                            valueFormatter={(value, name) =>
                              name === 'avg_turn_cost' ? `$${Number(value).toLocaleString()}` : `${Number(value).toFixed(1)} days`
                            }
                          />
                        </Card>
                      )}
                    </Stack>
                  </Stack>

                  <Stack gap="sm">
                    <Group justify="space-between" align="center" wrap="wrap">
                      <SectionTitle label="Revenue & demand intelligence" color={getPrimary(sectionPalette.revenue)} />
                      <SegmentedControl
                        value={revenueChart}
                        onChange={(value) => setRevenueChart(value as 'occupancy' | 'rent' | 'concessions')}
                        data={[
                          { label: 'Occupancy', value: 'occupancy' },
                          { label: 'Rent', value: 'rent' },
                          { label: 'Concessions', value: 'concessions' },
                        ]}
                      />
                    </Group>
                    {loadingCharts ? (
                      <Skeleton height={260} radius="md" />
                    ) : revenueChart === 'occupancy' ? (
                      occupancySeries.length === 0 ? (
                        <Card padding="lg" radius="md" withBorder>
                          <Text size="sm" c="dimmed">
                            No data to show for those dates and properties.
                          </Text>
                        </Card>
                      ) : (
                        <Card padding="lg" radius="md" withBorder>
                          <LineChart
                            h={260}
                            data={occupancySeries}
                            dataKey="date"
                            withLegend={false}
                          series={[{ name: 'occupancy_rate', color: getPrimary(sectionPalette.revenue) }]}
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                            valueFormatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
                          />
                        </Card>
                      )
                    ) : revenueChart === 'rent' ? (
                      rentSeries.length === 0 ? (
                        <Card padding="lg" radius="md" withBorder>
                          <Text size="sm" c="dimmed">
                            No data to show for those dates and properties.
                          </Text>
                        </Card>
                      ) : (
                        <Card padding="lg" radius="md" withBorder>
                          <LineChart
                            h={260}
                            data={rentSeries}
                            dataKey="date"
                            withLegend
                            series={[
                              { name: 'avg_effective_rent', color: getPrimary(sectionPalette.revenue) },
                              { name: 'avg_asking_rent', color: getShades(sectionPalette.revenue, 2)[1] ?? getPrimary(sectionPalette.revenue) },
                            ]}
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                            valueFormatter={(value) => `$${Number(value).toLocaleString()}`}
                          />
                        </Card>
                      )
                    ) : concessionSeries.length === 0 ? (
                      <Card padding="lg" radius="md" withBorder>
                        <Text size="sm" c="dimmed">
                          No data to show for those dates and properties.
                        </Text>
                      </Card>
                    ) : (
                      <Card padding="lg" radius="md" withBorder>
                        <LineChart
                          h={260}
                          data={concessionSeries}
                          dataKey="date"
                          withLegend={false}
                        series={[{ name: 'concessions_per_unit', color: getPrimary(sectionPalette.revenue) }]}
                          tickLine="none"
                          gridAxis="y"
                          strokeDasharray="4 4"
                          valueFormatter={(value) => `$${Number(value).toLocaleString()}`}
                        />
                      </Card>
                    )}
                  </Stack>

                  <Stack gap="sm">
                    <SectionTitle label="Resident experience" color={getPrimary(sectionPalette.resident)} />
                    {loadingCharts ? (
                      <Skeleton height={260} radius="md" />
                    ) : ratingSeries.length === 0 ? (
                      <Card padding="lg" radius="md" withBorder>
                        <Text size="sm" c="dimmed">
                          No data to show for those dates and properties.
                        </Text>
                      </Card>
                    ) : (
                      <Card padding="lg" radius="md" withBorder>
                        <Stack gap="md">
                          <LineChart
                            h={220}
                            data={ratingSeries}
                            dataKey="month"
                            withLegend
                          series={buildSeries(ratingKeys, sectionPalette.resident)}
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                            valueFormatter={(value) => Number(value).toFixed(2)}
                          />
                          <BarChart
                            h={220}
                            data={responseSeries}
                            dataKey="month"
                            withLegend
                          series={buildSeries(responseKeys, sectionPalette.resident)}
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                          />
                        </Stack>
                      </Card>
                    )}
                  </Stack>

                  <Stack gap="sm">
                    <Text fw={600}>Cross-property comparison</Text>
                    {loadingCharts ? (
                      <Skeleton height={260} radius="md" />
                    ) : scorecardRows.length === 0 ? (
                      <Card padding="lg" radius="md" withBorder>
                        <Text size="sm" c="dimmed">
                          No data to show for those dates and properties.
                        </Text>
                      </Card>
                    ) : (
                      <Box className="ag-theme-alpine">
                        <AgGridReact
                          {...AG_GRID_DEFAULT_GRID_PROPS}
                          pagination={false}
                          domLayout="autoHeight"
                          rowData={scorecardRows}
                          columnDefs={scorecardColumns}
                          defaultColDef={AG_GRID_DEFAULT_COL_DEF}
                          overlayNoRowsTemplate="No scorecard data found."
                        />
                      </Box>
                    )}
                  </Stack>

                </Stack>
              )}
            </Stack>
          </Stack>
        </Box>
      </Box>
    </>
  )
}
