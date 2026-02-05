import { Alert, Box, Group, Paper, Select, Skeleton, Stack, Text } from '@mantine/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  _PopupModule,
  _SharedMenuModule,
  _ColumnFilterModule,
  _FilterCoreModule,
  _FilterValueModule,
} from 'ag-grid-community'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { getHappyCoConfig, happyCoGraphql } from '../lib/happyco'
import { AG_GRID_DEFAULT_COL_DEF, AG_GRID_DEFAULT_GRID_PROPS } from '../lib/agGridDefaults'
import { CategoryIcon } from '../theme/components/CategoryIcon'
import { getCategoryIconSrc } from '../theme/components/categoryIcons'
import { StatusBadge, STATUS_BADGE_KEYS, type StatusBadgeStatus } from '../theme/components/StatusBadge'
import { CircleIcon } from '@hugeicons/core-free-icons'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([
  AllCommunityModule,
  _PopupModule,
  _SharedMenuModule,
  _ColumnFilterModule,
  _FilterCoreModule,
  _FilterValueModule,
])

type TaskNode = {
  id: string
  createdAt?: string | null
  description?: string | null
  summary?: string | null
  priority?: string | null
  status?: string | null
  scheduledFor?: string | null
  location?: { name?: string | null } | null
  assignedTo?: { id?: string | null } | null
  occupyingResidents?: Array<{ name?: string | null }> | null
  workCategory?: {
    name?: string | null
    children?: { edges?: Array<{ node?: { name?: string | null } | null }> | null } | null
  } | null
}

type TasksQueryResponse = {
  business: {
    node: {
      id: string
      name: string
      tasks: {
        edges: Array<{ node: TaskNode }>
      }
    } | null
  } | null
}

type TaskDetailsResponse = {
  task: {
    description?: string | null
    assignedTo?: { id: string; name: string } | null
    createdAt?: string | null
    activities?: {
      nodes?: Array<{ activityType?: string | null; createdAt?: string | null }>
    } | null
    locationV2?: { name?: string | null } | null
    scheduledFor?: string | null
    priority?: string | null
    status?: string | null
  } | null
}

const TASKS_QUERY = `
  query getTasks($businessID: ID!, $taskFilter: BusinessTasksFilter!) {
    business(businessID: $businessID) {
      node {
        id
        name
        tasks(filter: $taskFilter) {
          edges {
            node {
              id
              createdAt
              description
              priority
              status
              scheduledFor
              summary
              occupyingResidents {
                name
              }
              location {
                name
              }
              assignedTo {
                id
              }
              workCategory {
                name
                children {
                  edges {
                    node {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`
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


const TASK_DETAILS_QUERY = `
  query TaskDetails($taskId: ID!) {
    task(taskId: $taskId) {
      description
      assignedTo {
        id
        name
      }
      createdAt
      activities {
        nodes {
          ... on TaskActivityAssigneeChanged {
            activityType
            createdAt
          }
        }
      }
      locationV2 {
        name
      }
      scheduledFor
      priority
      status
    }
  }
`
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

const formatFuzzyDate = (value?: string | null) => {
  if (!value) return { label: '—', tooltip: undefined }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { label: '—', tooltip: undefined }

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const absDiff = Math.abs(diff)
  const isFuture = diff < 0

  if (absDiff <= 5000) return { label: 'Just now', tooltip: formatAbsoluteDateTime(date) }

  if (absDiff < MS_PER_HOUR) {
    const minutes = Math.round(absDiff / MS_PER_MINUTE)
    return {
      label: isFuture ? `in ${minutes} min` : `${minutes} min ago`,
      tooltip: formatAbsoluteDateTime(date),
    }
  }

  if (absDiff < MS_PER_DAY) {
    const hours = Math.round(absDiff / MS_PER_HOUR)
    return {
      label: isFuture ? `in ${hours} hours` : `${hours} hr ago`,
      tooltip: formatAbsoluteDateTime(date),
    }
  }

  const startOfToday = getStartOfDay(now)
  const startOfDate = getStartOfDay(date)
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / MS_PER_DAY)

  if (!isFuture && dayDiff === 1) {
    return { label: `Yesterday at ${formatTime(date)}`, tooltip: formatAbsoluteDateTime(date) }
  }

  if (!isFuture && dayDiff > 1 && dayDiff <= 7) {
    return { label: formatWeekdayTime(date), tooltip: formatAbsoluteDateTime(date) }
  }

  if (isFuture && absDiff <= 7 * MS_PER_DAY) {
    return { label: formatWeekdayTime(date), tooltip: formatAbsoluteDateTime(date) }
  }

  const nowYear = now.getFullYear()
  if (date.getFullYear() === nowYear) {
    return { label: formatMonthDay(date), tooltip: formatAbsoluteDateTime(date) }
  }

  return { label: formatMonthDayYear(date), tooltip: formatAbsoluteDateTime(date) }
}

