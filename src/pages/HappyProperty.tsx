import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ColDef, GridApi, ModuleRegistry, RowClickedEvent } from 'ag-grid-community'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { supabase } from '../lib/supabase'
import { InlineEditorDrawer } from '../theme/components/HpyDrawer'
import { StatusBadge, StatusBadgeSelect, STATUS_BADGE_KEYS, type StatusBadgeStatus } from '../theme/components/StatusBadge'
import { JoyAiSummary } from '../theme/components/JoyAiSummary'
import { CategoryIcon } from '../theme/components/CategoryIcon'
import {
  ArrowDown01Icon,
  CircleIcon,
  LinkSquare01Icon,
  PlugSocketIcon,
} from '@hugeicons-pro/core-stroke-rounded'
import { HugeiconsIcon } from '@hugeicons/react'
import { getCategoryIconSrc } from '../theme/components/categoryIcons'
import { AG_GRID_DEFAULT_COL_DEF, AG_GRID_DEFAULT_GRID_PROPS } from '../lib/agGridDefaults'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([AllCommunityModule])

type WorkOrder = Record<string, any>

const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)

const formatMonthDay = (date: Date) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)

const formatMonthDayYear = (date: Date) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)

const formatWeekdayTime = (date: Date) =>
  `${new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date)} at ${formatTime(date)}`

const formatAbsoluteDateTime = (date: Date) => `${formatMonthDayYear(date)} at ${formatTime(date)}`

const getStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const toDateInputValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return ''
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const resolveFieldForLabel = (label: string, keys: string[]) => {
  const normalize = (value: string) => value.toLowerCase().replace(/[\s_]/g, '')
  const normalizedLabel = normalize(label)
  if (label === 'Category') {
    const categoryIdKey = keys.find((key) => normalize(key) === 'categoryid')
    if (categoryIdKey) return categoryIdKey
  }
  if (label === 'Asset Name') {
    const subcategoryIdKey = keys.find((key) => normalize(key) === 'subcategoryid')
    if (subcategoryIdKey) return subcategoryIdKey
  }
  const exactMatch = keys.find((key) => normalize(key) === normalizedLabel)
  if (exactMatch) return exactMatch

  const candidates = keys.filter((key) => {
    const normalizedKey = normalize(key)
    return normalizedKey.includes(normalizedLabel) || normalizedLabel.includes(normalizedKey)
  })

  if (candidates.length === 0) return null
  return candidates.sort((a, b) => normalize(a).length - normalize(b).length)[0]
}

const getWorkOrderTitle = (row: WorkOrder | null) => {
  if (!row) return 'Work Order'
  const keys = Object.keys(row)
  const categoryKey = resolveFieldForLabel('Category', keys)
  const subcategoryKey = resolveFieldForLabel('Subcategory', keys)
  const assetNameKey = resolveFieldForLabel('Asset Name', keys)

  const parts = [
    categoryKey ? row[categoryKey] : null,
    subcategoryKey ? row[subcategoryKey] : null,
    assetNameKey ? row[assetNameKey] : null,
  ].filter((value) => value !== null && value !== undefined && String(value).trim().length > 0)

  return parts.join(' • ') || 'Work Order'
}

const toStatusKey = (value: unknown): StatusBadgeStatus | null => {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim().toUpperCase().replace(/[\s-]+/g, '_')
  const aliases: Record<string, StatusBadgeStatus> = {
    CANCELLED: 'CANCELED',
  }
  const resolved = aliases[normalized] ?? normalized
  if (STATUS_BADGE_KEYS.includes(resolved as StatusBadgeStatus)) {
    return resolved as StatusBadgeStatus
  }

  console.warn('[HappyProperty] Unknown status value; falling back to null', {
    raw: value,
    normalized,
    resolved,
  })
  return null
}

const resolveBadgeStatus = (value: unknown, fallback: StatusBadgeStatus) => {
  const normalized = toStatusKey(value)
  if (normalized) return normalized
  if (value === null || value === undefined) return fallback
  const label = String(value).trim()
  if (!label) return fallback
  return {
    statusKey: label.toUpperCase().replace(/[\s-]+/g, '_'),
    label,
    icon: CircleIcon,
    tone: 'neutral' as const,
  }
}

const buildLookup = (rows: WorkOrder[], idHints: string[], nameHints: string[]) => {
  if (!rows.length) return {}
  const keys = Object.keys(rows[0] ?? {})
  const normalize = (value: string) => value.toLowerCase().replace(/[\s_]/g, '')
  const findKey = (hints: string[]) =>
    keys.find((key) => hints.some((hint) => normalize(key).includes(normalize(hint))))

  const idKey = findKey(idHints)
  const nameKey = findKey(nameHints)
  if (!idKey || !nameKey) return {}

  return rows.reduce<Record<string, string>>((acc, row) => {
    const idValue = row?.[idKey]
    const nameValue = row?.[nameKey]
    if (idValue !== null && idValue !== undefined && nameValue !== null && nameValue !== undefined) {
      acc[String(idValue)] = String(nameValue)
    }
    return acc
  }, {})
}

