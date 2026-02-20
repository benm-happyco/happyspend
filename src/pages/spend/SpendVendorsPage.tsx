import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Stack,
  Tabs,
  Text,
} from '@mantine/core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  type CellClickedEvent,
  type ColDef,
  type ICellRendererParams,
  ModuleRegistry,
} from 'ag-grid-community'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Building01Icon,
  Building02Icon,
  InboxIcon,
  MoreVerticalIcon,
  Upload01Icon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons'
import { AG_GRID_DEFAULT_COL_DEF, AG_GRID_DEFAULT_GRID_PROPS } from '../../lib/agGridDefaults'
import { fetchVendors, type MasterVendor } from '../../lib/vendors'
import { HpyPageHeader } from '../../theme/components/HpyPageHeader'
import { InlineEditorDrawer } from '../../theme/components/HpyDrawer'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([AllCommunityModule])

// ─── Data types (mirrors JSX Vendor Management) ─────────────────────────────

type HoldingTankVendor = {
  id: string
  n: string
  taxId: string
  apCode: string
  status: 'Pending Invite' | 'Invited' | 'Accepted' | 'Archived'
  imported: string
  email: string
}

type AccessRequest = {
  id: string
  n: string
  trade: string
  city: string
  property: string
  reason: string
  comp: 'green' | 'yellow' | 'red'
  submitted: string
  priority: 'High' | 'Medium' | 'Low'
}

// ─── Demo data (from JSX) ───────────────────────────────────────────────────

const MASTER_VENDORS: MasterVendor[] = [
  { id: '1', n: 'Universal Contractors Inc.', trade: 'HVAC', status: 'Connected', rating: 4.9, comp: 'green', city: 'Phoenix, AZ', mbe: true, spend: '$412K' },
  { id: '2', n: 'Summit HVAC', trade: 'HVAC', status: 'Connected', rating: 4.7, comp: 'green', city: 'Tempe, AZ', spend: '$285K' },
  { id: '3', n: 'Precision Climate Co.', trade: 'HVAC', status: 'Connected', rating: 4.2, comp: 'yellow', city: 'Mesa, AZ', spend: '$156K' },
  { id: '4', n: 'Greenway Landscaping', trade: 'Landscaping', status: 'Connected', rating: 4.8, comp: 'green', city: 'Scottsdale, AZ', wbe: true, spend: '$198K' },
  { id: '5', n: 'SafeGuard Electric', trade: 'Electrical', status: 'Connected', rating: 4.5, comp: 'green', city: 'Phoenix, AZ', spend: '$322K' },
  { id: '6', n: 'ProClean Janitorial', trade: 'General', status: 'Available', rating: 4.6, comp: 'green', city: 'Chandler, AZ' },
  { id: '7', n: 'Desert Plumbing Co.', trade: 'Plumbing', status: 'Available', rating: 4.3, comp: 'yellow', city: 'Gilbert, AZ' },
  { id: '8', n: 'Apex Roofing Systems', trade: 'Roofing', status: 'Available', rating: 4.1, comp: 'red', city: 'Phoenix, AZ' },
]

const HOLDING_TANK: HoldingTankVendor[] = [
  { id: '1', n: 'Valley Fire & Safety', taxId: 'XX-1234567', apCode: 'VFS-001', status: 'Pending Invite', imported: '2026-02-01', email: 'info@valleyfire.com' },
  { id: '2', n: 'Southwest Elevators', taxId: 'XX-2345678', apCode: 'SWE-002', status: 'Invited', imported: '2026-01-28', email: 'bids@swelevators.com' },
  { id: '3', n: 'Budget Paint Co.', taxId: 'XX-3456789', apCode: 'BPC-003', status: 'Accepted', imported: '2026-01-15', email: 'sales@budgetpaint.com' },
  { id: '4', n: 'Duplicate Vendor LLC', taxId: 'XX-0000000', apCode: 'DUP-999', status: 'Archived', imported: '2026-01-10', email: '' },
]