export function HappyPropertyTest3() {
  const { baseUrl, hasToken } = getHappyCoConfig()
  const businessId = import.meta.env.VITE_HAPPYCO_BUSINESS_ID
  const locationIdsRaw = import.meta.env.VITE_HAPPYCO_LOCATION_IDS
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [tasks, setTasks] = useState<TaskNode[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [selectedCount, setSelectedCount] = useState(0)
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null)
  const [workOrderDetails, setWorkOrderDetails] = useState<TaskDetailsResponse['task']>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [testSelectValue, setTestSelectValue] = useState<string | null>('25')
  const gridWrapperRef = useRef<HTMLDivElement | null>(null)

  const defaultColDef = useMemo(() => ({ ...AG_GRID_DEFAULT_COL_DEF }), [])
  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...(() => {
        const desiredColumns = [
          'Work Order',
          'Priority',
          'Status',
          'Location',
          'Assignee',
          'Scheduled',
          'Created',
        ]

        const getWorkOrderDisplay = (task: TaskNode | undefined) => {
          const categoryName = task?.workCategory?.name?.trim() || ''
          const subcategoryName =
            task?.workCategory?.children?.edges?.[0]?.node?.name?.trim() || ''
          const isUncategorized = categoryName.toLowerCase() === 'uncategorized'
          const primaryName = subcategoryName || (!isUncategorized ? task?.summary?.trim() || task?.description?.trim() || '' : '')
          const title = [primaryName, categoryName].filter(Boolean).join(' | ') || 'Work Order'
          const description = task?.description?.trim() || task?.summary?.trim() || ''
          return { title, description, categoryName }
        }

        return desiredColumns.map((label) => {
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
              cellRenderer: (params: { data?: TaskNode }) => {
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
                        {display.title}
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

          if (label === 'Priority' || label === 'Status') {
            const fieldKey = label === 'Priority' ? 'priority' : 'status'
            const fallback = label === 'Priority' ? 'NORMAL' : 'OPEN'
            return {
              headerName: label,
              field: fieldKey,
              minWidth: 140,
              flex: 1,
              sortable: true,
              filter: true,
              resizable: true,
              cellRenderer: (params: { data?: TaskNode }) => {
                const rawValue = params.data?.[fieldKey]
                return <StatusBadge status={resolveBadgeStatus(rawValue, fallback)} />
              },
            } as ColDef
          }

          if (label === 'Created') {
            return {
              headerName: label,
              field: 'createdAt',
              flex: 1,
              minWidth: 140,
              sortable: true,
              filter: true,
              resizable: true,
              valueFormatter: ({ value }) => formatFuzzyDate(value).label,
              tooltipValueGetter: ({ value }) => formatFuzzyDate(value).tooltip,
            } as ColDef
          }

          if (label === 'Scheduled') {
            return {
              headerName: label,
              field: 'scheduledFor',
              flex: 1,
              minWidth: 140,
              sortable: true,
              filter: true,
              resizable: true,
              valueFormatter: ({ value }) => formatFuzzyDate(value).label,
              tooltipValueGetter: ({ value }) => formatFuzzyDate(value).tooltip,
            } as ColDef
          }

          if (label === 'Location') {
            return {
              headerName: label,
              field: 'location',
              flex: 1,
              minWidth: 140,
              sortable: true,
              filter: true,
              resizable: true,
              valueGetter: ({ data }) => data?.location?.name ?? '',
            } as ColDef
          }

          if (label === 'Assignee') {
            return {
              headerName: label,
              field: 'assignedTo',
              flex: 1,
              minWidth: 140,
              sortable: true,
              filter: true,
              resizable: true,
              valueGetter: ({ data }) => data?.assignedTo?.id ?? '',
            } as ColDef
          }

          return {
            headerName: label,
            flex: 1,
            minWidth: 140,
            sortable: true,
            filter: true,
            resizable: true,
            valueGetter: () => '',
          } as ColDef
        })
      })(),
    ],
    []
  )

  const updateFooterCounts = useCallback(
    (api: { getDisplayedRowCount: () => number; getSelectedNodes: () => unknown[] }) => {
      setRowCount(api.getDisplayedRowCount())
      setSelectedCount(api.getSelectedNodes().length)
    },
    []
  )

  useEffect(() => {
    if (!hasToken) return

    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        if (!businessId || !locationIdsRaw) {
          setError('Missing VITE_HAPPYCO_BUSINESS_ID or VITE_HAPPYCO_LOCATION_IDS for the tasks query.')
          return
        }

        const locationIDs = locationIdsRaw
          .split(',')
          .map((value: string) => value.trim())
          .filter(Boolean)

        if (locationIDs.length === 0) {
          setError('VITE_HAPPYCO_LOCATION_IDS must contain at least one location ID.')
          return
        }

        const response = await happyCoGraphql<TasksQueryResponse>(
          TASKS_QUERY,
          {
            businessID: businessId,
            taskFilter: { locationID: locationIDs },
          },
          { baseUrl }
        )
        if (!isMounted) return
        const node = response.business?.node
        setBusinessName(node?.name ?? null)
        setTasks(node?.tasks?.edges?.map((edge) => edge.node) ?? [])
      } catch (err) {
        if (!isMounted) return
        setError((err as Error).message)
      } finally {
        if (!isMounted) return
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [baseUrl, businessId, hasToken, locationIdsRaw])



  useEffect(() => {
    if (!hasToken || !selectedWorkOrderId) {
      setWorkOrderDetails(null)
      setDetailsError(null)
      return
    }

    let isMounted = true
    setDetailsLoading(true)
    setDetailsError(null)

    const fetchDetails = async () => {
      try {
        const response = await happyCoGraphql<TaskDetailsResponse>(
          TASK_DETAILS_QUERY,
          { taskId: selectedWorkOrderId },
          { baseUrl }
        )
        if (!isMounted) return
        setWorkOrderDetails(response.task ?? null)
      } catch (err) {
        if (!isMounted) return
        setDetailsError((err as Error).message)
      } finally {
        if (!isMounted) return
        setDetailsLoading(false)
      }
    }

    fetchDetails()

    return () => {
      isMounted = false
    }
  }, [baseUrl, hasToken, selectedWorkOrderId])

  const rowData = useMemo(() => tasks, [tasks])

  return (
    <>
      <GlobalHeader variant="product" businessName={businessName} />
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
            <HpyPageHeader
              title="Work Orders"
              appIconType="Tasks"
              searchPlaceholder="Search"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              ctaLabel="Run query"
              ctaDisabled
            />
            <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
              <Select
                label="Test Mantine Select"
                placeholder="Choose a value"
                data={[
                  { value: '10', label: '10 rows' },
                  { value: '25', label: '25 rows' },
                  { value: '50', label: '50 rows' },
                  { value: '100', label: '100 rows' },
                ]}
                value={testSelectValue}
                onChange={setTestSelectValue}
                w={280}
              />
              {loading ? (
                <Stack gap="xs">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} height={64} radius="md" />
                  ))}
                </Stack>
              ) : (
                <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                  <div
                    ref={gridWrapperRef}
                    style={{ height: '100%', width: '100%' }}
                    className="ag-theme-alpine"
                  >
                    <AgGridReact
                      {...AG_GRID_DEFAULT_GRID_PROPS}
                      rowData={rowData}
                      columnDefs={columnDefs}
                      defaultColDef={defaultColDef}
                      quickFilterText={searchValue}
                      overlayNoRowsTemplate="No tasks found."
                      rowSelection={{ mode: 'multiRow', checkboxes: true, headerCheckbox: true, enableClickSelection: false }}
                      onRowClicked={(params) => {
                        setSelectedWorkOrderId(params.data?.id ?? null)
                      }}
                      onGridReady={(params) => updateFooterCounts(params.api)}
                      onSelectionChanged={(params) => updateFooterCounts(params.api)}
                      onFilterChanged={(params) => updateFooterCounts(params.api)}
                      onModelUpdated={(params) => updateFooterCounts(params.api)}
                    />
                    {(detailsLoading || detailsError || workOrderDetails) && (
                      <Paper
                        withBorder
                        radius="md"
                        p="md"
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          width: 320,
                          zIndex: 2,
                          backgroundColor: 'var(--mantine-color-body)',
                        }}
                      >
                        <Stack gap="xs">
                          <Text fw={700}>Work Order Details</Text>
                          {detailsLoading ? (
                            <Stack gap="xs">
                              {Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} height={12} radius="sm" />
                              ))}
                            </Stack>
                          ) : detailsError ? (
                            <Text size="sm" c="red">
                              {detailsError}
                            </Text>
                          ) : (
                            <>
                              <Text size="sm" c="dimmed">
                                {workOrderDetails?.description || 'No description'}
                              </Text>
                              <Group gap="xs">
                                <StatusBadge status={(workOrderDetails?.priority || 'NORMAL') as any} />
                                <StatusBadge status={(workOrderDetails?.status || 'OPEN') as any} />
                              </Group>
                              <Stack gap={4}>
                                <Group justify="space-between" align="center">
                                  <Text size="xs" c="dimmed">
                                    Assignee
                                  </Text>
                                  <Text size="sm">
                                    {workOrderDetails?.assignedTo?.name || 'Unassigned'}
                                  </Text>
                                </Group>
                                <Group justify="space-between" align="center">
                                  <Text size="xs" c="dimmed">
                                    Location
                                  </Text>
                                  <Text size="sm">
                                    {workOrderDetails?.locationV2?.name || 'Unknown'}
                                  </Text>
                                </Group>
                                <Group justify="space-between" align="center">
                                  <Text size="xs" c="dimmed">
                                    Scheduled
                                  </Text>
                                  <Text size="sm">
                                    {formatFuzzyDate(workOrderDetails?.scheduledFor).label}
                                  </Text>
                                </Group>
                                <Group justify="space-between" align="center">
                                  <Text size="xs" c="dimmed">
                                    Created
                                  </Text>
                                  <Text size="sm">
                                    {formatFuzzyDate(workOrderDetails?.createdAt).label}
                                  </Text>
                                </Group>
                              </Stack>
                            </>
                          )}
                        </Stack>
                      </Paper>
                    )}
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
              )}
            </Stack>
          </Stack>
        </Box>
      </Box>
    </>
  )
}
