import { Box, Group, Select, Stack, TextInput } from '@mantine/core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, type ColDef, type ICellRendererParams, ModuleRegistry } from 'ag-grid-community'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { AG_GRID_DEFAULT_COL_DEF, AG_GRID_DEFAULT_GRID_PROPS } from '../../lib/agGridDefaults'
import { fetchSourcingEvents, type SourcingEvent, type SourcingEventsFilters } from '../../lib/sourcingEvents'
import { SpendPhaseStatusBadges } from './SpendPhaseStatusBadges'

function StatusCellRenderer(params: ICellRendererParams<SourcingEvent>) {
  if (!params.data) return null
  return <SpendPhaseStatusBadges phase={params.data.phase} status={params.data.status} />
}
import { SpendSetupRequired } from './SpendSetupRequired'
import { HpyPageHeader } from '../../theme/components/HpyPageHeader'
import { HpyAppIcon } from '../../theme/components/HpyAppIcon'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([AllCommunityModule])

const PHASES = [
  { value: '', label: 'All phases' },
  { value: 'Planning & Creation', label: 'Planning & Creation' },
  { value: 'Market Engagement', label: 'Market Engagement' },
  { value: 'Evaluation', label: 'Evaluation' },
  { value: 'Award & Contracting', label: 'Award & Contracting' },
  { value: 'Conclusion', label: 'Conclusion' },
]

const STATUSES = [
  'Draft',
  'Scheduled',
  'Pending Approval',
  'Open',
  'Under Review',
  'Award Pending',
  'Awarded',
  'Completed',
  'Cancelled',
]

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function SpendEventsList() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<SourcingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [phaseFilter, setPhaseFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string[]>([])

  const filters: SourcingEventsFilters = useMemo(
    () => ({
      search: search || undefined,
      phase: phaseFilter || undefined,
      status: statusFilter.length ? statusFilter : undefined,
    }),
    [search, phaseFilter, statusFilter]
  )

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchSourcingEvents(filters)
      .then(setRows)
      .catch((e: unknown) =>
        setError(
          e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string'
            ? (e as { message: string }).message
            : String(e)
        )
      )
      .finally(() => setLoading(false))
  }, [filters.search, filters.phase, filters.status])

  const onRowClicked = useCallback(
    (params: { data: SourcingEvent }) => {
      const id = params.data.id
      navigate(`/happy-spend/events/${id}`)
    },
    [navigate]
  )

  const columnDefs: ColDef<SourcingEvent>[] = useMemo(
    () => [
      {
        field: 'external_id',
        headerName: 'ID',
        minWidth: 100,
        flex: 0,
        valueFormatter: (p) => p.value ?? p.data?.id?.slice(0, 8) ?? '—',
      },
      {
        field: 'name',
        headerName: 'Name',
        minWidth: 220,
      },
      {
        field: 'phase',
        headerName: 'Phase',
        minWidth: 140,
        filter: false,
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 130,
        filter: false,
        cellRenderer: StatusCellRenderer,
      },
      { field: 'type', headerName: 'Type', minWidth: 80, flex: 0 },
      { field: 'project', headerName: 'Project', minWidth: 140 },
      { field: 'property', headerName: 'Property', minWidth: 130 },
      {
        field: 'bids',
        headerName: 'Bids',
        minWidth: 80,
        flex: 0,
        filter: 'agNumberColumnFilter',
      },
      { field: 'created_by', headerName: 'Created by', minWidth: 120 },
      {
        field: 'created_date',
        headerName: 'Created',
        minWidth: 110,
        valueFormatter: (p) => formatDate(p.value),
      },
      {
        field: 'deadline',
        headerName: 'Deadline',
        minWidth: 110,
        valueFormatter: (p) => formatDate(p.value),
      },
    ],
    []
  )

  const defaultColDef = useMemo(() => AG_GRID_DEFAULT_COL_DEF, [])
  const gridProps = useMemo(
    () => ({
      ...AG_GRID_DEFAULT_GRID_PROPS,
      rowSelection: false,
    }),
    []
  )

  return (
    <Stack gap="md" style={{ minHeight: 0, flex: 1 }}>
      <HpyPageHeader
        title="Sourcing Events"
        appIconNode={<HpyAppIcon type="Projects" size={48} radius={8} />}
        searchPlaceholder="Search events..."
        searchValue={search}
        onSearchChange={setSearch}
        ctaLabel="New Event"
        onCtaClick={() => {}}
      />

      {error && (
        <SpendSetupRequired error={error} />
      )}

      <Group gap="md">
        <Select
          placeholder="Phase"
          data={PHASES}
          value={phaseFilter ?? ''}
          onChange={(v) => setPhaseFilter(v || null)}
          clearable
          style={{ width: 200 }}
          styles={{
            input: {
              backgroundColor: 'var(--mantine-color-body)',
              borderColor: 'var(--mantine-color-default-border)',
            },
          }}
        />
        <Select
          placeholder="Status"
          data={STATUSES.map((s) => ({ value: s, label: s }))}
          value={statusFilter[0] ?? null}
          onChange={(v) => setStatusFilter(v ? [v] : [])}
          clearable
          style={{ width: 180 }}
          styles={{
            input: {
              backgroundColor: 'var(--mantine-color-body)',
              borderColor: 'var(--mantine-color-default-border)',
            },
          }}
        />
      </Group>

      {!error && (
      <Box style={{ flex: 1, minHeight: 400 }} className="ag-theme-alpine">
        <AgGridReact<SourcingEvent>
          {...gridProps}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowData={rows}
          loading={loading}
          onRowClicked={onRowClicked}
          getRowId={(p) => p.data.id}
          suppressRowClickSelection
        />
      </Box>
      )}
    </Stack>
  )
}