const ACCESS_REQUESTS: AccessRequest[] = [
  { id: '1', n: 'Martinez Climate Controls', trade: 'HVAC', city: 'Mesa, AZ', property: 'Oakview Apartments', reason: 'Expanding service area to include East Valley properties', comp: 'green', submitted: 'Feb 12, 2026', priority: 'High' },
  { id: '2', n: 'Desert Rose HVAC', trade: 'HVAC', city: 'Glendale, AZ', property: 'Parkview Tower', reason: 'New WBE-certified vendor seeking multifamily opportunities', comp: 'green', submitted: 'Feb 10, 2026', priority: 'Medium' },
  { id: '3', n: 'Chen HVAC Services', trade: 'HVAC', city: 'Tempe, AZ', property: 'Sunset Gardens', reason: 'Vendor portal self-registration — pending compliance docs', comp: 'red', submitted: 'Feb 8, 2026', priority: 'Low' },
  { id: '4', n: 'Harmony Heating & Air', trade: 'HVAC', city: 'Gilbert, AZ', property: 'Hilltop Commons', reason: 'MBE/WBE vendor — previously worked at sister property', comp: 'yellow', submitted: 'Feb 6, 2026', priority: 'Medium' },
]

const PROPERTY_NAMES = ['Oakview Apartments', 'Parkview Tower', 'Hilltop Commons', 'Sunset Gardens', 'Metro Center Offices']
const PROPERTY_VENDOR_COUNTS = [12, 8, 6, 9, 11]

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ─── Cell renderers ───────────────────────────────────────────────────────

function MasterVendorCell(params: ICellRendererParams<MasterVendor>) {
  const d = params.data
  if (!d) return null
  return (
    <Group gap="xs" wrap="nowrap">
      <Avatar size="sm" radius="xl" color="gray">
        {initials(d.n)}
      </Avatar>
      <div>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" fw={600} lineClamp={1}>
            {d.n}
          </Text>
          {d.mbe && <Badge size="xs" color="violet">MBE</Badge>}
          {d.wbe && <Badge size="xs" color="violet">WBE</Badge>}
        </Group>
        <Text size="xs" c="dimmed" lineClamp={1}>
          {d.city}
        </Text>
      </div>
    </Group>
  )
}

function StatusBadgeCell({ value }: ICellRendererParams<MasterVendor>) {
  const label = value === 'Connected' ? '● Connected' : 'Available'
  const color = value === 'Connected' ? 'green' : 'blue'
  return <Badge size="sm" color={color}>{label}</Badge>
}

function RatingCell({ value }: ICellRendererParams<MasterVendor>) {
  if (value == null) return null
  return (
    <Group gap={4}>
      <Text size="sm" fw={600}>{value}</Text>
    </Group>
  )
}

function ComplianceIconCell({ value }: ICellRendererParams<MasterVendor>) {
  if (!value) return null
  const color = value === 'green' ? 'green' : value === 'yellow' ? 'orange' : 'red'
  const label = value === 'green' ? 'Compliant' : value === 'yellow' ? 'Partial' : 'Non-compliant'
  return <Badge size="sm" color={color}>{label}</Badge>
}

function MasterActionCell(params: ICellRendererParams<MasterVendor>) {
  const row = params.data
  if (!row) return null
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mantine-color-dimmed)',
          }}
          aria-label="Actions"
        >
          <HugeiconsIcon icon={MoreVerticalIcon} size={18} />
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<HugeiconsIcon icon={Building02Icon} size={16} />}>View Profile</Menu.Item>
        <Menu.Item leftSection={<HugeiconsIcon icon={Building01Icon} size={16} />}>Manage Properties</Menu.Item>
        {row.status === 'Available' && (
          <Menu.Item leftSection={<HugeiconsIcon icon={Add01Icon} size={16} />}>Invite to Network</Menu.Item>
        )}
        <Menu.Divider />
        <Menu.Item color="red" leftSection={<HugeiconsIcon icon={MoreVerticalIcon} size={16} />}>Block Vendor</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

function HoldingTankActionCell(params: ICellRendererParams<HoldingTankVendor>) {
  const row = params.data
  if (!row) return null
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mantine-color-dimmed)',
          }}
          aria-label="Actions"
        >
          <HugeiconsIcon icon={MoreVerticalIcon} size={18} />
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        {row.status === 'Pending Invite' && <Menu.Item>Send Invite</Menu.Item>}
        {row.status === 'Invited' && <Menu.Item>Resend Invite</Menu.Item>}
        <Menu.Item>Edit Details</Menu.Item>
        <Menu.Divider />
        <Menu.Item color="red">Archive</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

const TANK_STATUS_COLOR: Record<string, string> = {
  'Pending Invite': 'orange',
  Invited: 'blue',
  Accepted: 'green',
  Archived: 'gray',
}

