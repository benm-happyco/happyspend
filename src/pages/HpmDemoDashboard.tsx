import { Badge, Box, Card, Group, Image, SegmentedControl, Select, SimpleGrid, Stack, Tabs, Text, useMantineTheme } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyAppIcon } from '../theme/components/HpyAppIcon'
import capitolHeightsPhoto from '../assets/photos/capitolheightsphoto.png'
import { supabaseMetrics } from '../lib/supabaseMetrics'
import { DateInput } from '@mantine/dates'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { AgGridReact } from 'ag-grid-react'
import { ColDef } from 'ag-grid-community'
import { AG_GRID_DEFAULT_COL_DEF, AG_GRID_DEFAULT_GRID_PROPS } from '../lib/agGridDefaults'
import { AreaChart, BarChart, LineChart, PieChart } from '@mantine/charts'
import { CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import '@mantine/charts/styles.css'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

export function HpmDemoDashboard() {
  const theme = useMantineTheme()
  const [properties, setProperties] = useState<Record<string, any>[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('2024-01-01')
  const [endDate, setEndDate] = useState('2026-12-31')
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [propertyError, setPropertyError] = useState<string | null>(null)
  const [openWorkOrderCount, setOpenWorkOrderCount] = useState<string>('—')
  const [openWorkOrderDelta, setOpenWorkOrderDelta] = useState<string>('—')
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false)
  const [conditionScore, setConditionScore] = useState<string>('—')
  const [conditionDelta, setConditionDelta] = useState<string>('—')
  const [loadingCondition, setLoadingCondition] = useState(false)
  const [residentSatisfaction, setResidentSatisfaction] = useState<string>('—')
  const [residentDelta, setResidentDelta] = useState<string>('—')
  const [loadingResident, setLoadingResident] = useState(false)
  const [completionTime, setCompletionTime] = useState<string>('—')
  const [completionDelta, setCompletionDelta] = useState<string>('—')
  const [loadingCompletion, setLoadingCompletion] = useState(false)
  const [timelineSegments, setTimelineSegments] = useState<
    {
      property_id: string
      property_name: string
      start_date: string
      end_date: string
      owner_group: string
      management_company: string
      acquisition_type: string | null
      exit_type: string | null
    }[]
  >([])
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [timelineError, setTimelineError] = useState<string | null>(null)
  const [capitalProjects, setCapitalProjects] = useState<Record<string, any>[]>([])
  const [loadingCapital, setLoadingCapital] = useState(false)
  const [capitalError, setCapitalError] = useState<string | null>(null)
  const [conditionSeries, setConditionSeries] = useState<{ date: string; score: number }[]>([])
  const [loadingConditionSeries, setLoadingConditionSeries] = useState(false)
  const [workOrderVolumeSeries, setWorkOrderVolumeSeries] = useState<{ month: string; count: number }[]>([])
  const [loadingWorkOrderVolume, setLoadingWorkOrderVolume] = useState(false)
  const [resolutionSpeedSeries, setResolutionSpeedSeries] = useState<{ month: string; median_days: number }[]>([])
  const [loadingResolutionSpeed, setLoadingResolutionSpeed] = useState(false)
  const [statusMixSeries, setStatusMixSeries] = useState<{ month: string; [key: string]: number | string }[]>([])
  const [statusMixKeys, setStatusMixKeys] = useState<string[]>([])
  const [loadingStatusMix, setLoadingStatusMix] = useState(false)
  const [emergencyRateSeries, setEmergencyRateSeries] = useState<{ month: string; emergency_rate: number }[]>([])
  const [loadingEmergencyRate, setLoadingEmergencyRate] = useState(false)
  const [preventativeReactiveSeries, setPreventativeReactiveSeries] = useState<{ month: string; Preventative: number; Reactive: number }[]>([])
  const [loadingPreventativeReactive, setLoadingPreventativeReactive] = useState(false)
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ category: string; count: number; cost: number; labor: number }[]>([])
  const [loadingCategoryBreakdown, setLoadingCategoryBreakdown] = useState(false)
  const [categoryMetric, setCategoryMetric] = useState<'count' | 'cost' | 'labor'>('count')
  const [repeatIssueSeries, setRepeatIssueSeries] = useState<{ month: string; repeat_rate: number }[]>([])
  const [loadingRepeatIssue, setLoadingRepeatIssue] = useState(false)
  const [residentCorrelationSeries, setResidentCorrelationSeries] = useState<{ month: string; completion_days: number | null; rating: number | null }[]>([])
  const [loadingResidentCorrelation, setLoadingResidentCorrelation] = useState(false)
  const [incomeDistribution, setIncomeDistribution] = useState<{ range: string; count: number }[]>([])
  const [loadingIncomeDistribution, setLoadingIncomeDistribution] = useState(false)
  const [industryBreakdown, setIndustryBreakdown] = useState<{ industry: string; count: number }[]>([])
  const [loadingIndustryBreakdown, setLoadingIndustryBreakdown] = useState(false)
  const [employerBreakdown, setEmployerBreakdown] = useState<{ employer: string; count: number }[]>([])
  const [loadingEmployerBreakdown, setLoadingEmployerBreakdown] = useState(false)
  const [incomeStabilityMatrix, setIncomeStabilityMatrix] = useState<{ industry: string; avg_income: number; household_count: number }[]>([])
  const [loadingIncomeStabilityMatrix, setLoadingIncomeStabilityMatrix] = useState(false)
  const [rentSeries, setRentSeries] = useState<{ date: string; asking_rent: number; effective_rent: number; concessions: number }[]>([])
  const [loadingRentSeries, setLoadingRentSeries] = useState(false)
  const [overallEmergencyRate, setOverallEmergencyRate] = useState<string>('—')
  const [slaCompletionRate, setSlaCompletionRate] = useState<string>('—')
  const [loadingOpsHealth, setLoadingOpsHealth] = useState(false)
  const [occupancySeries, setOccupancySeries] = useState<
    { date: string; occupied_units: number; vacant_units: number; leased_units: number }[]
  >([])
  const [loadingOccupancySeries, setLoadingOccupancySeries] = useState(false)

  useEffect(() => {
    let mounted = true

    const fetchProperties = async () => {
      try {
        const { data, error } = await supabaseMetrics.from('properties').select('*').order('name')
        if (error) throw error
        if (!mounted) return
        setProperties(data ?? [])
        if (!selectedPropertyId && data && data.length > 0) {
          const firstId = data[0]?.property_id ?? data[0]?.id ?? null
          setSelectedPropertyId(firstId)
        }
      } catch (err) {
        if (!mounted) return
        setPropertyError((err as Error).message || 'Unable to load properties.')
      } finally {
        if (mounted) setLoadingProperties(false)
      }
    }

    fetchProperties()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId])

  const propertyOptions = useMemo(
    () =>
      properties.map((property) => ({
        value: property.property_id ?? property.id,
        label: property.name ?? property.property_name ?? 'Unknown property',
      })),
    [properties]
  )

  const selectedProperty =
    properties.find((property) => (property.property_id ?? property.id) === selectedPropertyId) ?? null
  const selectedPropertyName = selectedProperty?.name ?? selectedProperty?.property_name ?? 'Property Name'
  const selectedMarket = selectedProperty?.market ?? '—'
  const selectedStreet = selectedProperty?.street ?? ''
  const selectedCity = selectedProperty?.city ?? ''
  const selectedState = selectedProperty?.state ?? ''
  const selectedPostalCode = selectedProperty?.postal_code ?? ''
  const selectedUnits = typeof selectedProperty?.unit_count === 'number' ? selectedProperty.unit_count : null
  const selectedYearBuilt = selectedProperty?.year_built ?? null
  const cityStateLine = [selectedCity, selectedState].filter(Boolean).join(', ')

  const parseDateValue = (value: string) => {
    if (!value) return null
    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) return null
    return new Date(Date.UTC(year, month - 1, day, 12))
  }

  const formatDateValue = (value: Date | null) => {
    if (!value) return ''
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const previousMonthRange = (start: string, end: string) => {
    const startDate = parseDateValue(start)
    const endDate = parseDateValue(end)
    if (!startDate || !endDate) return null
    const prevStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() - 1, startDate.getUTCDate()))
    const prevEnd = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth() - 1, endDate.getUTCDate()))
    return {
      start: formatDateValue(prevStart),
      end: formatDateValue(prevEnd),
    }
  }

  const getShades = (count: number) => {
    const palette = theme.colors.purple ?? theme.colors.gray
    const indexes = [6, 5, 4, 3, 2, 1, 0]
    const shades = indexes.map((index) => palette[index]).filter(Boolean)
    return shades.slice(0, Math.max(1, count))
  }

  const ownerColor = (ownerGroup: string) => {
    const shades = getShades(6)
    const index = Math.abs(ownerGroup.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0))
    return shades[index % shades.length]
  }

  const formatDateLabel = (value: string) => {
    if (!value) return 'N/A'
    return value
  }

  const topCategories = useMemo(() => {
    return [...categoryBreakdown]
      .sort((a, b) => b[categoryMetric] - a[categoryMetric])
      .slice(0, 6)
  }, [categoryBreakdown, categoryMetric])

  const capitalColumns = useMemo<ColDef<Record<string, any>>[]>(() => {
    return [
      { field: 'project_type', headerName: 'Project', minWidth: 180, flex: 1 },
      { field: 'vendor_name', headerName: 'Vendor', minWidth: 160, flex: 1 },
      { field: 'started_on', headerName: 'Start', minWidth: 120 },
      { field: 'completed_on', headerName: 'End', minWidth: 120 },
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
        headerName: 'Units',
        minWidth: 110,
        valueFormatter: ({ value }) => (value || value === 0 ? Number(value).toLocaleString() : '—'),
      },
    ]
  }, [])

  useEffect(() => {
    let mounted = true

    const fetchWorkOrders = async () => {
      if (!selectedPropertyId) return
      setLoadingWorkOrders(true)
      try {
        let query = supabaseMetrics
          .from('work_orders')
          .select('*')
          .eq('property_id', selectedPropertyId)

        if (startDate) {
          query = query.gte('created_on', startDate)
        }
        if (endDate) {
          query = query.lte('created_on', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const openCount = rows.filter((row) => !row.completed_on).length
        setOpenWorkOrderCount(String(openCount))

        const previousRange = previousMonthRange(startDate, endDate)
        if (!previousRange) {
          setOpenWorkOrderDelta('—')
          return
        }

        const { data: previousData, error: previousError } = await supabaseMetrics
          .from('work_orders')
          .select('*')
          .eq('property_id', selectedPropertyId)
          .gte('created_on', previousRange.start)
          .lte('created_on', previousRange.end)

        if (previousError) throw previousError
        if (!mounted) return

        const previousRows = previousData ?? []
        const previousOpen = previousRows.filter((row) => !row.completed_on).length
        const delta = openCount - previousOpen
        const sign = delta >= 0 ? '+' : ''
        setOpenWorkOrderDelta(`${sign}${delta} work orders`)
      } catch (err) {
        if (!mounted) return
        setOpenWorkOrderCount('—')
        setOpenWorkOrderDelta('—')
      } finally {
        if (mounted) setLoadingWorkOrders(false)
      }
    }

    fetchWorkOrders()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchTimeline = async () => {
      if (!selectedPropertyId) return
      try {
        setLoadingTimeline(true)
        setTimelineError(null)

        const [periods, propertiesData, ownerGroups, managementCompanies] = await Promise.all([
          supabaseMetrics
            .from('property_periods')
            .select('property_id, start_date, end_date, owner_group_id, management_company_id, acquisition_type, exit_type')
            .eq('property_id', selectedPropertyId)
            .order('start_date', { ascending: true }),
          supabaseMetrics.from('properties').select('property_id, name').eq('property_id', selectedPropertyId),
          supabaseMetrics.from('owner_groups').select('owner_group_id, name'),
          supabaseMetrics.from('management_companies').select('management_company_id, name'),
        ])

        const errors = [periods.error, propertiesData.error, ownerGroups.error, managementCompanies.error].filter(Boolean)
        if (errors.length > 0) {
          throw errors[0]
        }

        if (!mounted) return

        const propertyNameById = new Map(
          (propertiesData.data ?? []).map((property) => [property.property_id, property.name])
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

        setTimelineSegments(segments)
      } catch (err) {
        if (!mounted) return
        setTimelineError(
          (err as Error).message || 'Connection issue: Unable to load ownership timeline data.'
        )
      } finally {
        if (!mounted) return
        setLoadingTimeline(false)
      }
    }

    fetchTimeline()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId])

  useEffect(() => {
    let mounted = true

    const fetchCapitalProjects = async () => {
      if (!selectedPropertyId) return
      try {
        setLoadingCapital(true)
        setCapitalError(null)

        let query = supabaseMetrics
          .from('capital_projects')
          .select('*')
          .eq('property_id', selectedPropertyId)
          .order('started_on', { ascending: false })

        if (startDate) {
          query = query.gte('started_on', startDate)
        }
        if (endDate) {
          query = query.lte('started_on', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        setCapitalProjects(data ?? [])
      } catch (err) {
        if (!mounted) return
        setCapitalError((err as Error).message || 'Unable to load capital projects.')
      } finally {
        if (!mounted) return
        setLoadingCapital(false)
      }
    }

    fetchCapitalProjects()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const formatDuration = (minutes: number | null) => {
      if (minutes === null) return '—'
      const totalMinutes = Math.max(0, Math.round(minutes))
      const hours = Math.floor(totalMinutes / 60)
      const mins = totalMinutes % 60
      return `${hours}hr ${mins}min`
    }

    const fetchCompletionTime = async () => {
      if (!selectedPropertyId) return
      setLoadingCompletion(true)
      try {
        let query = supabaseMetrics
          .from('work_orders')
          .select('*')
          .eq('property_id', selectedPropertyId)
          .not('completed_on', 'is', null)

        if (startDate) {
          query = query.gte('created_on', startDate)
        }
        if (endDate) {
          query = query.lte('created_on', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const durations = rows
          .map((row) => {
            const created = row.created_on ? new Date(row.created_on).getTime() : null
            const completed = row.completed_on ? new Date(row.completed_on).getTime() : null
            if (!created || !completed) return null
            return (completed - created) / (1000 * 60)
          })
          .filter((value) => typeof value === 'number') as number[]

        const average = durations.length
          ? durations.reduce((sum, value) => sum + value, 0) / durations.length
          : null
        setCompletionTime(formatDuration(average))

        const previousRange = previousMonthRange(startDate, endDate)
        if (!previousRange) {
          setCompletionDelta('—')
          return
        }

        const { data: previousData, error: previousError } = await supabaseMetrics
          .from('work_orders')
          .select('*')
          .eq('property_id', selectedPropertyId)
          .not('completed_on', 'is', null)
          .gte('created_on', previousRange.start)
          .lte('created_on', previousRange.end)

        if (previousError) throw previousError
        if (!mounted) return

        const previousDurations = (previousData ?? [])
          .map((row) => {
            const created = row.created_on ? new Date(row.created_on).getTime() : null
            const completed = row.completed_on ? new Date(row.completed_on).getTime() : null
            if (!created || !completed) return null
            return (completed - created) / (1000 * 60)
          })
          .filter((value) => typeof value === 'number') as number[]

        const previousAverage = previousDurations.length
          ? previousDurations.reduce((sum, value) => sum + value, 0) / previousDurations.length
          : null

        if (average === null || previousAverage === null) {
          setCompletionDelta('—')
        } else {
          const deltaMinutes = Number((average - previousAverage).toFixed(0))
          const sign = deltaMinutes >= 0 ? '+' : '-'
          setCompletionDelta(`${sign}${formatDuration(Math.abs(deltaMinutes))}`)
        }
      } catch (err) {
        if (!mounted) return
        setCompletionTime('—')
        setCompletionDelta('—')
      } finally {
        if (mounted) setLoadingCompletion(false)
      }
    }

    fetchCompletionTime()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchResidentSatisfaction = async () => {
      if (!selectedPropertyId) return
      setLoadingResident(true)
      try {
        let query = supabaseMetrics
          .from('resident_ratings')
          .select('*')
          .eq('property_id', selectedPropertyId)

        if (startDate) {
          query = query.gte('rating_month', startDate)
        }
        if (endDate) {
          query = query.lte('rating_month', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const values = rows
          .filter((row) => typeof row.rating_value === 'number')
          .map((row) => row.rating_value as number)

        const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
        setResidentSatisfaction(average === null ? '—' : average.toFixed(1))

        const previousRange = previousMonthRange(startDate, endDate)
        if (!previousRange) {
          setResidentDelta('—')
          return
        }

        const { data: previousData, error: previousError } = await supabaseMetrics
          .from('resident_ratings')
          .select('*')
          .eq('property_id', selectedPropertyId)
          .gte('rating_month', previousRange.start)
          .lte('rating_month', previousRange.end)

        if (previousError) throw previousError
        if (!mounted) return

        const previousValues = (previousData ?? [])
          .filter((row) => typeof row.rating_value === 'number')
          .map((row) => row.rating_value as number)
        const previousAverage = previousValues.length
          ? previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length
          : null

        if (average === null || previousAverage === null) {
          setResidentDelta('—')
        } else {
          const delta = Number((average - previousAverage).toFixed(1))
          const sign = delta >= 0 ? '+' : ''
          setResidentDelta(`${sign}${delta} pts`)
        }
      } catch (err) {
        if (!mounted) return
        setResidentSatisfaction('—')
        setResidentDelta('—')
      } finally {
        if (mounted) setLoadingResident(false)
      }
    }

    fetchResidentSatisfaction()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchConditionScore = async () => {
      if (!selectedPropertyId) return
      setLoadingCondition(true)
      try {
        let query = supabaseMetrics
          .from('property_condition_scores')
          .select('*')
          .eq('property_id', selectedPropertyId)

        if (startDate) {
          query = query.gte('score_date', startDate)
        }
        if (endDate) {
          query = query.lte('score_date', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const values = rows
          .filter((row) => typeof row.score_value === 'number')
          .map((row) => row.score_value as number)

        const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
        setConditionScore(average === null ? '—' : average.toFixed(1))

        const previousRange = previousMonthRange(startDate, endDate)
        if (!previousRange) {
          setConditionDelta('—')
          return
        }

        const { data: previousData, error: previousError } = await supabaseMetrics
          .from('property_condition_scores')
          .select('*')
          .eq('property_id', selectedPropertyId)
          .gte('score_date', previousRange.start)
          .lte('score_date', previousRange.end)

        if (previousError) throw previousError
        if (!mounted) return

        const previousValues = (previousData ?? [])
          .filter((row) => typeof row.score_value === 'number')
          .map((row) => row.score_value as number)
        const previousAverage = previousValues.length
          ? previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length
          : null

        if (average === null || previousAverage === null) {
          setConditionDelta('—')
        } else {
          const delta = Number((average - previousAverage).toFixed(1))
          const sign = delta > 0 ? '+' : ''
          setConditionDelta(`${sign}${delta} pts`)
        }
      } catch (err) {
        if (!mounted) return
        setConditionScore('—')
        setConditionDelta('—')
      } finally {
        if (mounted) setLoadingCondition(false)
      }
    }

    fetchConditionScore()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchConditionSeries = async () => {
      if (!selectedPropertyId) return
      setLoadingConditionSeries(true)
      try {
        let query = supabaseMetrics
          .from('property_condition_scores')
          .select('*')
          .eq('property_id', selectedPropertyId)
          .order('score_date', { ascending: true })

        if (startDate) {
          query = query.gte('score_date', startDate)
        }
        if (endDate) {
          query = query.lte('score_date', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const series = (data ?? [])
          .filter((row) => row.score_date && typeof row.score_value === 'number')
          .map((row) => ({
            date: row.score_date,
            score: Number(row.score_value),
          }))

        setConditionSeries(series)
      } catch (err) {
        if (!mounted) return
        setConditionSeries([])
      } finally {
        if (mounted) setLoadingConditionSeries(false)
      }
    }

    fetchConditionSeries()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchWorkOrderVolume = async () => {
      if (!selectedPropertyId) return
      setLoadingWorkOrderVolume(true)
      try {
        let query = supabaseMetrics
          .from('work_orders')
          .select('created_on')
          .eq('property_id', selectedPropertyId)

        if (startDate) {
          query = query.gte('created_on', startDate)
        }
        if (endDate) {
          query = query.lte('created_on', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const monthMap = new Map<string, number>()

        rows.forEach((row) => {
          if (!row.created_on) return
          const month = row.created_on.slice(0, 7)
          monthMap.set(month, (monthMap.get(month) ?? 0) + 1)
        })

        const series = Array.from(monthMap.entries())
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month))

        setWorkOrderVolumeSeries(series)
      } catch (err) {
        if (!mounted) return
        setWorkOrderVolumeSeries([])
      } finally {
        if (mounted) setLoadingWorkOrderVolume(false)
      }
    }

    fetchWorkOrderVolume()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchResolutionSpeed = async () => {
      if (!selectedPropertyId) return
      setLoadingResolutionSpeed(true)
      try {
        let query = supabaseMetrics
          .from('work_orders')
          .select('created_on, completed_on')
          .eq('property_id', selectedPropertyId)
          .not('completed_on', 'is', null)

        if (startDate) {
          query = query.gte('created_on', startDate)
        }
        if (endDate) {
          query = query.lte('created_on', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const monthMap = new Map<string, number[]>()

        rows.forEach((row) => {
          if (!row.created_on || !row.completed_on) return
          const month = row.created_on.slice(0, 7)
          const created = new Date(row.created_on).getTime()
          const completed = new Date(row.completed_on).getTime()
          const days = (completed - created) / (1000 * 60 * 60 * 24)
          if (!monthMap.has(month)) monthMap.set(month, [])
          monthMap.get(month)!.push(days)
        })

        const series = Array.from(monthMap.entries())
          .map(([month, durations]) => {
            const sorted = [...durations].sort((a, b) => a - b)
            const median = sorted[Math.floor(sorted.length / 2)] ?? 0
            return { month, median_days: Number(median.toFixed(1)) }
          })
          .sort((a, b) => a.month.localeCompare(b.month))

        setResolutionSpeedSeries(series)
      } catch (err) {
        if (!mounted) return
        setResolutionSpeedSeries([])
      } finally {
        if (mounted) setLoadingResolutionSpeed(false)
      }
    }

    fetchResolutionSpeed()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchStatusMix = async () => {
      if (!selectedPropertyId) return
      setLoadingStatusMix(true)
      try {
        let query = supabaseMetrics
          .from('work_orders')
          .select('created_on, status')
          .eq('property_id', selectedPropertyId)

        if (startDate) {
          query = query.gte('created_on', startDate)
        }
        if (endDate) {
          query = query.lte('created_on', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const monthStatusMap = new Map<string, Record<string, number>>()

        rows.forEach((row) => {
          if (!row.created_on) return
          const month = row.created_on.slice(0, 7)
          const status = row.status ?? 'Unknown'
          if (!monthStatusMap.has(month)) monthStatusMap.set(month, {})
          const statusCounts = monthStatusMap.get(month)!
          statusCounts[status] = (statusCounts[status] ?? 0) + 1
        })

        const series = Array.from(monthStatusMap.entries())
          .map(([month, statusCounts]) => ({
            month,
            ...statusCounts,
          }))
          .sort((a, b) => a.month.localeCompare(b.month))

        const allStatuses = new Set<string>()
        rows.forEach((row) => {
          if (row.status) allStatuses.add(row.status)
        })

        setStatusMixKeys(Array.from(allStatuses).sort())
        setStatusMixSeries(series)
      } catch (err) {
        if (!mounted) return
        setStatusMixSeries([])
      } finally {
        if (mounted) setLoadingStatusMix(false)
      }
    }

    fetchStatusMix()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchEmergencyRate = async () => {
      if (!selectedPropertyId) return
      setLoadingEmergencyRate(true)
      try {
        let query = supabaseMetrics
          .from('work_orders')
          .select('created_on, priority')
          .eq('property_id', selectedPropertyId)

        if (startDate) {
          query = query.gte('created_on', startDate)
        }
        if (endDate) {
          query = query.lte('created_on', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const monthMap = new Map<string, { total: number; emergency: number }>()

        rows.forEach((row) => {
          if (!row.created_on) return
          const month = row.created_on.slice(0, 7)
          if (!monthMap.has(month)) monthMap.set(month, { total: 0, emergency: 0 })
          const counts = monthMap.get(month)!
          counts.total += 1
          const priority = (row.priority ?? '').toLowerCase()
          if (priority.includes('emergency') || priority.includes('urgent')) {
            counts.emergency += 1
          }
        })

        const series = Array.from(monthMap.entries())
          .map(([month, counts]) => ({
            month,
            emergency_rate: counts.total ? Number(((counts.emergency / counts.total) * 100).toFixed(1)) : 0,
          }))
          .sort((a, b) => a.month.localeCompare(b.month))

        setEmergencyRateSeries(series)
      } catch (err) {
        if (!mounted) return
        setEmergencyRateSeries([])
      } finally {
        if (mounted) setLoadingEmergencyRate(false)
      }
    }

    fetchEmergencyRate()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchPreventativeReactive = async () => {
      if (!selectedPropertyId) return
      setLoadingPreventativeReactive(true)
      try {
        let query = supabaseMetrics
          .from('work_orders')
          .select('created_on, category')
          .eq('property_id', selectedPropertyId)

        if (startDate) {
          query = query.gte('created_on', startDate)
        }
        if (endDate) {
          query = query.lte('created_on', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const monthMap = new Map<string, { preventative: number; reactive: number }>()

        const preventativeKeywords = ['maintenance', 'inspection', 'preventative', 'preventive', 'scheduled']
        const isPreventative = (category: string) => {
          const normalized = (category ?? '').toLowerCase()
          return preventativeKeywords.some((keyword) => normalized.includes(keyword))
        }

        rows.forEach((row) => {
          if (!row.created_on) return
          const month = row.created_on.slice(0, 7)
          if (!monthMap.has(month)) monthMap.set(month, { preventative: 0, reactive: 0 })
          const counts = monthMap.get(month)!
          if (isPreventative(row.category)) {
            counts.preventative += 1
          } else {
            counts.reactive += 1
          }
        })

        const series = Array.from(monthMap.entries())
          .map(([month, counts]) => ({
            month,
            Preventative: counts.preventative,
            Reactive: counts.reactive,
          }))
          .sort((a, b) => a.month.localeCompare(b.month))

        setPreventativeReactiveSeries(series)
      } catch (err) {
        if (!mounted) return
        setPreventativeReactiveSeries([])
      } finally {
        if (mounted) setLoadingPreventativeReactive(false)
      }
    }

    fetchPreventativeReactive()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchCategoryBreakdown = async () => {
      if (!selectedPropertyId) return
      setLoadingCategoryBreakdown(true)
      try {
        let query = supabaseMetrics
          .from('work_orders')
          .select('category, material_cost_usd, labor_minutes')
          .eq('property_id', selectedPropertyId)

        if (startDate) {
          query = query.gte('created_on', startDate)
        }
        if (endDate) {
          query = query.lte('created_on', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const categoryMap = new Map<string, { count: number; cost: number; labor: number }>()

        rows.forEach((row) => {
          const category = row.category ?? 'Uncategorized'
          if (!categoryMap.has(category)) categoryMap.set(category, { count: 0, cost: 0, labor: 0 })
          const stats = categoryMap.get(category)!
          stats.count += 1
          stats.cost += Number(row.material_cost_usd ?? 0)
          stats.labor += Number(row.labor_minutes ?? 0) / 60
        })

        const breakdown = Array.from(categoryMap.entries())
          .map(([category, stats]) => ({
            category,
            count: stats.count,
            cost: Number(stats.cost.toFixed(2)),
            labor: Number(stats.labor.toFixed(2)),
          }))

        setCategoryBreakdown(breakdown)
      } catch (err) {
        if (!mounted) return
        setCategoryBreakdown([])
      } finally {
        if (mounted) setLoadingCategoryBreakdown(false)
      }
    }

    fetchCategoryBreakdown()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchRepeatIssues = async () => {
      if (!selectedPropertyId) return
      setLoadingRepeatIssue(true)
      try {
        let query = supabaseMetrics
          .from('work_orders')
          .select('work_order_id, created_on, unit_label, category')
          .eq('property_id', selectedPropertyId)
          .order('created_on', { ascending: true })

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const monthMap = new Map<string, { total: number; repeat: number }>()

        rows.forEach((row, index) => {
          if (!row.created_on) return
          const month = row.created_on.slice(0, 7)
          if (!monthMap.has(month)) monthMap.set(month, { total: 0, repeat: 0 })
          const counts = monthMap.get(month)!
          counts.total += 1

          const currentDate = new Date(row.created_on).getTime()
          const sixtyDaysAgo = currentDate - 60 * 24 * 60 * 60 * 1000

          const hasRecent = rows.slice(0, index).some((prevRow) => {
            if (!prevRow.created_on) return false
            const prevDate = new Date(prevRow.created_on).getTime()
            const sameUnit = prevRow.unit_label === row.unit_label
            const sameCategory = prevRow.category === row.category
            const within60Days = prevDate >= sixtyDaysAgo && prevDate < currentDate
            return sameUnit && sameCategory && within60Days
          })

          if (hasRecent) counts.repeat += 1
        })

        const series = Array.from(monthMap.entries())
          .filter(([, counts]) => counts.total > 0)
          .map(([month, counts]) => ({
            month,
            repeat_rate: Number(((counts.repeat / counts.total) * 100).toFixed(1)),
          }))
          .sort((a, b) => a.month.localeCompare(b.month))

        if (startDate || endDate) {
          const filtered = series.filter((row) => {
            if (startDate && row.month < startDate.slice(0, 7)) return false
            if (endDate && row.month > endDate.slice(0, 7)) return false
            return true
          })
          setRepeatIssueSeries(filtered)
        } else {
          setRepeatIssueSeries(series)
        }
      } catch (err) {
        if (!mounted) return
        setRepeatIssueSeries([])
      } finally {
        if (mounted) setLoadingRepeatIssue(false)
      }
    }

    fetchRepeatIssues()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchResidentCorrelation = async () => {
      if (!selectedPropertyId) return
      setLoadingResidentCorrelation(true)
      try {
        const [workOrdersResult, ratingsResult] = await Promise.all([
          (async () => {
            let query = supabaseMetrics
              .from('work_orders')
              .select('created_on, completed_on')
              .eq('property_id', selectedPropertyId)
              .not('completed_on', 'is', null)

            if (startDate) query = query.gte('created_on', startDate)
            if (endDate) query = query.lte('created_on', endDate)

            return await query
          })(),
          (async () => {
            let query = supabaseMetrics
              .from('resident_ratings')
              .select('rating_month, rating_value')
              .eq('property_id', selectedPropertyId)

            if (startDate) query = query.gte('rating_month', startDate)
            if (endDate) query = query.lte('rating_month', endDate)

            return await query
          })(),
        ])

        if (workOrdersResult.error) throw workOrdersResult.error
        if (ratingsResult.error) throw ratingsResult.error
        if (!mounted) return

        const workOrders = workOrdersResult.data ?? []
        const ratings = ratingsResult.data ?? []

        const completionByMonth = new Map<string, number[]>()
        workOrders.forEach((row) => {
          if (!row.created_on || !row.completed_on) return
          const month = row.created_on.slice(0, 7)
          const created = new Date(row.created_on).getTime()
          const completed = new Date(row.completed_on).getTime()
          const days = (completed - created) / (1000 * 60 * 60 * 24)
          if (!completionByMonth.has(month)) completionByMonth.set(month, [])
          completionByMonth.get(month)!.push(days)
        })

        const ratingByMonth = new Map<string, number[]>()
        ratings.forEach((row) => {
          if (!row.rating_month || typeof row.rating_value !== 'number') return
          const month = row.rating_month.slice(0, 7)
          if (!ratingByMonth.has(month)) ratingByMonth.set(month, [])
          ratingByMonth.get(month)!.push(row.rating_value)
        })

        const allMonths = new Set([...completionByMonth.keys(), ...ratingByMonth.keys()])
        const series = Array.from(allMonths)
          .map((month) => {
            const completionDurations = completionByMonth.get(month)
            const completionAvg = completionDurations
              ? completionDurations.reduce((sum, val) => sum + val, 0) / completionDurations.length
              : null

            const ratingValues = ratingByMonth.get(month)
            const ratingAvg = ratingValues
              ? ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length
              : null

            return {
              month,
              completion_days: completionAvg ? Number(completionAvg.toFixed(1)) : null,
              rating: ratingAvg ? Number(ratingAvg.toFixed(1)) : null,
            }
          })
          .sort((a, b) => a.month.localeCompare(b.month))

        setResidentCorrelationSeries(series)
      } catch (err) {
        if (!mounted) return
        setResidentCorrelationSeries([])
      } finally {
        if (mounted) setLoadingResidentCorrelation(false)
      }
    }

    fetchResidentCorrelation()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchOpsHealth = async () => {
      if (!selectedPropertyId) return
      setLoadingOpsHealth(true)
      try {
        let query = supabaseMetrics
          .from('work_orders')
          .select('priority, created_on, completed_on')
          .eq('property_id', selectedPropertyId)

        if (startDate) {
          query = query.gte('created_on', startDate)
        }
        if (endDate) {
          query = query.lte('created_on', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const emergencyCount = rows.filter((row) => {
          const priority = (row.priority ?? '').toLowerCase()
          return priority.includes('emergency') || priority.includes('urgent')
        }).length
        const emergencyPct = rows.length ? Math.round((emergencyCount / rows.length) * 100) : 0
        setOverallEmergencyRate(`${emergencyPct}%`)

        const SLA_DAYS = 7
        const completedRows = rows.filter((row) => row.completed_on)
        const withinSLA = completedRows.filter((row) => {
          const created = new Date(row.created_on).getTime()
          const completed = new Date(row.completed_on).getTime()
          const days = (completed - created) / (1000 * 60 * 60 * 24)
          return days <= SLA_DAYS
        }).length
        const slaPct = completedRows.length ? Math.round((withinSLA / completedRows.length) * 100) : 0
        setSlaCompletionRate(`${slaPct}%`)
      } catch (err) {
        if (!mounted) return
        setOverallEmergencyRate('—')
        setSlaCompletionRate('—')
      } finally {
        if (mounted) setLoadingOpsHealth(false)
      }
    }

    fetchOpsHealth()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchIncomeDistribution = async () => {
      if (!selectedPropertyId) return
      setLoadingIncomeDistribution(true)
      try {
        const { data, error } = await supabaseMetrics
          .from('households')
          .select('income_annual_usd')
          .eq('property_id', selectedPropertyId)
          .limit(500)

        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const buckets = [
          { range: '<$25k', min: 0, max: 25000, count: 0 },
          { range: '$25k-$50k', min: 25000, max: 50000, count: 0 },
          { range: '$50k-$75k', min: 50000, max: 75000, count: 0 },
          { range: '$75k-$100k', min: 75000, max: 100000, count: 0 },
          { range: '$100k-$150k', min: 100000, max: 150000, count: 0 },
          { range: '$150k+', min: 150000, max: Infinity, count: 0 },
        ]

        rows.forEach((row) => {
          const income = Number(row.income_annual_usd ?? 0)
          if (income <= 0) return
          const bucket = buckets.find((b) => income >= b.min && income < b.max)
          if (bucket) bucket.count += 1
        })

        setIncomeDistribution(buckets.map((b) => ({ range: b.range, count: b.count })))
      } catch (err) {
        if (!mounted) return
        setIncomeDistribution([])
      } finally {
        if (mounted) setLoadingIncomeDistribution(false)
      }
    }

    fetchIncomeDistribution()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId])

  useEffect(() => {
    let mounted = true

    const fetchIndustryBreakdown = async () => {
      if (!selectedPropertyId) return
      setLoadingIndustryBreakdown(true)
      try {
        const { data: householdsData, error: householdsError } = await supabaseMetrics
          .from('households')
          .select('household_id')
          .eq('property_id', selectedPropertyId)
          .limit(500)

        if (householdsError) throw householdsError
        if (!mounted) return

        const householdIds = (householdsData ?? []).map((h) => h.household_id)
        if (householdIds.length === 0) {
          setIndustryBreakdown([])
          return
        }

        const { data, error } = await supabaseMetrics
          .from('residents')
          .select('industry')
          .in('household_id', householdIds)
          .limit(500)

        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const industryMap = new Map<string, number>()

        rows.forEach((row) => {
          const industry = row.industry ?? 'Unknown'
          industryMap.set(industry, (industryMap.get(industry) ?? 0) + 1)
        })

        const breakdown = Array.from(industryMap.entries())
          .map(([industry, count]) => ({ industry, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)

        setIndustryBreakdown(breakdown)
      } catch (err) {
        if (!mounted) return
        setIndustryBreakdown([])
      } finally {
        if (mounted) setLoadingIndustryBreakdown(false)
      }
    }

    fetchIndustryBreakdown()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId])

  useEffect(() => {
    let mounted = true

    const fetchEmployerBreakdown = async () => {
      if (!selectedPropertyId) return
      setLoadingEmployerBreakdown(true)
      try {
        const { data: householdsData, error: householdsError } = await supabaseMetrics
          .from('households')
          .select('household_id')
          .eq('property_id', selectedPropertyId)
          .limit(500)

        if (householdsError) throw householdsError
        if (!mounted) return

        const householdIds = (householdsData ?? []).map((h) => h.household_id)
        if (householdIds.length === 0) {
          setEmployerBreakdown([])
          return
        }

        const { data, error } = await supabaseMetrics
          .from('residents')
          .select('employer')
          .in('household_id', householdIds)
          .limit(500)
          .limit(500)

        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const employerMap = new Map<string, number>()

        rows.forEach((row) => {
          const employer = row.employer ?? 'Unknown'
          employerMap.set(employer, (employerMap.get(employer) ?? 0) + 1)
        })

        const breakdown = Array.from(employerMap.entries())
          .map(([employer, count]) => ({ employer, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        setEmployerBreakdown(breakdown)
      } catch (err) {
        if (!mounted) return
        setEmployerBreakdown([])
      } finally {
        if (mounted) setLoadingEmployerBreakdown(false)
      }
    }

    fetchEmployerBreakdown()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId])

  useEffect(() => {
    let mounted = true

    const fetchIncomeStabilityMatrix = async () => {
      if (!selectedPropertyId) return
      setLoadingIncomeStabilityMatrix(true)
      try {
        const { data: householdsData, error: householdsError } = await supabaseMetrics
          .from('households')
          .select('household_id, income_annual_usd')
          .eq('property_id', selectedPropertyId)
          .limit(500)

        if (householdsError) throw householdsError
        if (!mounted) return

        const householdIds = (householdsData ?? []).map((h) => h.household_id)
        if (householdIds.length === 0) {
          setIncomeStabilityMatrix([])
          return
        }

        const { data, error } = await supabaseMetrics
          .from('residents')
          .select('household_id, industry')
          .in('household_id', householdIds)
          .limit(500)

        if (error) throw error
        if (!mounted) return

        const rows = data ?? []
        const incomeByHousehold = new Map(
          (householdsData ?? []).map((h) => [h.household_id, Number(h.income_annual_usd ?? 0)])
        )

        const industryMap = new Map<string, { incomes: number[]; households: Set<string> }>()

        rows.forEach((row) => {
          const industry = row.industry ?? 'Unknown'
          const income = incomeByHousehold.get(row.household_id) ?? 0
          if (!industryMap.has(industry)) industryMap.set(industry, { incomes: [], households: new Set() })
          const group = industryMap.get(industry)!
          if (income > 0) group.incomes.push(income)
          group.households.add(row.household_id)
        })

        const matrix = Array.from(industryMap.entries())
          .map(([industry, group]) => ({
            industry,
            avg_income: group.incomes.length
              ? group.incomes.reduce((sum, val) => sum + val, 0) / group.incomes.length
              : 0,
            household_count: group.households.size,
          }))
          .filter((item) => item.avg_income > 0 && item.household_count > 0)
          .sort((a, b) => b.household_count - a.household_count)

        setIncomeStabilityMatrix(matrix)
      } catch (err) {
        if (!mounted) return
        setIncomeStabilityMatrix([])
      } finally {
        if (mounted) setLoadingIncomeStabilityMatrix(false)
      }
    }

    fetchIncomeStabilityMatrix()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId])

  useEffect(() => {
    let mounted = true

    const fetchRentSeries = async () => {
      if (!selectedPropertyId) return
      setLoadingRentSeries(true)
      try {
        let query = supabaseMetrics
          .from('rent_snapshots')
          .select('snapshot_date, avg_asking_rent, avg_effective_rent, concessions_per_unit')
          .eq('property_id', selectedPropertyId)
          .order('snapshot_date', { ascending: true })

        if (startDate) {
          query = query.gte('snapshot_date', startDate)
        }
        if (endDate) {
          query = query.lte('snapshot_date', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const series = (data ?? []).map((row) => ({
          date: row.snapshot_date,
          asking_rent: Number(row.avg_asking_rent ?? 0),
          effective_rent: Number(row.avg_effective_rent ?? 0),
          concessions: Number(row.concessions_per_unit ?? 0),
        }))

        setRentSeries(series)
      } catch (err) {
        if (!mounted) return
        setRentSeries([])
      } finally {
        if (mounted) setLoadingRentSeries(false)
      }
    }

    fetchRentSeries()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  useEffect(() => {
    let mounted = true

    const fetchOccupancySeries = async () => {
      if (!selectedPropertyId) return
      setLoadingOccupancySeries(true)
      try {
        let query = supabaseMetrics
          .from('occupancy_snapshots')
          .select('snapshot_date, occupied_units, vacant_units, leased_units')
          .eq('property_id', selectedPropertyId)
          .order('snapshot_date', { ascending: true })

        if (startDate) {
          query = query.gte('snapshot_date', startDate)
        }
        if (endDate) {
          query = query.lte('snapshot_date', endDate)
        }

        const { data, error } = await query
        if (error) throw error
        if (!mounted) return

        const series = (data ?? []).map((row) => ({
          date: row.snapshot_date,
          occupied_units: Number(row.occupied_units ?? 0),
          vacant_units: Number(row.vacant_units ?? 0),
          leased_units: Number(row.leased_units ?? 0),
        }))

        setOccupancySeries(series)
      } catch (err) {
        if (!mounted) return
        setOccupancySeries([])
      } finally {
        if (mounted) setLoadingOccupancySeries(false)
      }
    }

    fetchOccupancySeries()

    return () => {
      mounted = false
    }
  }, [selectedPropertyId, startDate, endDate])

  const currentOccupancyPieData = useMemo(() => {
    if (occupancySeries.length === 0) return []
    const latest = occupancySeries[occupancySeries.length - 1]
    const total =
      latest.occupied_units + latest.vacant_units + latest.leased_units
    if (total === 0) return []
    return [
      {
        name: 'Occupied',
        value: latest.occupied_units,
        color: theme.colors.green[6],
      },
      {
        name: 'Vacant',
        value: latest.vacant_units,
        color: theme.colors.gray[5],
      },
      {
        name: 'Leased',
        value: latest.leased_units,
        color: theme.colors.blue[6],
      },
    ].filter((d) => d.value > 0)
  }, [occupancySeries, theme.colors])

  type InsightItem = { area: string; title: string; metric?: string; nextSteps: string }

  const ownershipInsightItems = useMemo((): InsightItem[] => {
    const items: InsightItem[] = []

    if (timelineSegments.length > 0) {
      const sorted = [...timelineSegments].sort((a, b) =>
        a.start_date.localeCompare(b.start_date)
      )
      const periodCount = sorted.length
      const current = sorted[sorted.length - 1]
      if (periodCount >= 2) {
        items.push({
          area: 'ownership',
          title: 'Ownership',
          metric: `${periodCount} periods • ${current?.owner_group} / ${current?.management_company}`,
          nextSteps:
            'Use transition history as context for NOI and capex. Document handover gaps (vendor contracts, backlogs) and align reporting with current owner/manager.',
        })
      } else {
        items.push({
          area: 'ownership',
          title: 'Ownership',
          metric: 'Single period',
          nextSteps:
            'Lock in key metrics (occupancy, rent, condition, work orders) now so future ownership or management changes can be measured against this period.',
        })
      }
    }

    if (capitalProjects.length > 0) {
      const totalBudget = capitalProjects.reduce(
        (sum, p) => sum + Number(p.budget_usd ?? 0),
        0
      )
      const withVariance = capitalProjects.filter(
        (p) => p.actual_usd != null && p.budget_usd != null
      )
      const overBudget = withVariance.filter(
        (p) => Number(p.actual_usd) > Number(p.budget_usd)
      ).length
      items.push({
        area: 'capital',
        title: 'Capital',
        metric: `${capitalProjects.length} project(s) • $${Math.round(totalBudget).toLocaleString()} budget${overBudget > 0 && withVariance.length > 0 ? ` • ${overBudget} over budget` : ''}`,
        nextSteps:
          overBudget > 0 && withVariance.length > 0
            ? 'Review actual vs budget on over-run projects; tighten scope or contingency on upcoming work.'
            : 'Track completion dates and punch lists; plan resident communication for disruption; update condition scoring after completion.',
      })
    }

    if (conditionScore !== '—' && conditionScore !== 'Loading…') {
      const firstScore = conditionSeries[0]?.score ?? 0
      const lastScore =
        conditionSeries.length >= 1
          ? conditionSeries[conditionSeries.length - 1]?.score ?? 0
          : 0
      const trendingDown =
        conditionSeries.length >= 2 && lastScore < firstScore
      const trendingUp =
        conditionSeries.length >= 2 && lastScore > firstScore
      const scoreNum = Number(conditionScore)
      if (trendingDown || (scoreNum > 0 && scoreNum < 6)) {
        items.push({
          area: 'condition',
          title: 'Condition',
          metric: `Score ${conditionScore}${trendingDown ? ' • declining' : ''}`,
          nextSteps:
            'Schedule a walk and prioritize deferred items; tie repairs to work orders and consider a dedicated capex line for condition-driven projects.',
        })
      } else if (trendingUp) {
        items.push({
          area: 'condition',
          title: 'Condition',
          metric: `Score ${conditionScore} • improving`,
          nextSteps:
            "Document what's driving the gain (capex, maintenance, turnover) and standardize it; keep condition in the regular ops review.",
        })
      } else {
        items.push({
          area: 'condition',
          title: 'Condition',
          metric: `Score ${conditionScore}`,
          nextSteps:
            'Maintain inspection and maintenance cadence; use condition as an early signal if work order volume or resident feedback shifts.',
        })
      }
    }

    const openNum =
      openWorkOrderCount !== '—' && openWorkOrderCount !== 'Loading…'
        ? Number(openWorkOrderCount)
        : null
    const completionStr =
      completionTime !== '—' && completionTime !== 'Loading…'
        ? completionTime
        : null
    const emergencyStr =
      overallEmergencyRate !== '—' && overallEmergencyRate !== 'Loading…'
        ? overallEmergencyRate
        : null
    const slaStr =
      slaCompletionRate !== '—' && slaCompletionRate !== 'Loading…'
        ? slaCompletionRate
        : null
    if (openNum !== null || completionStr != null) {
      const actions: string[] = []
      if (openNum != null && openNum > 15) {
        actions.push('Prioritize backlog; consider temp or vendor support')
      }
      if (completionStr != null) {
        actions.push('Review completion time drivers; set a target to reduce cycle time')
      }
      if (emergencyStr != null) {
        const pct = parseInt(emergencyStr, 10)
        if (pct > 15) {
          actions.push('Increase preventative maintenance to reduce reactive calls')
        }
      }
      if (slaStr != null) {
        const pct = parseInt(slaStr, 10)
        if (pct < 80) {
          actions.push('Tighten response time and triage for urgent items')
        }
      }
      items.push({
        area: 'operations',
        title: 'Operations',
        metric: [
          openNum != null ? `${openNum} open` : null,
          completionStr ? completionStr : null,
          emergencyStr ? `${emergencyStr} emergency` : null,
          slaStr ? `${slaStr} SLA` : null,
        ]
          .filter(Boolean)
          .join(' • '),
        nextSteps:
          actions.length > 0
            ? actions.join('. ')
            : 'Keep monitoring open count and completion time; act if either trend worsens.',
      })
    }

    if (
      residentSatisfaction !== '—' &&
      residentSatisfaction !== 'Loading…'
    ) {
      const satNum = Number(residentSatisfaction)
      items.push({
        area: 'resident',
        title: 'Resident satisfaction',
        metric: residentSatisfaction,
        nextSteps:
          satNum < 4
            ? 'Review feedback and work order themes; address recurring issues; consider a pulse survey.'
            : satNum >= 4.5
              ? 'Maintain service levels; use as baseline and track after major changes.'
              : 'Tie satisfaction to work order completion and communication; target small improvements.',
      })
    }

    if (rentSeries.length > 0) {
      const latest = rentSeries[rentSeries.length - 1]
      const asking = latest?.asking_rent ?? 0
      const effective = latest?.effective_rent ?? 0
      const concessions = latest?.concessions ?? 0
      const gap = asking > 0 ? (1 - effective / asking) * 100 : 0
      items.push({
        area: 'rent',
        title: 'Rent',
        metric: `$${Math.round(effective).toLocaleString()} effective${concessions ? ` • $${Math.round(concessions).toLocaleString()}/unit concessions` : ''}`,
        nextSteps:
          concessions > 50 || gap > 5
            ? 'Review lease-up and renewal concessions; model reducing concessions and align marketing and pricing.'
            : 'Monitor concessions on new leases and renewals; use effective rent in NOI and value projections.',
      })
    }

    if (occupancySeries.length > 0) {
      const latest = occupancySeries[occupancySeries.length - 1]
      const occ = latest?.occupied_units ?? 0
      const vac = latest?.vacant_units ?? 0
      const leased = latest?.leased_units ?? 0
      const total = occ + vac + leased
      const pct = total ? Math.round((occ / total) * 100) : 0
      items.push({
        area: 'occupancy',
        title: 'Occupancy',
        metric: `${pct}% • ${occ} occupied, ${vac} vacant, ${leased} leased`,
        nextSteps:
          pct < 90 && total > 0
            ? 'Focus on lease-up (pricing, marketing, turn time); review move-out reasons; set a target to reach 90%+ and track weekly.'
            : vac > 5 && total > 0
              ? 'Prioritize turns and lease-up; align maintenance so units are rent-ready quickly; review pricing vs market.'
              : 'Maintain turn quality and lease-up pace; use occupancy and rent together when evaluating renewals.',
      })
    }

    const hasIncome =
      incomeDistribution.length > 0 &&
      incomeDistribution.some((d) => d.count > 0)
    const topIndustry =
      industryBreakdown.length > 0 ? industryBreakdown[0] : null
    if (hasIncome || topIndustry) {
      const incomePart = hasIncome
        ? (() => {
            const top = incomeDistribution.reduce((a, b) =>
              a.count >= b.count ? a : b
            )
            return top.range
          })()
        : ''
      const industryPart = topIndustry
        ? `${topIndustry.industry} (${topIndustry.count})`
        : ''
      items.push({
        area: 'residents',
        title: 'Resident mix',
        metric: [incomePart, industryPart].filter(Boolean).join(' • '),
        nextSteps:
          'Align communications, amenities, and retention to this profile; use demographics when evaluating new services or rent changes.',
      })
    }

    return items
  }, [
    timelineSegments,
    selectedPropertyName,
    capitalProjects,
    conditionScore,
    conditionSeries,
    openWorkOrderCount,
    completionTime,
    overallEmergencyRate,
    slaCompletionRate,
    residentSatisfaction,
    rentSeries,
    occupancySeries,
    incomeDistribution,
    industryBreakdown,
  ])

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
        <HpySidebar height={`calc(100vh - ${GLOBAL_HEADER_HEIGHT}px)`} />
        <Box style={{ flex: 1, padding: 56, overflowY: 'auto', height: `calc(100vh - ${GLOBAL_HEADER_HEIGHT}px)` }}>
          <Stack gap="xl">
            <Group gap="xl" align="center">
              <HpyAppIcon type="Insights" size={48} radius={8} />
              <Text fw={700} style={{ fontSize: 32, lineHeight: '40px' }}>
                Property Insights
              </Text>
            </Group>
            <Stack gap="lg">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" align="flex-start">
                <Stack gap="lg">
                  <Group align="flex-end" wrap="wrap" gap="md">
                    <Select
                      label="Property"
                      placeholder="Select property"
                      data={propertyOptions}
                      value={selectedPropertyId}
                      onChange={setSelectedPropertyId}
                      searchable
                      disabled={loadingProperties}
                      error={propertyError ?? undefined}
                      styles={{
                        input: {
                          backgroundColor: 'var(--mantine-color-body)',
                          borderColor: 'var(--mantine-color-default-border)',
                        },
                      }}
                      style={{ minWidth: 220 }}
                    />
                    <DateInput
                      label="Start"
                      value={parseDateValue(startDate)}
                      onChange={(value) => setStartDate(formatDateValue(value))}
                      rightSection={<HugeiconsIcon icon={Calendar03Icon} size={16} />}
                      rightSectionPointerEvents="none"
                      styles={{
                        input: {
                          backgroundColor: 'var(--mantine-color-body)',
                          borderColor: 'var(--mantine-color-default-border)',
                        },
                      }}
                      style={{ minWidth: 160 }}
                    />
                    <DateInput
                      label="End"
                      value={parseDateValue(endDate)}
                      onChange={(value) => setEndDate(formatDateValue(value))}
                      rightSection={<HugeiconsIcon icon={Calendar03Icon} size={16} />}
                      rightSectionPointerEvents="none"
                      styles={{
                        input: {
                          backgroundColor: 'var(--mantine-color-body)',
                          borderColor: 'var(--mantine-color-default-border)',
                        },
                      }}
                      style={{ minWidth: 160 }}
                    />
                  </Group>

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {[
                      {
                        label: 'Resident satisfaction',
                        value: loadingResident ? 'Loading…' : residentSatisfaction,
                        helper: loadingResident ? '—' : residentDelta,
                      },
                      {
                        label: 'Condition score',
                        value: loadingCondition ? 'Loading…' : conditionScore,
                        helper: loadingCondition ? '—' : conditionDelta,
                      },
                      {
                        label: 'Work orders open',
                        value: loadingWorkOrders ? 'Loading…' : openWorkOrderCount,
                        helper: loadingWorkOrders ? '—' : openWorkOrderDelta,
                      },
                      {
                        label: 'Avg completion time',
                        value: loadingCompletion ? 'Loading…' : completionTime,
                        helper: loadingCompletion ? '—' : completionDelta,
                      },
                    ].map((metric) => (
                      <Card key={metric.label} withBorder padding="md">
                        <Stack gap={4}>
                          <Text size="sm" c="dimmed">
                            {metric.label}
                          </Text>
                          <Text fw={700} style={{ fontSize: 24, lineHeight: '28px' }}>
                            {metric.value}
                          </Text>
                          {metric.helper && (
                            <Text size="xs" c="dimmed">
                              {metric.helper}
                            </Text>
                          )}
                        </Stack>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Stack>

                <Card withBorder padding="md" style={{ height: '100%' }}>
                  <Group align="stretch" wrap="nowrap" gap="md" style={{ height: '100%' }}>
                    <Box style={{ flex: 1, minHeight: 140 }}>
                      <Image
                        src={capitolHeightsPhoto}
                        alt={selectedPropertyName}
                        radius="md"
                        height="100%"
                        fit="cover"
                      />
                    </Box>
                    <Stack gap="xs" style={{ flex: 1 }}>
                    <Stack gap={4}>
                      <Text fw={700} style={{ fontSize: 20, lineHeight: '26px' }}>
                        {selectedPropertyName}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {selectedStreet || '—'}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {cityStateLine || '—'}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {selectedPostalCode || '—'}
                      </Text>
                    </Stack>
                      <Group gap="xs">
                        {selectedYearBuilt ? (
                          <Badge variant="light" color="purple">
                            Built {selectedYearBuilt}
                          </Badge>
                        ) : (
                          <Badge variant="light" color="gray">
                            Year built —
                          </Badge>
                        )}
                        {selectedUnits !== null ? (
                          <Badge variant="light" color="purple">
                            Units {selectedUnits}
                          </Badge>
                        ) : (
                          <Badge variant="light" color="gray">
                            Units —
                          </Badge>
                        )}
                      </Group>
                    </Stack>
                  </Group>
                </Card>
              </SimpleGrid>

              <Tabs defaultValue="ownership">
                <Tabs.List>
                  <Tabs.Tab value="ownership">Ownership</Tabs.Tab>
                  <Tabs.Tab value="capital-projects">Capital Projects</Tabs.Tab>
                  <Tabs.Tab value="condition">Condition</Tabs.Tab>
                  <Tabs.Tab value="work-orders">Work Orders</Tabs.Tab>
                  <Tabs.Tab value="residents">Residents</Tabs.Tab>
                  <Tabs.Tab value="rent">Rent</Tabs.Tab>
                  <Tabs.Tab value="occupancy">Occupancy</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="ownership" pt={56}>
                  {loadingTimeline && ownershipInsightItems.length === 0 ? (
                    <Stack gap="sm">
                      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Card key={i} withBorder padding="md" style={{ height: 100 }} />
                        ))}
                      </SimpleGrid>
                      <Card withBorder padding="md" style={{ height: 120 }} />
                    </Stack>
                  ) : timelineError && ownershipInsightItems.length === 0 ? (
                    <Card withBorder padding="md">
                      <Text size="sm" c="dimmed">
                        {timelineError}
                      </Text>
                    </Card>
                  ) : (
                    <Stack gap="lg">
                      {ownershipInsightItems.length === 0 &&
                        timelineSegments.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No data to show for that property.
                          </Text>
                        </Card>
                      ) : (
                        <>
                      <Box>
                        <Text size="sm" fw={600} mb="sm" c="dimmed">
                          Key metrics
                        </Text>
                        <SimpleGrid cols={{ base: 2, sm: 4, md: 7 }} spacing="md">
                          {[
                            {
                              label: 'Resident satisfaction',
                              value:
                                loadingResident ? '—' : residentSatisfaction,
                            },
                            {
                              label: 'Condition score',
                              value:
                                loadingCondition ? '—' : conditionScore,
                            },
                            {
                              label: 'Work orders open',
                              value:
                                loadingWorkOrders ? '—' : openWorkOrderCount,
                            },
                            {
                              label: 'Avg completion',
                              value:
                                loadingCompletion ? '—' : completionTime,
                            },
                            {
                              label: 'Occupancy',
                              value:
                                occupancySeries.length > 0
                                  ? (() => {
                                      const l =
                                        occupancySeries[
                                          occupancySeries.length - 1
                                        ]
                                      const t =
                                        (l?.occupied_units ?? 0) +
                                        (l?.vacant_units ?? 0) +
                                        (l?.leased_units ?? 0)
                                      return t
                                        ? `${Math.round(((l?.occupied_units ?? 0) / t) * 100)}%`
                                        : '—'
                                    })()
                                  : '—',
                            },
                            {
                              label: 'Emergency rate',
                              value:
                                loadingOpsHealth ? '—' : overallEmergencyRate,
                            },
                            {
                              label: 'Within SLA',
                              value:
                                loadingOpsHealth ? '—' : slaCompletionRate,
                            },
                          ].map((kpi) => (
                            <Card key={kpi.label} withBorder padding="md">
                              <Stack gap={4}>
                                <Text size="xs" c="dimmed">
                                  {kpi.label}
                                </Text>
                                <Text
                                  fw={700}
                                  style={{ fontSize: 22, lineHeight: '26px' }}
                                >
                                  {kpi.value}
                                </Text>
                              </Stack>
                            </Card>
                          ))}
                        </SimpleGrid>
                      </Box>
                      {ownershipInsightItems.length > 0 && (
                        <Box>
                          <Text size="sm" fw={600} mb="sm" c="dimmed">
                            Insights & next steps
                          </Text>
                          <SimpleGrid
                            cols={{ base: 1, sm: 2, lg: 3 }}
                            spacing="md"
                          >
                            {ownershipInsightItems.map((item) => (
                              <Card
                                key={item.area}
                                withBorder
                                padding="md"
                                style={{ minHeight: 120 }}
                              >
                                <Stack gap="xs">
                                  <Text size="sm" fw={600}>
                                    {item.title}
                                  </Text>
                                  {item.metric && (
                                    <Text size="xs" c="dimmed">
                                      {item.metric}
                                    </Text>
                                  )}
                                  <Text
                                    size="sm"
                                    c="dimmed"
                                    style={{ lineHeight: 1.5 }}
                                  >
                                    {item.nextSteps}
                                  </Text>
                                </Stack>
                              </Card>
                            ))}
                          </SimpleGrid>
                        </Box>
                      )}
                      {timelineSegments.length > 0 && (
                        <>
                          <Text size="sm" fw={600} mb="sm" c="dimmed">
                            Ownership timeline
                          </Text>
                          {(() => {
                        const sorted = [...timelineSegments].sort((a, b) =>
                          a.start_date.localeCompare(b.start_date)
                        )
                        const start = sorted[0]?.start_date ?? ''
                        const end = sorted[sorted.length - 1]?.end_date ?? ''
                        const startTs = start ? new Date(start).getTime() : 0
                        const endTs = end ? new Date(end).getTime() : startTs + 1
                        const span = Math.max(1, endTs - startTs)

                        return (
                          <Card padding="md" radius="md" withBorder>
                            <Stack gap="sm">
                              <Group justify="space-between" align="center" wrap="wrap">
                                <Text fw={600}>{sorted[0]?.property_name ?? selectedPropertyName}</Text>
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
                      })()}
                        </>
                      )}
                        </>
                      )}
                    </Stack>
                  )}
                </Tabs.Panel>
                <Tabs.Panel value="capital-projects" pt={56}>
                  <Stack gap="md">
                    <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                      Capital Projects List
                    </Text>
                    {loadingCapital ? (
                      <Card withBorder padding="md">
                        <Text size="sm" c="dimmed">
                          Loading capital projects…
                        </Text>
                      </Card>
                    ) : capitalError ? (
                      <Card withBorder padding="md">
                        <Text size="sm" c="dimmed">
                          {capitalError}
                        </Text>
                      </Card>
                    ) : capitalProjects.length === 0 ? (
                      <Card withBorder padding="md">
                        <Text size="sm" c="dimmed">
                          No capital projects to show for that range.
                        </Text>
                      </Card>
                    ) : (
                      <Box className="ag-theme-alpine" style={{ height: 600 }}>
                        <AgGridReact
                          {...AG_GRID_DEFAULT_GRID_PROPS}
                          rowData={capitalProjects}
                          columnDefs={capitalColumns}
                          defaultColDef={AG_GRID_DEFAULT_COL_DEF}
                          overlayNoRowsTemplate="No capital projects found."
                        />
                      </Box>
                    )}
                  </Stack>
                </Tabs.Panel>
                <Tabs.Panel value="condition" pt={56}>
                  <Stack gap="md">
                    <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                      Property Condition Score Over Time
                    </Text>
                    {loadingConditionSeries ? (
                      <Card withBorder padding="md">
                        <Text size="sm" c="dimmed">
                          Loading condition data…
                        </Text>
                      </Card>
                    ) : conditionSeries.length === 0 ? (
                      <Card withBorder padding="md">
                        <Text size="sm" c="dimmed">
                          No condition scores to show for that range.
                        </Text>
                      </Card>
                    ) : (
                      <Card withBorder padding="md">
                        <LineChart
                          h={320}
                          data={conditionSeries}
                          dataKey="date"
                          series={[{ name: 'score', color: theme.colors.purple[6] }]}
                          withLegend
                          tickLine="none"
                          gridAxis="y"
                          strokeDasharray="4 4"
                        />
                      </Card>
                    )}
                  </Stack>
                </Tabs.Panel>
                <Tabs.Panel value="work-orders" pt={56}>
                  <Stack gap="lg">
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                      <Card withBorder padding="md">
                        <Stack gap={4}>
                          <Text size="sm" c="dimmed">
                            Open work orders
                          </Text>
                          <Text fw={700} style={{ fontSize: 24, lineHeight: '28px' }}>
                            {loadingOpsHealth ? 'Loading…' : openWorkOrderCount}
                          </Text>
                        </Stack>
                      </Card>
                      <Card withBorder padding="md">
                        <Stack gap={4}>
                          <Text size="sm" c="dimmed">
                            Avg completion time
                          </Text>
                          <Text fw={700} style={{ fontSize: 24, lineHeight: '28px' }}>
                            {loadingOpsHealth ? 'Loading…' : completionTime}
                          </Text>
                        </Stack>
                      </Card>
                      <Card withBorder padding="md">
                        <Stack gap={4}>
                          <Text size="sm" c="dimmed">
                            Emergency rate
                          </Text>
                          <Text fw={700} style={{ fontSize: 24, lineHeight: '28px' }}>
                            {loadingOpsHealth ? 'Loading…' : overallEmergencyRate}
                          </Text>
                        </Stack>
                      </Card>
                      <Card withBorder padding="md">
                        <Stack gap={4}>
                          <Text size="sm" c="dimmed">
                            % within SLA
                          </Text>
                          <Text fw={700} style={{ fontSize: 24, lineHeight: '28px' }}>
                            {loadingOpsHealth ? 'Loading…' : slaCompletionRate}
                          </Text>
                        </Stack>
                      </Card>
                    </SimpleGrid>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Volume & Demand
                      </Text>
                      {loadingWorkOrderVolume ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading work order data…
                          </Text>
                        </Card>
                      ) : workOrderVolumeSeries.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No work orders to show for that range.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <LineChart
                            h={320}
                            data={workOrderVolumeSeries}
                            dataKey="month"
                            series={[{ name: 'count', label: 'Work Orders', color: theme.colors.purple[6] }]}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Resolution Speed
                      </Text>
                      {loadingResolutionSpeed ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading resolution data…
                          </Text>
                        </Card>
                      ) : resolutionSpeedSeries.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No completed work orders to show for that range.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <LineChart
                            h={320}
                            data={resolutionSpeedSeries}
                            dataKey="month"
                            series={[
                              { name: 'median_days', label: 'Median days', color: theme.colors.blue[6] },
                            ]}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Open vs Completed Mix
                      </Text>
                      {loadingStatusMix ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading status data…
                          </Text>
                        </Card>
                      ) : statusMixSeries.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No work orders to show for that range.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <BarChart
                            h={320}
                            data={statusMixSeries}
                            dataKey="month"
                            type="stacked"
                            series={statusMixKeys.map((status) => {
                              const normalized = status.toLowerCase()
                              let color = theme.colors.gray[5]
                              if (normalized.includes('complete')) color = theme.colors.green[6]
                              else if (normalized.includes('open')) color = theme.colors.purple[6]
                              else if (normalized.includes('hold')) color = theme.colors.yellow[6]
                              else if (normalized.includes('cancel')) color = theme.colors.gray[5]
                              return { name: status, label: status, color }
                            })}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Emergency Rate
                      </Text>
                      {loadingEmergencyRate ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading emergency data…
                          </Text>
                        </Card>
                      ) : emergencyRateSeries.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No work orders to show for that range.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <LineChart
                            h={320}
                            data={emergencyRateSeries}
                            dataKey="month"
                            series={[{ name: 'emergency_rate', label: 'Emergency rate (%)', color: theme.colors.red[6] }]}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Preventative vs Reactive Mix
                      </Text>
                      {loadingPreventativeReactive ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading category data…
                          </Text>
                        </Card>
                      ) : preventativeReactiveSeries.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No work orders to show for that range.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <AreaChart
                            h={320}
                            data={preventativeReactiveSeries}
                            dataKey="month"
                            type="stacked"
                            series={[
                              { name: 'Preventative', color: theme.colors.green[6] },
                              { name: 'Reactive', color: theme.colors.orange[6] },
                            ]}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="md">
                      <Group justify="space-between" align="center" wrap="wrap">
                        <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                          Category Breakdown
                        </Text>
                        <SegmentedControl
                          value={categoryMetric}
                          onChange={(value) => setCategoryMetric(value as 'count' | 'cost' | 'labor')}
                          data={[
                            { label: 'Count', value: 'count' },
                            { label: 'Material Cost', value: 'cost' },
                            { label: 'Labor (hrs)', value: 'labor' },
                          ]}
                        />
                      </Group>
                      {loadingCategoryBreakdown ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading category data…
                          </Text>
                        </Card>
                      ) : topCategories.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No work orders to show for that range.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <BarChart
                            h={320}
                            data={topCategories}
                            dataKey="category"
                            orientation="horizontal"
                            series={[
                              {
                                name: categoryMetric,
                                label: categoryMetric === 'count' ? 'Count' : categoryMetric === 'cost' ? 'Material Cost ($)' : 'Labor (hrs)',
                                color: categoryMetric === 'labor' ? theme.colors.blue[6] : categoryMetric === 'cost' ? theme.colors.green[6] : theme.colors.purple[6],
                              },
                            ]}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                            valueFormatter={(value) =>
                              categoryMetric === 'cost' ? `$${Number(value).toLocaleString()}` : String(value)
                            }
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Repeat Issues
                      </Text>
                      {loadingRepeatIssue ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading repeat issue data…
                          </Text>
                        </Card>
                      ) : repeatIssueSeries.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No work orders to show for that range.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <LineChart
                            h={320}
                            data={repeatIssueSeries}
                            dataKey="month"
                            series={[{ name: 'repeat_rate', label: 'Repeat rate (%)', color: theme.colors.orange[6] }]}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Resident Experience Correlation
                      </Text>
                      {loadingResidentCorrelation ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading correlation data…
                          </Text>
                        </Card>
                      ) : residentCorrelationSeries.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No data to show for that range.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <ResponsiveContainer width="100%" height={320}>
                            <ComposedChart data={residentCorrelationSeries}>
                              <CartesianGrid strokeDasharray="4 4" stroke="var(--mantine-color-default-border)" vertical={false} />
                              <XAxis
                                dataKey="month"
                                stroke="transparent"
                                tick={{ fill: 'var(--mantine-color-dimmed)', fontSize: 11 }}
                                tickLine={false}
                              />
                              <YAxis
                                yAxisId="left"
                                stroke="transparent"
                                tick={{ fill: 'var(--mantine-color-dimmed)', fontSize: 11 }}
                                tickLine={false}
                                label={{ value: 'Days to Complete', angle: -90, position: 'insideLeft', fill: 'var(--mantine-color-dimmed)', fontSize: 11, offset: 10 }}
                              />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="transparent"
                                tick={{ fill: 'var(--mantine-color-dimmed)', fontSize: 11 }}
                                tickLine={false}
                                label={{ value: 'Resident Rating', angle: 90, position: 'insideRight', fill: 'var(--mantine-color-dimmed)', fontSize: 11, offset: 10 }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'var(--mantine-color-body)',
                                  borderColor: 'var(--mantine-color-default-border)',
                                  fontSize: 11,
                                  color: 'var(--mantine-color-text)',
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--mantine-color-text)' }} verticalAlign="top" height={36} />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="completion_days"
                                name="Completion days"
                                stroke={theme.colors.purple[6]}
                                strokeWidth={2}
                                dot={{ fill: theme.colors.purple[6], r: 3 }}
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="rating"
                                name="Resident rating"
                                stroke={theme.colors.indigo[6]}
                                strokeWidth={2}
                                dot={{ fill: theme.colors.indigo[6], r: 3 }}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </Card>
                      )}
                    </Stack>
                  </SimpleGrid>
                  </Stack>
                </Tabs.Panel>
                <Tabs.Panel value="residents" pt={56}>
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Household Income Distribution
                      </Text>
                      {loadingIncomeDistribution ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading resident data…
                          </Text>
                        </Card>
                      ) : incomeDistribution.length === 0 || incomeDistribution.every((item) => item.count === 0) ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No resident income data to show.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <BarChart
                            h={320}
                            data={incomeDistribution}
                            dataKey="range"
                            series={[{ name: 'count', label: 'Households', color: theme.colors.purple[6] }]}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                            xAxisProps={{ interval: 0 }}
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Top Industries
                      </Text>
                      {loadingIndustryBreakdown ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading industry data…
                          </Text>
                        </Card>
                      ) : industryBreakdown.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No resident industry data to show.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <BarChart
                            h={320}
                            data={industryBreakdown}
                            dataKey="industry"
                            orientation="horizontal"
                            series={[{ name: 'count', label: 'Residents', color: theme.colors.purple[6] }]}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                            yAxisProps={{ interval: 0 }}
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Top Employers Concentration
                      </Text>
                      {loadingEmployerBreakdown ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading employer data…
                          </Text>
                        </Card>
                      ) : employerBreakdown.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No resident employer data to show.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <BarChart
                            h={320}
                            data={employerBreakdown}
                            dataKey="employer"
                            orientation="horizontal"
                            series={[{ name: 'count', label: 'Residents', color: theme.colors.purple[6] }]}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                            yAxisProps={{ interval: 0 }}
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Income vs Employment Stability Matrix
                      </Text>
                      {loadingIncomeStabilityMatrix ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading matrix data…
                          </Text>
                        </Card>
                      ) : incomeStabilityMatrix.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No resident data to show.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <ResponsiveContainer width="100%" height={320}>
                            <ScatterChart>
                              <CartesianGrid strokeDasharray="4 4" stroke="var(--mantine-color-default-border)" />
                              <XAxis
                                type="number"
                                dataKey="avg_income"
                                name="Avg Income"
                                stroke="transparent"
                                tick={{ fill: 'var(--mantine-color-dimmed)', fontSize: 11 }}
                                tickLine={false}
                                tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`}
                                interval={0}
                              />
                              <YAxis
                                type="number"
                                dataKey="household_count"
                                name="Households"
                                stroke="transparent"
                                tick={{ fill: 'var(--mantine-color-dimmed)', fontSize: 11 }}
                                tickLine={false}
                              />
                              <ZAxis type="number" dataKey="household_count" range={[50, 400]} />
                              <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{
                                  backgroundColor: 'var(--mantine-color-body)',
                                  borderColor: 'var(--mantine-color-default-border)',
                                  color: 'var(--mantine-color-text)',
                                  fontSize: 12,
                                  padding: '8px 12px',
                                }}
                                content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null
                                  const point = payload[0]?.payload as
                                    | { industry: string; avg_income: number; household_count: number }
                                    | undefined
                                  if (!point) return null
                                  return (
                                    <Box
                                      style={{
                                        backgroundColor: 'var(--mantine-color-body)',
                                        border: '1px solid var(--mantine-color-default-border)',
                                        borderRadius: 4,
                                        padding: '8px 12px',
                                        fontSize: 12,
                                        color: 'var(--mantine-color-text)',
                                      }}
                                    >
                                      <Stack gap={4}>
                                        {point.industry && (
                                          <Text size="sm" fw={600}>
                                            {point.industry}
                                          </Text>
                                        )}
                                        <Text size="sm">
                                          Avg income: ${Math.round(point.avg_income).toLocaleString()}
                                        </Text>
                                        <Text size="sm">
                                          Households: {point.household_count}
                                        </Text>
                                      </Stack>
                                    </Box>
                                  )
                                }}
                              />
                              <Scatter
                                data={incomeStabilityMatrix}
                                fill={theme.colors.purple[6]}
                                fillOpacity={0.6}
                              />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </Card>
                      )}
                    </Stack>
                  </SimpleGrid>
                </Tabs.Panel>
                <Tabs.Panel value="rent" pt={56}>
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Effective Rent vs Asking Rent
                      </Text>
                      {loadingRentSeries ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading rent data…
                          </Text>
                        </Card>
                      ) : rentSeries.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No rent data to show for that range.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <LineChart
                            h={320}
                            data={rentSeries}
                            dataKey="date"
                            series={[
                              { name: 'asking_rent', label: 'Asking rent', color: theme.colors.green[6] },
                              { name: 'effective_rent', label: 'Effective rent', color: theme.colors.blue[6] },
                              { name: 'concessions', label: 'Concessions', color: theme.colors.orange[3] },
                            ]}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                            valueFormatter={(value) => `$${Number(value).toLocaleString()}`}
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Concessions per Unit Over Time
                      </Text>
                      {loadingRentSeries ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading rent data…
                          </Text>
                        </Card>
                      ) : rentSeries.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No rent data to show for that range.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <LineChart
                            h={320}
                            data={rentSeries}
                            dataKey="date"
                            series={[
                              {
                                name: 'concessions',
                                label: 'Concessions per unit',
                                color: theme.colors.orange[6],
                              },
                            ]}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                            valueFormatter={(value) => `$${Number(value).toLocaleString()}`}
                          />
                        </Card>
                      )}
                    </Stack>
                  </SimpleGrid>
                </Tabs.Panel>
                <Tabs.Panel value="occupancy" pt={56}>
                  <SimpleGrid cols={2} spacing="lg">
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Occupancy Over Time
                      </Text>
                      {loadingOccupancySeries ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading occupancy data…
                          </Text>
                        </Card>
                      ) : occupancySeries.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No occupancy data to show for that range.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <LineChart
                            h={320}
                            data={occupancySeries}
                            dataKey="date"
                            series={[
                              {
                                name: 'occupied_units',
                                label: 'Occupied units',
                                color: theme.colors.green[6],
                              },
                              {
                                name: 'vacant_units',
                                label: 'Vacant units',
                                color: theme.colors.gray[5],
                              },
                              {
                                name: 'leased_units',
                                label: 'Leased units',
                                color: theme.colors.blue[6],
                              },
                            ]}
                            withLegend
                            tickLine="none"
                            gridAxis="y"
                            strokeDasharray="4 4"
                          />
                        </Card>
                      )}
                    </Stack>
                    <Stack gap="md">
                      <Text fw={600} style={{ fontSize: 20, lineHeight: '26px' }}>
                        Current Occupancy Rate
                      </Text>
                      {loadingOccupancySeries ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            Loading occupancy data…
                          </Text>
                        </Card>
                      ) : currentOccupancyPieData.length === 0 ? (
                        <Card withBorder padding="md">
                          <Text size="sm" c="dimmed">
                            No occupancy data to show.
                          </Text>
                        </Card>
                      ) : (
                        <Card withBorder padding="md">
                          <Stack gap="md" align="center">
                            <Box style={{ display: 'flex', justifyContent: 'center' }}>
                              <PieChart
                                data={currentOccupancyPieData}
                                withTooltip
                                tooltipDataSource="segment"
                                valueFormatter={(value) => `${value} units`}
                                withLabelsLine
                                withLabels
                                labelsType="percent"
                                size={280}
                              />
                            </Box>
                            <Group gap="lg" justify="center">
                              {currentOccupancyPieData.map((segment) => (
                                <Group key={segment.name} gap="xs">
                                  <Box
                                    style={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: 2,
                                      backgroundColor: segment.color,
                                    }}
                                  />
                                  <Text size="sm">
                                    {segment.name} ({segment.value})
                                  </Text>
                                </Group>
                              ))}
                            </Group>
                          </Stack>
                        </Card>
                      )}
                    </Stack>
                  </SimpleGrid>
                </Tabs.Panel>
              </Tabs>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </>
  )
}
