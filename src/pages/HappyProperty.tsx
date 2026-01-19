import { Alert, Box, Button, Group, Loader, SimpleGrid, Stack, Text, TextInput, Textarea, Title } from '@mantine/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ColDef, GridApi, ModuleRegistry, RowClickedEvent } from 'ag-grid-community'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { supabase } from '../lib/supabase'
import { InlineEditorDrawer } from '../theme/components/HpyDrawer'
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

const resolveFieldForLabel = (label: string, keys: string[]) => {
  const normalize = (value: string) => value.toLowerCase().replace(/[\s_]/g, '')
  const normalizedLabel = normalize(label)
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
  const [selectedRow, setSelectedRow] = useState<WorkOrder | null>(null)
  const [editableValues, setEditableValues] = useState<Record<string, string>>({})
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
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
        .limit(50)

      if (supabaseError) {
        throw supabaseError
      }

      if (data) {
        setWorkOrders(data)
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
  }, [])

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
            <HpyPageHeader />
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
                <Group justify="center" py="xl">
                  <Loader size="md" />
                  <Text>Loading work orders from Supabase...</Text>
                </Group>
              )}

              {!loading && !error && workOrders.length === 0 && (
                <Alert color="blue" title="No Data">
                  <Text size="sm">No work orders found in the database. The table exists but is empty.</Text>
                </Alert>
              )}

              {!loading && !error && workOrders.length > 0 && (
                <WorkOrdersGrid
                  workOrders={workOrders}
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
        title={getWorkOrderTitle(selectedRow)}
        withCloseButton
        preventInitialDrawerFocus
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
      >
        <Stack gap="lg">
          {Object.keys(editableValues).length > 0 ? (
            <SimpleGrid cols={2} spacing="lg">
              {Object.entries(editableValues).map(([key, value]) => (
                <TextInput
                  key={key}
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  value={value}
                  onChange={(event) =>
                    setEditableValues((prev) => ({
                      ...prev,
                      [key]: event.currentTarget.value,
                    }))
                  }
                />
              ))}
            </SimpleGrid>
          ) : (
            <Textarea label="Details" readOnly minRows={3} />
          )}
        </Stack>
      </InlineEditorDrawer>
    </>
  )
}

function WorkOrdersGrid({
  workOrders,
  onRowClicked,
  activeRowId,
  onGridReadyApi,
}: {
  workOrders: WorkOrder[]
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

    return desiredColumns
      .map((label) => {
        if (label === 'Work Order') {
          return {
            headerName: label,
            minWidth: 200,
            flex: 1,
            sortable: true,
            filter: true,
            resizable: true,
            valueGetter: (params) => {
              const parts = [
                categoryKey ? params.data?.[categoryKey] : null,
                subcategoryKey ? params.data?.[subcategoryKey] : null,
                assetNameKey ? params.data?.[assetNameKey] : null,
              ].filter((value) => value !== null && value !== undefined && String(value).trim().length > 0)

              return parts.join(' • ')
            },
          } as ColDef
        }

        const matchedKey = resolveFieldForLabel(label, actualKeys)
        if (!matchedKey) return null

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
  }, [workOrders])

  const missingColumns = useMemo(() => {
    if (workOrders.length === 0) return []
    const actualKeys = Object.keys(workOrders[0] || {})
    const missing = desiredColumns.filter((label) => label !== 'Work Order' && !resolveFieldForLabel(label, actualKeys))

    const requiredForWorkOrder = ['Category', 'Subcategory', 'Asset Name']
    const missingWorkOrderParts = requiredForWorkOrder.filter((label) => !resolveFieldForLabel(label, actualKeys))

    return [...missing, ...missingWorkOrderParts.map((label) => `Work Order: ${label}`)]
  }, [workOrders])

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 140,
    }),
    []
  )

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
          rowData={workOrders}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme="legacy"
          animateRows={true}
          rowSelection={{ mode: 'multiRow', checkboxes: true, headerCheckbox: true }}
          headerHeight={48}
          rowHeight={60}
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
          pagination={true}
          paginationPageSize={25}
          paginationPageSizeSelector={[10, 25, 50, 100]}
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