const buildResidentLookup = (rows: WorkOrder[]) => {
  if (!rows.length) return {}
  const keys = Object.keys(rows[0] ?? {})
  const normalize = (value: string) => value.toLowerCase().replace(/[\s_]/g, '')
  const findKey = (hints: string[]) =>
    keys.find((key) => hints.some((hint) => normalize(key).includes(normalize(hint))))

  const idKey = findKey(['id', 'resident_id', 'residentid'])
  const nameKey = findKey(['name', 'resident_name', 'residentname'])
  const phoneKey = findKey(['phone', 'phone_number', 'phonenumber'])
  if (!idKey) return {}

  return rows.reduce<Record<string, { name?: string; phone?: string }>>((acc, row) => {
    const idValue = row?.[idKey]
    if (idValue === null || idValue === undefined) return acc
    acc[String(idValue)] = {
      name: nameKey ? String(row?.[nameKey] ?? '') : undefined,
      phone: phoneKey ? String(row?.[phoneKey] ?? '') : undefined,
    }
    return acc
  }, {})
}

const parseDateValue = (value: unknown) => {
  if (value instanceof Date) return value
  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof value === 'string') {
    const timestamp = Date.parse(value)
    if (Number.isNaN(timestamp)) return null
    return new Date(timestamp)
  }
  return null
}

const formatFuzzyDate = (value: unknown) => {
  const date = parseDateValue(value)
  if (!date) return value ?? ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const isFuture = diffMs < 0

  const startOfToday = getStartOfDay(now).getTime()
  const startOfDate = getStartOfDay(date).getTime()
  const dayDiff = Math.round((startOfToday - startOfDate) / MS_PER_DAY)

  if (!isFuture) {
    if (diffMs <= 5000) return 'Just now'
    if (diffMs < MS_PER_HOUR) {
      const minutes = Math.max(1, Math.floor(diffMs / MS_PER_MINUTE))
      return `${minutes} min ago`
    }
    if (dayDiff === 0) {
      const hours = Math.max(1, Math.floor(diffMs / MS_PER_HOUR))
      return `${hours} hr ago`
    }
    if (dayDiff === 1) {
      return `Yesterday at ${formatTime(date)}`
    }
    if (dayDiff < 7) {
      return formatWeekdayTime(date)
    }
    if (date.getFullYear() === now.getFullYear()) {
      return formatMonthDay(date)
    }
    return formatMonthDayYear(date)
  }

  const futureDiffMs = Math.abs(diffMs)
  if (futureDiffMs < MS_PER_DAY && dayDiff === 0) {
    const hours = Math.max(1, Math.ceil(futureDiffMs / MS_PER_HOUR))
    return `in ${hours} hours`
  }
  if (dayDiff === -1) {
    return `Tomorrow at ${formatTime(date)}`
  }
  if (Math.abs(dayDiff) < 7) {
    return formatWeekdayTime(date)
  }
  return formatMonthDayYear(date)
}