function RequestApproveCell(params: ICellRendererParams<AccessRequest>) {
  return (
    <Group gap="xs">
      <Button size="xs" color="green" leftSection={<HugeiconsIcon icon={Add01Icon} size={14} />}>
        Approve
      </Button>
      <Button size="xs" variant="subtle" color="red">
        Deny
      </Button>
    </Group>
  )
}

export function SpendVendorsPage() {
  const [tab, setTab] = useState<string | null>('master')
  const [search, setSearch] = useState('')
  const [drawerOpened, setDrawerOpened] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<MasterVendor | null>(null)
  const [masterVendors, setMasterVendors] = useState<MasterVendor[]>(MASTER_VENDORS)

  const onVendorRowClicked = useCallback((event: CellClickedEvent<MasterVendor>) => {
    if (event.data) setSelectedVendor(event.data)
  }, [])

  useEffect(() => {
    fetchVendors()
      .then((data) => {
        if (data.length > 0) setMasterVendors(data)
      })
      .catch(() => {
        // Keep initial MASTER_VENDORS on error (e.g. table missing or wrong project)
      })
  }, [])

  const filteredMaster = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return masterVendors
    return masterVendors.filter(
      (v) =>
        v.n.toLowerCase().includes(s) ||
        v.trade.toLowerCase().includes(s) ||
        v.city.toLowerCase().includes(s)
    )
  }, [search, masterVendors])

  const masterColDefs: ColDef<MasterVendor>[] = useMemo(
    () => [
      { field: 'n', headerName: 'Vendor', flex: 1, minWidth: 220, cellRenderer: MasterVendorCell },
      { field: 'trade', headerName: 'Trade', width: 120 },
      { field: 'status', headerName: 'Status', width: 120, cellRenderer: StatusBadgeCell },
      { field: 'rating', headerName: 'Rating', width: 90, cellRenderer: RatingCell },
      { field: 'comp', headerName: 'Compliance', width: 110, cellRenderer: ComplianceIconCell },
      { field: 'spend', headerName: 'YTD Spend', width: 100, valueFormatter: (p) => p.value ?? '—' },
      { field: '_action', headerName: '', width: 56, sortable: false, filter: false, cellRenderer: MasterActionCell },
    ],
    []
  )

  const holdingColDefs: ColDef<HoldingTankVendor>[] = useMemo(
    () => [
      {
        field: 'n',
        headerName: 'Vendor',
        flex: 1,
        minWidth: 200,
        cellRenderer: (p: ICellRendererParams<HoldingTankVendor>) => {
          const d = p.data
          if (!d) return null
          return (
            <div>
              <Text size="sm" fw={600}>{d.n}</Text>
              {d.email && <Text size="xs" c="dimmed">{d.email}</Text>}
            </div>
          )
        },
      },
      { field: 'taxId', headerName: 'Tax ID', width: 110 },
      { field: 'apCode', headerName: 'AP Code', width: 100 },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        cellRenderer: (p: ICellRendererParams<HoldingTankVendor>) => {
          const v = p.value as string
          const color = TANK_STATUS_COLOR[v] ?? 'gray'
          return <Badge size="sm" color={color}>{v}</Badge>
        },
      },
      { field: 'imported', headerName: 'Import Date', width: 110 },
      { field: '_action', headerName: '', width: 56, sortable: false, filter: false, cellRenderer: HoldingTankActionCell },
    ],
    []
  )

  const requestsColDefs: ColDef<AccessRequest>[] = useMemo(
    () => [
      {
        field: 'n',
        headerName: 'Vendor',
        flex: 1,
        minWidth: 200,
        cellRenderer: (p: ICellRendererParams<AccessRequest>) => {
          const d = p.data
          if (!d) return null
          return (
            <Group gap="xs">
              <Avatar size="sm" radius="xl" color="gray">{initials(d.n)}</Avatar>
              <div>
                <Text size="sm" fw={600}>{d.n}</Text>
                <Text size="xs" c="dimmed">{d.trade} · {d.city}</Text>
              </div>
            </Group>
          )
        },
      },
      { field: 'property', headerName: 'Requested Property', width: 180 },
      { field: 'reason', headerName: 'Reason', width: 220 },
      {
        field: 'comp',
        headerName: 'Compliance',
        width: 110,
        cellRenderer: (p: ICellRendererParams<AccessRequest>) => {
          const v = p.value as string
          const label = v === 'green' ? 'Compliant' : v === 'yellow' ? 'Partial' : 'Incomplete'
          const color = v === 'green' ? 'green' : v === 'yellow' ? 'orange' : 'red'
          return <Badge size="sm" color={color}>{label}</Badge>
        },
      },
      { field: 'submitted', headerName: 'Submitted', width: 110 },
      {
        field: 'priority',
        headerName: 'Priority',
        width: 90,
        cellRenderer: (p: ICellRendererParams<AccessRequest>) => {
          const v = p.value as string
          const color = v === 'High' ? 'red' : v === 'Medium' ? 'orange' : 'gray'
          return <Badge size="sm" color={color}>{v}</Badge>
        },
      },
      { field: '_action', headerName: '', width: 140, sortable: false, filter: false, cellRenderer: RequestApproveCell },
    ],
    []
  )

  const gridProps = useMemo(
    () => ({
      ...AG_GRID_DEFAULT_GRID_PROPS,
      rowSelection: false,
    }),
    []
  )

  const holdingCount = HOLDING_TANK.filter((v) => v.status !== 'Archived').length

  return (
    <Stack gap="md" style={{ minHeight: 0, flex: 1, overflow: 'hidden' }}>
      <HpyPageHeader
        title="Vendor Network"
        appIconType="Inventory"
        searchPlaceholder="Search by name, trade, or service area..."
        searchValue={search}
        onSearchChange={setSearch}
        ctaLabel="Invite Vendor"
        onCtaClick={() => setDrawerOpened(true)}
      />

      <Alert
        variant="light"
        color="violet"
        title="Vendor compliance"
        styles={{ title: { fontWeight: 700 } }}
      >
        4 vendors have compliance docs expiring within 30 days. 3 new MBE-certified HVAC vendors in the Phoenix metro are available — add them to your review pipeline.
      </Alert>

      <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={setTab} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Tabs.List>
          <Tabs.Tab value="master" leftSection={<HugeiconsIcon icon={UserMultipleIcon} size={18} />}>
            Vendor Master ({masterVendors.length})
          </Tabs.Tab>
          <Tabs.Tab value="holding" leftSection={<HugeiconsIcon icon={InboxIcon} size={18} />}>
            Holding Tank ({holdingCount})
          </Tabs.Tab>
          <Tabs.Tab value="requests" leftSection={<HugeiconsIcon icon={Add01Icon} size={18} />}>
            Access Requests (4)
          </Tabs.Tab>
          <Tabs.Tab value="properties" leftSection={<HugeiconsIcon icon={Building02Icon} size={18} />}>
            Property Enablement
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="master" pt="md" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Group gap="xs" mb="md" style={{ flexShrink: 0 }}>
            <Button variant="subtle" leftSection={<HugeiconsIcon icon={MoreVerticalIcon} size={16} />}>
              Filters
            </Button>
          </Group>
          <Box style={{ flex: 1, minHeight: 0, width: '100%' }} className="ag-theme-alpine">
            <AgGridReact<MasterVendor>
              {...gridProps}
              columnDefs={masterColDefs}
              defaultColDef={AG_GRID_DEFAULT_COL_DEF}
              rowData={filteredMaster}
              getRowId={(p) => p.data?.id ?? String(p.rowIndex ?? 0)}
              onCellClicked={onVendorRowClicked}
              getRowStyle={() => ({ cursor: 'pointer' })}
            />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="holding" pt="md" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Group justify="space-between" mb="md" style={{ flexShrink: 0 }}>
            <Text size="sm" fw={700}>
              AP Import Queue — Vendors not yet active in network
            </Text>
            <Button variant="light" size="sm" leftSection={<HugeiconsIcon icon={Upload01Icon} size={16} />}>
              Bulk Import CSV
            </Button>
          </Group>
          <Box style={{ flex: 1, minHeight: 0, width: '100%' }} className="ag-theme-alpine">
            <AgGridReact<HoldingTankVendor>
              {...gridProps}
              columnDefs={holdingColDefs}
              defaultColDef={AG_GRID_DEFAULT_COL_DEF}
              rowData={HOLDING_TANK}
              getRowId={(p) => p.data?.id ?? ''}
              getRowStyle={(params) => (params.data?.status === 'Archived' ? { opacity: 0.5 } : undefined)}
            />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="requests" pt="md" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Alert variant="light" color="violet" mb="md" title="Vendor-Initiated Access Requests" style={{ flexShrink: 0 }}>
            Vendors can request enablement for specific properties. Review and approve or decline below.
          </Alert>
          <Box style={{ flex: 1, minHeight: 0, width: '100%' }} className="ag-theme-alpine">
            <AgGridReact<AccessRequest>
              {...gridProps}
              columnDefs={requestsColDefs}
              defaultColDef={AG_GRID_DEFAULT_COL_DEF}
              rowData={ACCESS_REQUESTS}
              getRowId={(p) => p.data?.id ?? ''}
              getRowStyle={(params) =>
                params.data?.priority === 'High' ? { backgroundColor: 'var(--mantine-color-red-0)' } : undefined
              }
            />
          </Box>
          <Group gap="xs" mt="md">
            <Button variant="light" size="sm" leftSection={<HugeiconsIcon icon={Add01Icon} size={16} />}>
              Approve All Compliant
            </Button>
            <Button variant="light" size="sm">
              Request Missing Docs
            </Button>
          </Group>
        </Tabs.Panel>

        <Tabs.Panel value="properties" pt="md">
          <Group align="stretch" gap="md">
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={700} mb="xs">
                Property Enablement
              </Text>
              <Text size="xs" c="dimmed" mb="sm">
                Manage which vendors are authorized for each property. Enablement controls spend access and billing routing.
              </Text>
              <Stack gap={0}>
                {PROPERTY_NAMES.map((name, i) => (
                  <Group key={name} justify="space-between" py="xs" style={{ borderBottom: i < PROPERTY_NAMES.length - 1 ? '1px solid var(--mantine-color-default-border)' : undefined }}>
                    <Group gap="xs">
                      <HugeiconsIcon icon={Building02Icon} size={16} />
                      <Text size="sm">{name}</Text>
                    </Group>
                    <Badge size="sm" variant="light" color="blue">
                      {PROPERTY_VENDOR_COUNTS[i]} vendors
                    </Badge>
                  </Group>
                ))}
              </Stack>
            </Box>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={700} mb="xs">
                Bulk Enablement
              </Text>
              <Box
                p="xl"
                style={{
                  border: '2px dashed var(--mantine-color-default-border)',
                  borderRadius: 8,
                  textAlign: 'center',
                }}
              >
                <Text size="sm" c="dimmed" mb="xs">
                  Select a vendor to enable across multiple properties at once
                </Text>
                <Button size="sm" variant="light" leftSection={<HugeiconsIcon icon={Add01Icon} size={16} />}>
                  Enable for Region
                </Button>
              </Box>
            </Box>
          </Group>
        </Tabs.Panel>
        </Tabs>
      </Box>

      <InlineEditorDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        title="Invite Vendor"
        withCloseButton
      />

      <InlineEditorDrawer
        opened={selectedVendor !== null}
        onClose={() => setSelectedVendor(null)}
        title={selectedVendor?.n ?? 'Vendor'}
        withCloseButton
      >
        {selectedVendor && (
          <Stack gap="md">
            <Group gap="xs">
              <Avatar size="md" radius="xl" color="gray">
                {initials(selectedVendor.n)}
              </Avatar>
              <div>
                <Group gap="xs">
                  {selectedVendor.mbe && <Badge size="sm" color="violet">MBE</Badge>}
                  {selectedVendor.wbe && <Badge size="sm" color="violet">WBE</Badge>}
                </Group>
                <Text size="sm" c="dimmed">{selectedVendor.city}</Text>
              </div>
            </Group>
            <Stack gap="xs">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">Trade</Text>
              <Text size="sm">{selectedVendor.trade}</Text>
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">Status</Text>
              <Badge size="sm" color={selectedVendor.status === 'Connected' ? 'green' : 'blue'}>
                {selectedVendor.status === 'Connected' ? '● Connected' : 'Available'}
              </Badge>
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">Rating</Text>
              <Text size="sm">{selectedVendor.rating}</Text>
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">Compliance</Text>
              <Badge
                size="sm"
                color={selectedVendor.comp === 'green' ? 'green' : selectedVendor.comp === 'yellow' ? 'orange' : 'red'}
              >
                {selectedVendor.comp === 'green' ? 'Compliant' : selectedVendor.comp === 'yellow' ? 'Partial' : 'Non-compliant'}
              </Badge>
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">YTD Spend</Text>
              <Text size="sm">{selectedVendor.spend ?? '—'}</Text>
            </Stack>
          </Stack>
        )}
      </InlineEditorDrawer>
    </Stack>
  )
}