export function HappyProperty() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpened, setDrawerOpened] = useState(false)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [selectedRow, setSelectedRow] = useState<WorkOrder | null>(null)
  const [editableValues, setEditableValues] = useState<Record<string, string>>({})
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [timeTrackingEnabled, setTimeTrackingEnabled] = useState(false)
  const [timeTrackingHours, setTimeTrackingHours] = useState('')
  const [timeTrackingMinutes, setTimeTrackingMinutes] = useState('')
  const [inlinePriority, setInlinePriority] = useState<StatusBadgeStatus | null>(null)
  const [inlineStatus, setInlineStatus] = useState<StatusBadgeStatus | null>(null)
  const [categoryNameById, setCategoryNameById] = useState<Record<string, string>>({})
  const [subcategoryNameById, setSubcategoryNameById] = useState<Record<string, string>>({})
  const [residentById, setResidentById] = useState<Record<string, { name?: string; phone?: string }>>({})
  const gridApiRef = useRef<GridApi | null>(null)

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  const fetchWorkOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('work_orders')
        .select('*')
        .limit(500)

      if (supabaseError) {
        throw supabaseError
      }

      if (data) {
        setWorkOrders(data)

        const { data: categoryRows, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .limit(500)
        if (!categoryError && categoryRows) {
          setCategoryNameById(
            buildLookup(categoryRows, ['id', 'category_id', 'categoryid'], ['name', 'category_name', 'categoryname', 'title'])
          )
        } else if (categoryError) {
          console.warn('Failed to load categories', categoryError)
        }

        const { data: subcategoryRows, error: subcategoryError } = await supabase
          .from('subcategories')
          .select('*')
          .limit(500)
        if (!subcategoryError && subcategoryRows) {
          setSubcategoryNameById(
            buildLookup(subcategoryRows, ['id', 'subcategory_id', 'subcategoryid'], ['name', 'subcategory_name', 'subcategoryname', 'title'])
          )
        } else if (subcategoryError) {
          console.warn('Failed to load subcategories', subcategoryError)
        }

        const { data: residentRows, error: residentError } = await supabase
          .from('residents')
          .select('*')
          .limit(500)
        if (!residentError && residentRows) {
          setResidentById(buildResidentLookup(residentRows))
        } else if (residentError) {
          console.warn('Failed to load residents', residentError)
        }

      } else {
        setError('No work_orders table found. Please create a "work_orders" table in Supabase.')
      }
    } catch (err: any) {
      console.error('Error fetching work orders:', err)

      if (err.code === 'PGRST116') {
        setError('Connection issue: The "work_orders" table does not exist in your Supabase database. Please create it first.')
      } else if (err.message?.includes('column') && err.message?.includes('does not exist')) {
        setError(`Connection issue: ${err.message}. Please check the actual column names in your Supabase work_orders table.`)
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Connection issue: Unable to connect to Supabase. Please check your internet connection and Supabase URL in .env.local')
      } else if (err.message?.includes('Invalid API key')) {
        setError('Connection issue: Invalid Supabase API key. Please check your VITE_SUPABASE_ANON_KEY in .env.local')
      } else {
        setError(`Connection issue: ${err.message || 'Unknown error occurred while fetching work orders'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRowClicked = useCallback((event: RowClickedEvent<WorkOrder>) => {
    const nativeEvent = event.event as MouseEvent | undefined
    const target = nativeEvent?.target as HTMLElement | null
    if (target?.closest('input[type="checkbox"]')) {
      return
    }
    if (!event.data) return
    setSelectedRow(event.data)
    setActiveRowId(event.node.id ?? null)
    const nextValues = Object.keys(event.data).reduce<Record<string, string>>((acc, key) => {
      const value = event.data?.[key]
      acc[key] = value === null || value === undefined ? '' : String(value)
      return acc
    }, {})
    setEditableValues(nextValues)
    setDrawerOpened(true)
    setDrawerLoading(true)
  }, [])

  const drawerHeader = useMemo(() => {
    if (!selectedRow) {
      return { title: 'Work Order', subtitle: undefined as string | undefined, eyebrow: undefined as string | undefined }
    }

    const keys = Object.keys(selectedRow)
    const assetNameKey = resolveFieldForLabel('Asset Name', keys)
    const categoryKey = resolveFieldForLabel('Category', keys)
    const locationKey = resolveFieldForLabel('Location', keys)
    const subcategoryKey = resolveFieldForLabel('Subcategory', keys)

    const assetValue = assetNameKey ? selectedRow[assetNameKey] : null
    const categoryValue = categoryKey ? selectedRow[categoryKey] : null
    const subcategoryValue = subcategoryKey ? selectedRow[subcategoryKey] : null

    const assetName =
      assetValue !== null && assetValue !== undefined
        ? subcategoryNameById[String(assetValue)] ?? String(assetValue)
        : undefined
    const categoryName =
      categoryValue !== null && categoryValue !== undefined
        ? categoryNameById[String(categoryValue)] ?? String(categoryValue)
        : undefined
    const subcategoryName =
      subcategoryValue !== null && subcategoryValue !== undefined
        ? subcategoryNameById[String(subcategoryValue)] ?? String(subcategoryValue)
        : undefined

    return {
      title: assetName ?? getWorkOrderTitle(selectedRow),
      subtitle: categoryName,
      eyebrow: locationKey ? String(selectedRow[locationKey]) : subcategoryName,
    }
  }, [selectedRow, categoryNameById, subcategoryNameById])

  const drawerIcon = useMemo(() => {
    if (!selectedRow) return getCategoryIconSrc('general')
    const keys = Object.keys(selectedRow)
    const categoryKey = resolveFieldForLabel('Category', keys)
    const categoryValue = categoryKey ? selectedRow[categoryKey] : null
    const categoryName =
      categoryValue !== null && categoryValue !== undefined
        ? String(categoryNameById[String(categoryValue)] ?? categoryValue)
        : ''
    return getCategoryIconSrc(categoryName)
  }, [selectedRow, categoryNameById])

  useEffect(() => {
    if (!selectedRow) {
      setInlinePriority(null)
      setInlineStatus(null)
      setTimeTrackingEnabled(false)
      setTimeTrackingHours('')
      setTimeTrackingMinutes('')
      return
    }

    const keys = Object.keys(selectedRow)
    const priorityKey = resolveFieldForLabel('Priority', keys)
    const statusKey = resolveFieldForLabel('Status', keys)

    const priorityValue = priorityKey ? selectedRow[priorityKey] : null
    const statusValue = statusKey ? selectedRow[statusKey] : null

    setInlinePriority(priorityValue ? toStatusKey(priorityValue) : null)
    setInlineStatus(statusValue ? toStatusKey(statusValue) : null)
    setTimeTrackingEnabled(false)
    setTimeTrackingHours('')
    setTimeTrackingMinutes('')
  }, [selectedRow])

  useEffect(() => {
    if (!drawerOpened) return
    const timer = window.setTimeout(() => {
      setDrawerLoading(false)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [drawerOpened])

  useEffect(() => {
    const api = gridApiRef.current as GridApi | null
    if (!api) return
    if (typeof (api as any).setGridOption === 'function') {
      ;(api as any).setGridOption('quickFilterText', searchValue)
      return
    }
    if (typeof (api as any).setQuickFilter === 'function') {
      ;(api as any).setQuickFilter(searchValue)
    }
  }, [searchValue])

  const categoryDisplayKey = useMemo(
    () => resolveFieldForLabel('Category', Object.keys(editableValues)),
    [editableValues]
  )
  const subcategoryDisplayKey = useMemo(
    () => resolveFieldForLabel('Subcategory', Object.keys(editableValues)),
    [editableValues]
  )
  const assetNameDisplayKey = useMemo(
    () => resolveFieldForLabel('Asset Name', Object.keys(editableValues)),
    [editableValues]
  )
  const assigneeDisplayKey = useMemo(
    () => resolveFieldForLabel('Assignee', Object.keys(editableValues)),
    [editableValues]
  )
  const scheduledDisplayKey = useMemo(
    () => resolveFieldForLabel('Scheduled', Object.keys(editableValues)),
    [editableValues]
  )
  const descriptionDisplayKey = useMemo(
    () => resolveFieldForLabel('Description', Object.keys(editableValues)),
    [editableValues]
  )
  const residentIdDisplayKey = useMemo(() => {
    const keys = Object.keys(editableValues)
    const candidates = ['Resident Id', 'Resident', 'Resident ID', 'Resident Ids', 'Resident IDs']
    return candidates.map((label) => resolveFieldForLabel(label, keys)).find(Boolean)
  }, [editableValues])
  const relatedProjectsDisplayKey = useMemo(
    () => resolveFieldForLabel('Related Projects', Object.keys(editableValues)),
    [editableValues]
  )
  const pluginNameDisplayKey = useMemo(() => {
    const keys = Object.keys(editableValues)
    const candidates = ['Plugin Name', 'Active Plugin', 'Plugin']
    return candidates.map((label) => resolveFieldForLabel(label, keys)).find(Boolean)
  }, [editableValues])
  const pluginAuthorDisplayKey = useMemo(() => {
    const keys = Object.keys(editableValues)
    const candidates = ['Plugin Author', 'Vendor', 'Provider']
    return candidates.map((label) => resolveFieldForLabel(label, keys)).find(Boolean)
  }, [editableValues])
  const priorityDisplayKey = useMemo(
    () => resolveFieldForLabel('Priority', Object.keys(editableValues)),
    [editableValues]
  )
  const statusDisplayKey = useMemo(
    () => resolveFieldForLabel('Status', Object.keys(editableValues)),
    [editableValues]
  )

  const assigneeOptions = useMemo(() => {
    const values = new Set<string>()
    workOrders.forEach((order) => {
      const keys = Object.keys(order)
      const key = resolveFieldForLabel('Assignee', keys)
      if (!key) return
      const value = order[key]
      if (value === null || value === undefined) return
      const trimmed = String(value).trim()
      if (trimmed.length > 0) values.add(trimmed)
    })
    return Array.from(values)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value }))
  }, [workOrders])

  const residents = useMemo(() => {
    const idsRaw = residentIdDisplayKey ? editableValues[residentIdDisplayKey] : ''
    const ids = idsRaw
      ? String(idsRaw)
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : []

    const mapped = ids
      .map((id) => {
        const resident = residentById[id]
        if (!resident?.name && !resident?.phone) return null
        return {
          id,
          name: resident.name ?? id,
          phone: resident.phone,
        }
      })
      .filter(Boolean) as { id: string; name: string; phone?: string }[]

    return mapped
  }, [editableValues, residentIdDisplayKey, residentById])

  const relatedProjects = useMemo(() => {
    if (!relatedProjectsDisplayKey) return []
    const value = editableValues[relatedProjectsDisplayKey]
    if (!value) return []
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }, [editableValues, relatedProjectsDisplayKey])

  const hasTimeTrackingError = useMemo(() => {
    if (!timeTrackingEnabled) return false
    const hours = Number(timeTrackingHours)
    const minutes = Number(timeTrackingMinutes)
    const hoursValid = !Number.isNaN(hours) && hours > 0
    const minutesValid = !Number.isNaN(minutes) && minutes > 0
    return !hoursValid && !minutesValid
  }, [timeTrackingEnabled, timeTrackingHours, timeTrackingMinutes])

  return (
    <>
      <GlobalHeader variant="product" />
      <Box
        style={{
          paddingTop: GLOBAL_HEADER_HEIGHT,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <HpySidebar height={`calc(100vh - ${GLOBAL_HEADER_HEIGHT}px)`} />
        <Box style={{ flex: 1, padding: 56, display: 'flex', flexDirection: 'column' }}>
          <Stack gap="xl" style={{ flex: 1, minHeight: 0 }}>
            <HpyPageHeader searchValue={searchValue} onSearchChange={setSearchValue} />
            <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>

              {error && (
                <Alert color="red" title="Connection Issue">
                  <Text size="sm">{error}</Text>
                  <Group mt="md">
                    <Text size="sm" c="dimmed">
                      Retry after verifying your Supabase connection and table.
                    </Text>
                  </Group>
                </Alert>
              )}

              {loading && !error && (
                <Stack gap="md">
                  <Skeleton height={48} radius="md" />
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} height={56} radius="md" />
                  ))}
                </Stack>
              )}

              {!loading && !error && workOrders.length === 0 && (
                <Alert color="blue" title="No Data">
                  <Text size="sm">No work orders found in the database. The table exists but is empty.</Text>
                </Alert>
              )}

              {!loading && !error && workOrders.length > 0 && (
                <WorkOrdersGrid
                  workOrders={workOrders}
                  categoryNameById={categoryNameById}
                  subcategoryNameById={subcategoryNameById}
                  onRowClicked={handleRowClicked}
                  activeRowId={activeRowId}
                  onGridReadyApi={(api) => {
                    gridApiRef.current = api
                  }}
                />
              )}
            </Stack>
          </Stack>
        </Box>
      </Box>
      <InlineEditorDrawer
        opened={drawerOpened}
        onClose={() => {
          gridApiRef.current?.deselectAll()
          setDrawerOpened(false)
          setActiveRowId(null)
          setSelectedRow(null)
          setEditableValues({})
        }}
        position="right"
        title={drawerHeader.title}
        subtitle={drawerHeader.subtitle}
        eyebrow={drawerHeader.eyebrow}
        iconNode={<CategoryIcon src={drawerIcon} size={24} />}
        withCloseButton
        preventInitialDrawerFocus
        statusToggles={
          <Group gap="xl">
            <Group gap="xs">
              <Text fw={600} size="sm">
                Priority
              </Text>
              <StatusBadgeSelect
                value={inlinePriority}
                onChange={setInlinePriority}
                options={['NORMAL', 'URGENT']}
              />
            </Group>
            <Group gap="xs">
              <Text fw={600} size="sm">
                Status
              </Text>
              <StatusBadgeSelect
                value={inlineStatus}
                onChange={setInlineStatus}
                options={['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETE']}
              />
            </Group>
          </Group>
        }
        tabs={
          <Tabs defaultValue="details">
            <Tabs.List
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                backgroundColor: 'var(--mantine-color-body)',
              }}
            >
              <Tabs.Tab value="details">Details</Tabs.Tab>
              <Tabs.Tab value="messages">Messages</Tabs.Tab>
              <Tabs.Tab value="files">Files</Tabs.Tab>
              <Tabs.Tab value="activities">Activities</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="details" pt="lg">
              {drawerLoading ? (
        <Stack gap="lg">
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    <Skeleton height={80} radius="md" />
                    <Skeleton height={80} radius="md" />
                  </SimpleGrid>
                  <Skeleton height={120} radius="md" />
                  <Stack gap={6}>
                    <Skeleton height={16} width={140} radius="md" />
                    <Skeleton height={18} radius="md" />
                  </Stack>
                  <Stack gap="xs">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} height={48} radius="md" />
                    ))}
                  </Stack>
                </Stack>
              ) : (
        <Stack gap="lg">
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  <Select
                    label="Assignee"
                    withAsterisk
                    placeholder="Unassigned"
                    data={assigneeOptions}
                    value={assigneeDisplayKey ? editableValues[assigneeDisplayKey] ?? '' : ''}
                    disabled={!assigneeDisplayKey}
                    onChange={(value) => {
                      if (!assigneeDisplayKey) return
                    setEditableValues((prev) => ({
                      ...prev,
                        [assigneeDisplayKey]: value ?? '',
                      }))
                    }}
                  />
                  <TextInput
                    label="Scheduled"
                    withAsterisk
                    type="date"
                    disabled={!scheduledDisplayKey}
                    value={
                      scheduledDisplayKey ? toDateInputValue(editableValues[scheduledDisplayKey]) : ''
                    }
                    onChange={(event) => {
                      if (!scheduledDisplayKey) return
                      setEditableValues((prev) => ({
                        ...prev,
                        [scheduledDisplayKey]: event.currentTarget.value,
                      }))
                    }}
                  />
            </SimpleGrid>
                <Textarea
                  label="Description"
                  minRows={4}
                  autosize
                  disabled={!descriptionDisplayKey}
                  value={descriptionDisplayKey ? editableValues[descriptionDisplayKey] ?? '' : ''}
                  onChange={(event) => {
                    if (!descriptionDisplayKey) return
                    setEditableValues((prev) => ({
                      ...prev,
                      [descriptionDisplayKey]: event.currentTarget.value,
                    }))
                  }}
                />
                <JoyAiSummary summary="Lorem ipsum dolor sit amet, consectetur adipiscing elit." />
                <Accordion
                  variant="default"
                  chevronPosition="right"
                  chevron={<HugeiconsIcon icon={ArrowDown01Icon} size={16} color="var(--mantine-color-text)" />}
                  styles={{
                    item: {
                      borderBottom: '1px solid var(--mantine-color-default-border)',
                    },
                    control: {
                      padding: 0,
                      minHeight: 48,
                    },
                    label: {
                      flex: 1,
                    },
                    panel: {
                      padding: 0,
                    },
                  }}
                >
                  <Accordion.Item value="Residents">
                    <Accordion.Control>
                      <Text size="lg" fw={700}>
                        Residents
                      </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="md">
                        {residents.length > 0 ? (
                          <Stack gap="xs">
                            {residents.map((resident) => (
                              <Group key={resident.id} gap="sm" wrap="nowrap">
                                <Avatar size="sm" radius="xl">
                                  {resident.name
                                    .split(' ')
                                    .map((part) => part[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </Avatar>
                                <Text size="sm" style={{ flex: 1 }}>
                                  {resident.name}
                                </Text>
                                {resident.phone ? (
                                  <Text size="sm" style={{ whiteSpace: 'nowrap' }}>
                                    {resident.phone}
                                  </Text>
                                ) : null}
                              </Group>
                            ))}
                          </Stack>
                        ) : (
                          <Text size="sm" c="dimmed">
                            No residents found.
                          </Text>
                        )}
                        <Stack gap={4}>
                          <Text size="sm" fw={600}>
                            Resident Notifications
                          </Text>
                          <Group justify="space-between" align="center" wrap="nowrap">
                            <Checkbox
                              size="sm"
                              defaultChecked
                              label="Notify via HappyCo"
                              styles={{
                                label: {
                                  fontWeight: 600,
                                  color: 'var(--mantine-color-text)',
                                },
                              }}
                            />
                            <Button variant="light" color="blurple" size="sm">
                              On the Way
                            </Button>
                          </Group>
        </Stack>
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                  <Accordion.Item value="Time Tracking">
                    <Accordion.Control>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="lg" fw={700}>
                          Time Tracking
                        </Text>
                        {hasTimeTrackingError && (
                          <Box
                            w={6}
                            h={6}
                            style={{
                              backgroundColor: 'var(--mantine-color-red-6)',
                              borderRadius: 999,
                            }}
                          />
                        )}
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Group gap="lg" align="center" wrap="nowrap">
                        <Checkbox
                          size="sm"
                          label="Unit was Entered"
                          checked={timeTrackingEnabled}
                          onChange={(event) => setTimeTrackingEnabled(event.currentTarget.checked)}
                          styles={{
                            label: {
                              fontWeight: 600,
                              color: 'var(--mantine-color-text)',
                            },
                          }}
                        />
                        <TextInput
                          label="Hours"
                          type="number"
                          min={0}
                          disabled={!timeTrackingEnabled}
                          value={timeTrackingHours}
                          onChange={(event) => setTimeTrackingHours(event.currentTarget.value)}
                          styles={{ input: { textAlign: 'center' } }}
                        />
                        <TextInput
                          label="Minutes"
                          type="number"
                          min={0}
                          disabled={!timeTrackingEnabled}
                          value={timeTrackingMinutes}
                          onChange={(event) => setTimeTrackingMinutes(event.currentTarget.value)}
                          styles={{ input: { textAlign: 'center' } }}
                        />
                      </Group>
                    </Accordion.Panel>
                  </Accordion.Item>
                  {relatedProjects.length > 0 && (
                    <Accordion.Item value="Related Projects">
                      <Accordion.Control>
                        <Text size="lg" fw={700}>
                          Related Projects
                        </Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap="xs">
                          {relatedProjects.map((project) => (
                            <Group key={project} gap="sm" wrap="nowrap" justify="space-between">
                              <Text size="sm" td="underline" style={{ flex: 1 }}>
                                {project}
                              </Text>
                              <HugeiconsIcon
                                icon={LinkSquare01Icon}
                                size={16}
                                color="var(--mantine-color-text)"
                              />
                            </Group>
                          ))}
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  )}
                  {pluginNameDisplayKey && editableValues[pluginNameDisplayKey] && (
                    <Accordion.Item value="Active Plugins">
                      <Accordion.Control>
                        <Text size="lg" fw={700}>
                          Active Plugins
                        </Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Box
                          style={{
                            border: '1px solid var(--mantine-color-default-border)',
                            borderRadius: 8,
                            padding: 12,
                          }}
                        >
                          <Group gap="sm" align="center" wrap="nowrap">
                            <Box
                              w={24}
                              h={24}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <HugeiconsIcon icon={PlugSocketIcon} size={20} color="var(--mantine-color-text)" />
                            </Box>
                            <Stack gap={2} style={{ flex: 1 }}>
                              <Text size="sm" fw={700}>
                                {editableValues[pluginNameDisplayKey]}
                              </Text>
                              <Group gap={4} align="center">
                                <Text size="sm" c="dimmed">
                                  by
                                </Text>
                                {pluginAuthorDisplayKey && editableValues[pluginAuthorDisplayKey] ? (
                                  <Text size="sm" td="underline">
                                    {editableValues[pluginAuthorDisplayKey]}
                                  </Text>
                                ) : (
                                  <Text size="sm" c="dimmed">
                                    Unknown
                                  </Text>
                                )}
                              </Group>
                            </Stack>
                            <Button variant="subtle" color="blurple" size="sm">
                              See Details
                            </Button>
                          </Group>
                        </Box>
                      </Accordion.Panel>
                    </Accordion.Item>
                  )}
                </Accordion>
              </Stack>
              )}
            </Tabs.Panel>
            <Tabs.Panel value="messages" pt="lg">
              <Text size="sm" c="dimmed">
                No messages yet.
              </Text>
            </Tabs.Panel>
            <Tabs.Panel value="files" pt="lg">
              <Text size="sm" c="dimmed">
                No files uploaded.
              </Text>
            </Tabs.Panel>
            <Tabs.Panel value="activities" pt="lg">
              <Text size="sm" c="dimmed">
                No activity yet.
              </Text>
            </Tabs.Panel>
          </Tabs>
        }
        footer={
          <Group justify="flex-end" gap="md">
            <Button variant="outline" color="gray" onClick={() => setDrawerOpened(false)}>
              Cancel
            </Button>
            <Button variant="filled" color="blurple">
              Save
            </Button>
          </Group>
        }
      />
    </>
  )
}

function WorkOrdersGrid({
  workOrders,
  categoryNameById,
  subcategoryNameById,
  onRowClicked,
  activeRowId,
  onGridReadyApi,
}: {
  workOrders: WorkOrder[]
  categoryNameById: Record<string, string>
  subcategoryNameById: Record<string, string>
  onRowClicked: (event: RowClickedEvent<WorkOrder>) => void
  activeRowId: string | null
  onGridReadyApi: (api: GridApi) => void
}) {
  const [rowCount, setRowCount] = useState(0)
  const [selectedCount, setSelectedCount] = useState(0)
  const desiredColumns = [
    'Work Order',
    'Priority',
    'Status',
    'Location',
    'Assignee',
    'Scheduled',
    'Created',
  ]

  const columnDefs = useMemo<ColDef[]>(() => {
    if (workOrders.length === 0) return []

    const actualKeys = Object.keys(workOrders[0] || {})
    const categoryKey = resolveFieldForLabel('Category', actualKeys)
    const subcategoryKey = resolveFieldForLabel('Subcategory', actualKeys)
    const assetNameKey = resolveFieldForLabel('Asset Name', actualKeys)
    const descriptionKey = resolveFieldForLabel('Description', actualKeys)

    const getWorkOrderDisplay = (row: WorkOrder | undefined) => {
      if (!row) {
        return { title: '', description: '', categoryName: '' }
      }

      const categoryValue = categoryKey ? row[categoryKey] : null
      const subcategoryValue = subcategoryKey ? row[subcategoryKey] : null
      const assetValue = assetNameKey ? row[assetNameKey] : null
      const descriptionValue = descriptionKey ? row[descriptionKey] : null

      const categoryName =
        categoryValue !== null && categoryValue !== undefined
          ? String(categoryNameById[String(categoryValue)] ?? categoryValue)
          : ''
      const subcategoryName =
        subcategoryValue !== null && subcategoryValue !== undefined
          ? String(subcategoryNameById[String(subcategoryValue)] ?? subcategoryValue)
          : ''
      const assetName =
        assetValue !== null && assetValue !== undefined
          ? String(subcategoryNameById[String(assetValue)] ?? assetValue)
          : ''
      const description =
        descriptionValue !== null && descriptionValue !== undefined ? String(descriptionValue) : ''

      const primaryName = assetName || subcategoryName
      const title = [primaryName, categoryName].filter(Boolean).join(' | ')

      return { title, description, categoryName }
    }

    return desiredColumns
      .map((label) => {
        if (label === 'Work Order') {
          return {
            headerName: label,
            width: 450,
            minWidth: 450,
            flex: 1,
            sortable: true,
            filter: true,
            resizable: true,
            valueGetter: (params) => {
              const display = getWorkOrderDisplay(params.data)
              return [display.title, display.description].filter(Boolean).join(' ')
            },
            cellRenderer: (params: { data?: WorkOrder }) => {
              const display = getWorkOrderDisplay(params.data)
              const icon = getCategoryIconSrc(display.categoryName)

              return (
                <Group gap="sm" wrap="nowrap">
                  <Box
                    w={32}
                    h={32}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CategoryIcon src={icon} size={24} />
                  </Box>
                  <Stack gap={0} style={{ minWidth: 0 }}>
                    <Text size="sm" fw={700} lineClamp={1} style={{ whiteSpace: 'nowrap' }}>
                      {display.title || 'Work Order'}
                    </Text>
                    <Text
                      size="sm"
                      lineClamp={1}
                      style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {display.description}
                    </Text>
                  </Stack>
                </Group>
              )
            },
          } as ColDef
        }

        const matchedKey = resolveFieldForLabel(label, actualKeys)
        if (!matchedKey) return null

        if (label === 'Priority' || label === 'Status') {
          const fallback = label === 'Priority' ? 'NORMAL' : 'OPEN'
          return {
            field: matchedKey,
            headerName: label,
            minWidth: 140,
            flex: 1,
            sortable: true,
            filter: true,
            resizable: true,
            cellRenderer: (params: { data?: WorkOrder }) => {
              const rawValue = params.data?.[matchedKey]
              return <StatusBadge status={resolveBadgeStatus(rawValue, fallback)} />
            },
          } as ColDef
        }

        const isDateColumn = ['Scheduled', 'Created'].includes(label)
        return {
          field: matchedKey,
          headerName: label,
          flex: 1,
          minWidth: 140,
          sortable: true,
          filter: true,
          resizable: true,
          valueFormatter: isDateColumn ? (params) => formatFuzzyDate(params.value) : undefined,
          tooltipValueGetter: isDateColumn
            ? (params) => {
                const date = parseDateValue(params.value)
                return date ? formatAbsoluteDateTime(date) : ''
              }
            : undefined,
        } as ColDef
      })
      .filter(Boolean) as ColDef[]
  }, [workOrders, categoryNameById, subcategoryNameById])

  const missingColumns = useMemo(() => {
    if (workOrders.length === 0) return []
    const actualKeys = Object.keys(workOrders[0] || {})
    const missing = desiredColumns.filter((label) => label !== 'Work Order' && !resolveFieldForLabel(label, actualKeys))

    const requiredForWorkOrder = ['Category', 'Subcategory', 'Asset Name']
    const missingWorkOrderParts = requiredForWorkOrder.filter((label) => !resolveFieldForLabel(label, actualKeys))

    return [...missing, ...missingWorkOrderParts.map((label) => `Work Order: ${label}`)]
  }, [workOrders])

  const defaultColDef = useMemo(() => ({ ...AG_GRID_DEFAULT_COL_DEF }), [])

  const updateFooterCounts = useCallback((api: { getDisplayedRowCount: () => number; getSelectedNodes: () => unknown[] }) => {
    setRowCount(api.getDisplayedRowCount())
    setSelectedCount(api.getSelectedNodes().length)
  }, [])

  if (columnDefs.length === 0) {
    return (
      <Alert color="yellow" title="Missing Columns">
        <Text size="sm">
          None of the expected columns were found in the Supabase table. Available columns are:{' '}
          {Object.keys(workOrders[0] || {}).join(', ') || 'none'}
        </Text>
      </Alert>
    )
  }

  return (
    <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      {missingColumns.length > 0 && (
        <Alert color="yellow" title="Missing Columns">
          <Text size="sm">
            The following expected columns were not found: {missingColumns.join(', ')}. Available columns are:{' '}
            {Object.keys(workOrders[0] || {}).join(', ') || 'none'}
          </Text>
        </Alert>
      )}
      <div style={{ height: '100%', width: '100%' }} className="ag-theme-alpine">
        <AgGridReact
          {...AG_GRID_DEFAULT_GRID_PROPS}
          rowData={workOrders}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          popupParent={document.body}
          rowSelection={{ mode: 'multiRow', checkboxes: true, headerCheckbox: true }}
          suppressRowClickSelection={true}
          onRowClicked={onRowClicked}
          getRowClass={(params) => (params.node.id && params.node.id === activeRowId ? 'ag-row-active' : '')}
          onGridReady={(params) => {
            onGridReadyApi(params.api)
            updateFooterCounts(params.api)
          }}
          onSelectionChanged={(params) => updateFooterCounts(params.api)}
          onFilterChanged={(params) => updateFooterCounts(params.api)}
          onModelUpdated={(params) => updateFooterCounts(params.api)}
        />
        <Box className="ag-custom-footer">
          <Text size="sm">
            Rows: <Text span fw={600}>{rowCount}</Text>
          </Text>
          <Text size="sm">
            Selected: <Text span fw={600}>{selectedCount}</Text>
          </Text>
        </Box>
      </div>
    </Box>
  )
}

