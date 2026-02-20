import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Grid,
  Group,
  Menu,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Stepper,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Component } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, type ColDef, type ICellRendererParams, ModuleRegistry } from 'ag-grid-community'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Alert02Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  File01Icon,
  File02Icon,
  InboxIcon,
  ListViewIcon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  SlidersHorizontalIcon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons'
import { AG_GRID_DEFAULT_COL_DEF, AG_GRID_DEFAULT_GRID_PROPS } from '../../lib/agGridDefaults'
import { fetchSourcingEventById, type SourcingEvent } from '../../lib/sourcingEvents'
import sourcingEventHero from '../../assets/spend/sourcing-event-hero.png'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([AllCommunityModule])

function formatCurrency(n: number | null): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Demo line items for overview
const DEMO_LINE_ITEMS = [
  'Remove existing mulch in play area',
  'Supply & install engineered wood fiber (EWF) safety surfacing',
  'Trench & install French drain along perimeter',
]

// Demo line items for Line Items tab (Surface and Drainage Improvements)
type LineItemRow = {
  id: string
  itemName: string
  category: string
  assetLocation: string
  costCode: string
  glCode: string
  retainageEligible: boolean
  unitOfMeasure: string
  quantity: number
  targetUnitPrice: string
}
const DEMO_LINE_ITEMS_ROWS: LineItemRow[] = [
  { id: '1', itemName: 'Remove Existing Mulch in Play Area', category: 'Labour', assetLocation: 'Dog Park', costCode: 'ABC-123', glCode: '098-7654', retainageEligible: true, unitOfMeasure: 'SqFt', quantity: 1200, targetUnitPrice: '$0.55' },
  { id: '2', itemName: 'Supply & Install Engineered Wood Fiber (EWF)', category: 'Materials', assetLocation: 'Dog Park', costCode: 'ABC-123', glCode: '098-7654', retainageEligible: true, unitOfMeasure: 'SqFt', quantity: 1200, targetUnitPrice: '$110' },
  { id: '3', itemName: 'Trench & Install French Drain Along Perimeter', category: 'Labour', assetLocation: 'Dog Park, Parking Lot', costCode: 'ABC-123', glCode: '098-7654', retainageEligible: true, unitOfMeasure: 'Linear Ft', quantity: 90, targetUnitPrice: '$14.00' },
  { id: '4', itemName: 'Perforated Drain Pipe - 4"', category: 'Materials', assetLocation: 'Dog Park, Parking Lot', costCode: 'ABC-123', glCode: '098-7654', retainageEligible: true, unitOfMeasure: 'Linear Ft', quantity: 90, targetUnitPrice: '$4.25' },
  { id: '5', itemName: 'Geotextile Fabric Underlay', category: 'Materials', assetLocation: 'Dog Park', costCode: 'ABC-123', glCode: '098-7654', retainageEligible: false, unitOfMeasure: 'SqFt', quantity: 1200, targetUnitPrice: '$0.40' },
  { id: '6', itemName: 'Grade & Compact Subsurface', category: 'Labour', assetLocation: 'Dog Park', costCode: 'ABC-123', glCode: '098-7654', retainageEligible: false, unitOfMeasure: 'Hours', quantity: 10, targetUnitPrice: '$55.00' },
  { id: '7', itemName: 'Haul-Away of Existing Surfacing', category: 'Services', assetLocation: 'Dog Park', costCode: 'ABC-123', glCode: '098-7654', retainageEligible: false, unitOfMeasure: 'Lump Sum', quantity: 1, targetUnitPrice: '$300.00' },
  { id: '8', itemName: 'Washed Gravel Bedding for Drain Pipe', category: 'Materials', assetLocation: 'Dog Park, Parking Lot', costCode: 'ABC-124', glCode: '098-7655', retainageEligible: true, unitOfMeasure: 'CuYd', quantity: 12, targetUnitPrice: '$42.00' },
  { id: '9', itemName: 'Storm Drain Catch Basin - 18"', category: 'Materials', assetLocation: 'Parking Lot', costCode: 'ABC-124', glCode: '098-7655', retainageEligible: true, unitOfMeasure: 'Each', quantity: 2, targetUnitPrice: '$185.00' },
  { id: '10', itemName: 'Install Catch Basin & Connect to French Drain', category: 'Labour', assetLocation: 'Parking Lot', costCode: 'ABC-123', glCode: '098-7654', retainageEligible: true, unitOfMeasure: 'Each', quantity: 2, targetUnitPrice: '$450.00' },
  { id: '11', itemName: 'Concrete Curb Edge at Play Area Boundary', category: 'Labour', assetLocation: 'Dog Park', costCode: 'ABC-125', glCode: '098-7656', retainageEligible: true, unitOfMeasure: 'Linear Ft', quantity: 180, targetUnitPrice: '$18.00' },
  { id: '12', itemName: 'Chain Link Fence Repair - Gates', category: 'Labour', assetLocation: 'Dog Park', costCode: 'ABC-126', glCode: '098-7657', retainageEligible: false, unitOfMeasure: 'Each', quantity: 2, targetUnitPrice: '$325.00' },
  { id: '13', itemName: 'Gate Hardware & Latching Upgrade', category: 'Materials', assetLocation: 'Dog Park', costCode: 'ABC-126', glCode: '098-7657', retainageEligible: false, unitOfMeasure: 'Each', quantity: 2, targetUnitPrice: '$95.00' },
  { id: '14', itemName: 'Bollard Installation - Entry Points', category: 'Labour', assetLocation: 'Dog Park', costCode: 'ABC-127', glCode: '098-7658', retainageEligible: true, unitOfMeasure: 'Each', quantity: 4, targetUnitPrice: '$210.00' },
  { id: '15', itemName: 'Steel Bollards - 4" Diameter', category: 'Materials', assetLocation: 'Dog Park', costCode: 'ABC-127', glCode: '098-7658', retainageEligible: true, unitOfMeasure: 'Each', quantity: 4, targetUnitPrice: '$85.00' },
  { id: '16', itemName: 'Temporary Fencing During Construction', category: 'Services', assetLocation: 'Dog Park', costCode: 'ABC-123', glCode: '098-7654', retainageEligible: false, unitOfMeasure: 'Lump Sum', quantity: 1, targetUnitPrice: '$650.00' },
  { id: '17', itemName: 'Site Signage - Rules & Hours', category: 'Materials', assetLocation: 'Dog Park', costCode: 'ABC-128', glCode: '098-7659', retainageEligible: false, unitOfMeasure: 'Each', quantity: 3, targetUnitPrice: '$125.00' },
  { id: '18', itemName: 'Trash Receptacle - Pet Waste Stations', category: 'Materials', assetLocation: 'Dog Park', costCode: 'ABC-129', glCode: '098-7660', retainageEligible: false, unitOfMeasure: 'Each', quantity: 4, targetUnitPrice: '$180.00' },
  { id: '19', itemName: 'Seeding & Stabilization - Disturbed Areas', category: 'Services', assetLocation: 'Dog Park, Parking Lot', costCode: 'ABC-130', glCode: '098-7661', retainageEligible: false, unitOfMeasure: 'SqFt', quantity: 400, targetUnitPrice: '$2.25' },
  { id: '20', itemName: 'Final Grading & Site Cleanup', category: 'Labour', assetLocation: 'Dog Park', costCode: 'ABC-123', glCode: '098-7654', retainageEligible: false, unitOfMeasure: 'Hours', quantity: 16, targetUnitPrice: '$48.00' },
]

// Demo questions for Questionnaire tab
type QuestionRow = {
  id: string
  question: string
  category: string
  required: boolean
  fileUploadRequired: boolean
  importance: string
  responseType: string
}
const DEMO_QUESTIONS: QuestionRow[] = [
  { id: '1', question: 'How many years has your company been operating?', category: 'Company Information', required: true, fileUploadRequired: true, importance: 'Low', responseType: 'Short answer' },
  { id: '2', question: 'What is your current general liability insurance coverage amount?', category: 'Safety & Compliance', required: true, fileUploadRequired: true, importance: 'Low', responseType: 'Short answer' },
  { id: '3', question: 'Which safety certifications does your company hold?', category: 'Experience & Qualifications', required: true, fileUploadRequired: true, importance: 'Medium', responseType: 'Select one or more options from a list' },
  { id: '4', question: 'Describe your approach to quality control and ensuring project standards.', category: 'Project Approach', required: true, fileUploadRequired: true, importance: 'Low', responseType: 'Long answer' },
  { id: '5', question: 'What is your typical response time for emergency service calls?', category: 'Project Approach', required: false, fileUploadRequired: false, importance: 'High', responseType: 'Select one option from a list' },
  { id: '6', question: 'Please provide three references from similar projects completed in the past 2 years.', category: 'References', required: false, fileUploadRequired: false, importance: 'Critical', responseType: 'Long answer' },
  { id: '7', question: 'Do you have a formal environmental management system or sustainability certifications?', category: 'Environmental', required: false, fileUploadRequired: false, importance: 'Critical', responseType: 'Select one option from a list' },
  { id: '8', question: 'Provide your Workers Compensation and Auto Liability insurance certificates.', category: 'Safety & Compliance', required: true, fileUploadRequired: true, importance: 'Critical', responseType: 'Document upload' },
  { id: '9', question: 'Describe your experience with park, playground, or outdoor amenity projects.', category: 'Experience & Qualifications', required: true, fileUploadRequired: false, importance: 'High', responseType: 'Long answer' },
  { id: '10', question: 'What is your proposed project schedule and key milestones?', category: 'Project Approach', required: true, fileUploadRequired: false, importance: 'High', responseType: 'Long answer' },
  { id: '11', question: 'Do you have IPEMA certification or experience installing ASTM F1292-compliant surfacing?', category: 'Experience & Qualifications', required: false, fileUploadRequired: false, importance: 'Medium', responseType: 'Select one option from a list' },
  { id: '12', question: 'Will you use subcontractors for any portion of this work? If yes, list them and their scope.', category: 'Project Approach', required: true, fileUploadRequired: false, importance: 'Medium', responseType: 'Long answer' },
  { id: '13', question: 'What warranty do you provide on materials and workmanship?', category: 'Company Information', required: false, fileUploadRequired: false, importance: 'Medium', responseType: 'Short answer' },
  { id: '14', question: 'Describe your traffic control and site safety plan during construction.', category: 'Safety & Compliance', required: true, fileUploadRequired: false, importance: 'High', responseType: 'Long answer' },
  { id: '15', question: 'How will you handle stormwater and erosion control during earthwork?', category: 'Project Approach', required: true, fileUploadRequired: false, importance: 'Medium', responseType: 'Long answer' },
  { id: '16', question: 'Provide proof of bonding capacity if required per the SOW.', category: 'Company Information', required: false, fileUploadRequired: true, importance: 'Low', responseType: 'Document upload' },
  { id: '17', question: 'Is your company MBE, WBE, DBE, or other diversity-certified?', category: 'Company Information', required: false, fileUploadRequired: false, importance: 'Low', responseType: 'Select one or more options from a list' },
  { id: '18', question: 'What is your proposed payment schedule and retainage terms?', category: 'Project Approach', required: false, fileUploadRequired: false, importance: 'Medium', responseType: 'Long answer' },
  { id: '19', question: 'Describe your change order process and typical turnaround for pricing changes.', category: 'Project Approach', required: false, fileUploadRequired: false, importance: 'Low', responseType: 'Short answer' },
  { id: '20', question: 'How do you ensure compliance with local permit and inspection requirements?', category: 'Safety & Compliance', required: true, fileUploadRequired: false, importance: 'High', responseType: 'Long answer' },
]

// Demo vendor responses for Responses tab
type ResponseRow = {
  id: string
  vendor: string
  proposedCost: string | null
  status: 'SUBMITTED' | 'NOT RECEIVED'
  score: number | null
  lineItemsCount: number
  addedByVendor: number
  attachments: number | null
  submitted: string | null
}
const DEMO_RESPONSES: ResponseRow[] = [
  { id: '1', vendor: 'Drain Pros', proposedCost: '$24.8K', status: 'SUBMITTED', score: 98, lineItemsCount: 24, addedByVendor: 3, attachments: 12, submitted: 'Jan 1, 2026 14:30' },
  { id: '2', vendor: 'ACME Drainage', proposedCost: '$23.3K', status: 'SUBMITTED', score: 55, lineItemsCount: 21, addedByVendor: 0, attachments: 7, submitted: 'Jan 2, 2026 09:38' },
  { id: '3', vendor: 'Blue Star Contracting', proposedCost: null, status: 'NOT RECEIVED', score: null, lineItemsCount: 21, addedByVendor: 0, attachments: null, submitted: null },
]

// Demo vendor participation by event status (JSX vendorsByPhase-style)
type VendorParticipant = { id: string; name: string; status: string; compliance: 'green' | 'yellow' | 'red'; version: string; bidAmount: string; score: number | null; pick?: boolean }
function getDemoVendorsForStatus(status: string, bids: number): VendorParticipant[] {
  const draft = [
    { id: '1', name: 'Universal Contractors Inc.', status: 'Invited', compliance: 'green' as const, version: '—', bidAmount: '—', score: null },
    { id: '2', name: 'Summit HVAC', status: 'Invited', compliance: 'green' as const, version: '—', bidAmount: '—', score: null },
  ]
  const open = [
    { id: '1', name: 'Universal Contractors Inc.', status: 'Submitted', compliance: 'green' as const, version: 'V2', bidAmount: '$142,800', score: 92, pick: true },
    { id: '2', name: 'Summit HVAC', status: 'Viewed', compliance: 'green' as const, version: '—', bidAmount: '—', score: null },
    { id: '3', name: 'Precision Climate Co.', status: 'Invited', compliance: 'yellow' as const, version: '—', bidAmount: '—', score: null },
    { id: '4', name: 'ThermalPro Services', status: 'Submitted', compliance: 'green' as const, version: 'V1', bidAmount: '$165,900', score: 84 },
  ]
  const underReview = [
    { id: '1', name: 'Universal Contractors Inc.', status: 'Submitted', compliance: 'green' as const, version: 'V2', bidAmount: '$142,800', score: 92, pick: true },
    { id: '2', name: 'Summit HVAC', status: 'Submitted', compliance: 'green' as const, version: 'V2', bidAmount: '$156,200', score: 87 },
    { id: '3', name: 'Precision Climate Co.', status: 'Submitted', compliance: 'yellow' as const, version: 'V1', bidAmount: '$128,500', score: 78 },
    { id: '4', name: 'ThermalPro Services', status: 'Submitted', compliance: 'green' as const, version: 'V2', bidAmount: '$165,900', score: 84 },
  ]
  if (status === 'Draft' || status === 'Pending Approval' || status === 'Scheduled') return draft
  if (status === 'Open') return open
  if (status === 'Under Review' || status === 'Award Pending' || status === 'Awarded' || status === 'Contracting') return underReview
  return underReview
}

class DetailErrorBoundary extends Component<{ children: React.ReactNode }> {
  state = { hasError: false, error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <Stack gap="md" p="md">
          <Text fw={700} c="red">Something went wrong</Text>
          <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {this.state.error.message}
          </Text>
          <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {this.state.error.stack}
          </Text>
        </Stack>
      )
    }
    return this.props.children
  }
}

export function SpendEventDetail() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<SourcingEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string | null>('overview')

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    fetchSourcingEventById(eventId)
      .then(setEvent)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) {
    return (
      <DetailErrorBoundary>
        <Stack gap="md">
          <Skeleton height={40} width={300} />
          <Skeleton height={120} />
          <Skeleton height={80} />
        </Stack>
      </DetailErrorBoundary>
    )
  }

  if (error || !event) {
    return (
      <DetailErrorBoundary>
        <Stack gap="md">
          <Button variant="subtle" size="sm" onClick={() => navigate('/happy-spend/events')}>← Back to events</Button>
          <Text c="dimmed">{error ?? 'Event not found.'}</Text>
        </Stack>
      </DetailErrorBoundary>
    )
  }

  const status = event.status ?? ''
  const phase = event.phase ?? ''
  const eventType = event.type ?? ''
  const demoVendors = getDemoVendorsForStatus(status, event.bids ?? 0)
  const submittedCount = demoVendors.filter((v) => v.status === 'Submitted').length
  const isDraft = status === 'Draft' || status === 'Pending Approval' || status === 'Scheduled'
  const submittedVendors = demoVendors.filter((v) => v.status === 'Submitted')
  const budgetNum = event.budget ?? 0
  const approvedBudget = budgetNum > 0 ? Math.round(budgetNum * 0.97) : 0
  const adjustment = budgetNum > 0 ? approvedBudget - budgetNum : 0

  return (
    <DetailErrorBoundary>
      <Stack gap="lg">
        {/* Header: breadcrumb, title, status badge, ellipsis menu */}
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              RFx Management / {event.name}
            </Text>
            <Group gap="sm" align="center">
              <Text fw={700} style={{ fontSize: 24, lineHeight: 1.2 }}>
                {event.name}
              </Text>
              <Badge size="sm" variant="light" color="gray" leftSection={isDraft ? <HugeiconsIcon icon={PencilEdit01Icon} size={14} /> : undefined}>
                {status || 'Event'}
              </Badge>
            </Group>
          </Stack>
          <Menu position="bottom-end" withArrow>
            <Menu.Target>
              <Button variant="subtle" size="sm" p="xs">
                <HugeiconsIcon icon={MoreVerticalIcon} size={20} />
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => navigate('/happy-spend/events')}>Back to events</Menu.Item>
              <Menu.Item>Edit event</Menu.Item>
              <Menu.Item>Clone event</Menu.Item>
              <Menu.Divider />
              <Menu.Item c="red">Cancel event</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab} mt="xs">
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<HugeiconsIcon icon={ListViewIcon} size={18} />}>Overview</Tabs.Tab>
            <Tabs.Tab value="line-items" leftSection={<HugeiconsIcon icon={File02Icon} size={18} />}>Line Items</Tabs.Tab>
            <Tabs.Tab value="sow" leftSection={<HugeiconsIcon icon={File01Icon} size={18} />}>Scope of Work</Tabs.Tab>
            <Tabs.Tab value="questionnaire" leftSection={<HugeiconsIcon icon={File01Icon} size={18} />}>Questionnaire</Tabs.Tab>
            <Tabs.Tab value="responses" leftSection={<HugeiconsIcon icon={InboxIcon} size={18} />}>Responses ({event.bids})</Tabs.Tab>
            <Tabs.Tab value="activity">Activity</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="xl">
            <Grid gutter="xl">
              {/* Left column — 1/4 width: single cohesive section */}
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Paper
                  p={0}
                  withBorder
                  style={{
                    borderRadius: 'var(--mantine-radius-md)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--mantine-color-default-hover)',
                  }}
                >
                  <Box
                    component="img"
                    src={sourcingEventHero}
                    alt=""
                    style={{
                      width: '100%',
                      aspectRatio: '4/3',
                      objectFit: 'cover',
                      display: 'block',
                      verticalAlign: 'middle',
                    }}
                  />
                  <Box px="lg" pb="xl" pt="lg">
                    {/* JoyAI Summary — clear section with accent */}
                    <Box
                      py="md"
                      style={{
                        borderLeft: '3px solid var(--mantine-color-blue-5)',
                        paddingLeft: 14,
                      }}
                    >
                      <Text size="xs" tt="uppercase" fw={700} c="gray.7" mb={8} style={{ letterSpacing: '0.06em' }}>
                        JoyAI Summary
                      </Text>
                      <Text size="sm" lh={1.55} c="gray.7">
                        Configure SOW, add line items, and invite vendors before opening for bidding. Review line items and scope before publishing.
                      </Text>
                    </Box>

                    <Divider my="xl" color="var(--mantine-color-default-border)" />

                    {/* People & Vendors */}
                    <Group justify="space-between" align="center" mb="xs">
                      <Title order={4}>People &amp; Vendors</Title>
                      <Button variant="subtle" size="compact-xs" c="gray.7" fw={600}>Manage</Button>
                    </Group>
                    <Text size="xs" c="gray.6" fw={500} mb={6}>Internal team</Text>
                    <Group gap={8} mb="md">
                      <Avatar size="sm" radius="xl" color="violet">{event.created_by?.slice(0, 2).toUpperCase() ?? '—'}</Avatar>
                      <Avatar size="sm" radius="xl" color="gray">2</Avatar>
                      <Avatar size="sm" radius="xl" color="gray">3</Avatar>
                    </Group>
                    <Text size="xs" c="gray.6" fw={500} mb={6}>Invited vendors</Text>
                    <Group gap={8}>
                      <Avatar size="sm" radius="xl" color="gray">A</Avatar>
                      <Avatar size="sm" radius="xl" color="gray">B</Avatar>
                      <Avatar size="sm" radius="xl" color="gray">C</Avatar>
                      {demoVendors.length > 3 && (
                        <Text size="xs" c="gray.6" fw={500}>+{demoVendors.length - 3}</Text>
                      )}
                    </Group>

                    <Divider my="xl" color="var(--mantine-color-default-border)" />

                    {/* Key stats — label/value rows */}
                    <Stack gap="xs">
                      <Row label="Created" value={formatDate(event.created_date)} />
                      <Row label="Approved" value={formatDate(event.created_date)} />
                    </Stack>

                    <Divider my="xl" color="var(--mantine-color-default-border)" />

                    {/* Budget */}
                    <Stack gap="xs">
                      <Row label="Estimated budget" value={formatCurrency(event.budget)} />
                      <Row label="Approved budget" value={formatCurrency(approvedBudget)} />
                      <Row label="Adjustment" value={adjustment !== 0 ? (adjustment > 0 ? '+' : '') + formatCurrency(adjustment) : '—'} />
                    </Stack>

                    <Divider my="xl" color="var(--mantine-color-default-border)" />

                    {/* Linked project */}
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <Text size="sm" c="gray.6" fw={500}>Linked project</Text>
                      <Group gap={4} wrap="nowrap">
                        <Text size="sm" fw={600}>{event.project ?? '—'}</Text>
                        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                      </Group>
                    </Group>

                    <Divider my="xl" color="var(--mantine-color-default-border)" />

                    {/* Activity */}
                    <Text size="xs" tt="uppercase" fw={700} c="gray.7" mb="sm" style={{ letterSpacing: '0.06em' }}>
                      Activity
                    </Text>
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>O Alan — {formatDate(event.created_date)}</Text>
                      <Text size="sm" fw={500}>O Alan — {formatDate(event.updated_at)}</Text>
                    </Stack>
                    <Button variant="subtle" size="compact-xs" mt="sm" c="gray.7" fw={600} rightSection={<HugeiconsIcon icon={ArrowRight01Icon} size={12} />}>
                      See all activity
                    </Button>
                  </Box>
                </Paper>
              </Grid.Col>

              {/* Right column — 3/4 width */}
              <Grid.Col span={{ base: 12, md: 9 }}>
                <Stack gap="xl">
                  {/* Full width: Project timeline */}
                  <Paper p="xl" withBorder>
                    <Title order={4} mb={4}>Project timeline</Title>
                    <Text size="xs" c="gray.6" fw={500} mb="lg">Metadata</Text>
                    <Stepper size="xs" color="violet" active={status === 'Draft' ? 0 : status === 'Open' ? 1 : status === 'Under Review' ? 2 : status === 'Awarded' || status === 'Award Pending' ? 3 : 4}>
                      <Stepper.Step label="Draft" description={formatDate(event.created_date)} />
                      <Stepper.Step label="Open" description="Jan 2, 2026" />
                      <Stepper.Step label="For review" description="Jan 15, 2026" />
                      <Stepper.Step label="Awarded" description="Awaiting action" />
                      <Stepper.Step label="Complete" description="Awaiting action" />
                    </Stepper>
                  </Paper>

                  {/* 2-col row: Next steps (left) | Scoring (right) */}
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" verticalSpacing="xl">
                    <Paper p="xl" withBorder>
                      <Title order={4} mb="md">Next steps</Title>
                      {isDraft ? (
                        <>
                          <Text size="sm" c="gray.7" lh={1.55} mb="lg">
                            Please review these items before moving your RFx from Draft to Open.
                          </Text>
                          <SimpleGrid cols={2} spacing="md">
                            <Paper p="md" withBorder>Item #1</Paper>
                            <Paper p="md" withBorder>Item #2</Paper>
                            <Paper p="md" withBorder>Item #3</Paper>
                            <Paper p="md" withBorder>Item #4</Paper>
                          </SimpleGrid>
                          <Group gap="sm" mt="xl">
                            <Button variant="default" size="sm">Secondary</Button>
                            <Button variant="filled" color="violet" size="sm">Open RFx for bidding</Button>
                          </Group>
                        </>
                      ) : (
                        <Text size="sm" c="gray.7" lh={1.55}>
                          {status === 'Open' && 'Vendors can submit bids. Nudge non-responders or extend the deadline.'}
                          {status === 'Under Review' && 'Score responses, run the comparison matrix, and recommend an award.'}
                          {status === 'Award Pending' && 'Awaiting VP approval. Once approved, initiate contracting.'}
                          {status === 'Rejected' && 'Edit and resubmit for approval, or create a new event.'}
                          {['Awarded', 'Contracting', 'Completed'].includes(status) && 'Event complete. Clone to create a new event or view history.'}
                          {!['Draft', 'Open', 'Under Review', 'Award Pending', 'Rejected', 'Awarded', 'Contracting', 'Completed'].includes(status) && 'Review bids and move to the next phase.'}
                        </Text>
                      )}
                    </Paper>
                    <Paper p="xl" withBorder>
                      <Title order={4} mb="lg">Scoring</Title>
                      <Progress.Root size={32} radius="md" mb="xl" autoContrast styles={{ label: { fontSize: 'var(--mantine-font-size-sm)', fontWeight: 600 } }}>
                        <Progress.Section value={33} color="green">
                          <Progress.Label>33%</Progress.Label>
                        </Progress.Section>
                        <Progress.Section value={33} color="dark.9">
                          <Progress.Label>33%</Progress.Label>
                        </Progress.Section>
                        <Progress.Section value={34} color="purple">
                          <Progress.Label>34%</Progress.Label>
                        </Progress.Section>
                      </Progress.Root>
                      <SimpleGrid cols={3} spacing="md" mb="xl">
                        <Stack gap={4} align="flex-start">
                          <Text size="xs" tt="uppercase" c="gray.7" fw={600}>Pricing</Text>
                          <Text size="sm" fw={700} c="green.6">33%</Text>
                          <Box w="100%" h={3} style={{ borderRadius: 2, backgroundColor: 'var(--mantine-color-green-6)' }} />
                        </Stack>
                        <Stack gap={4} align="flex-start">
                          <Text size="xs" tt="uppercase" c="gray.7" fw={600}>Questionnaire</Text>
                          <Text size="sm" fw={700} c="dark.9">33%</Text>
                          <Box w="100%" h={3} style={{ borderRadius: 2, backgroundColor: 'var(--mantine-color-dark-9)' }} />
                        </Stack>
                        <Stack gap={4} align="flex-start">
                          <Text size="xs" tt="uppercase" c="gray.7" fw={600}>Strategic fit</Text>
                          <Text size="sm" fw={700} c="purple.6">34%</Text>
                          <Box w="100%" h={3} style={{ borderRadius: 2, backgroundColor: 'var(--mantine-color-purple-6)' }} />
                        </Stack>
                      </SimpleGrid>
                      <Button
                        variant="light"
                        color="violet"
                        size="sm"
                        leftSection={<HugeiconsIcon icon={SlidersHorizontalIcon} size={16} />}
                        styles={{ root: { border: '1px solid var(--mantine-color-violet-3)' } }}
                      >
                        Adjust scoring
                      </Button>
                    </Paper>
                  </SimpleGrid>

                  {/* 2-col row: Vendor participation (left) | Line items (right) */}
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" verticalSpacing="xl">
                    <Paper p="xl" withBorder>
                      <Title order={4} mb="lg">Vendor participation</Title>
                      <SimpleGrid cols={2} spacing="xl">
                        <Box>
                          <Text size="xs" tt="uppercase" c="gray.6" fw={600} mb={6}>Invited</Text>
                          <Text size="xl" fw={700} mb="sm">{demoVendors.length}</Text>
                          <Button size="sm" variant="light" leftSection={<HugeiconsIcon icon={UserMultipleIcon} size={16} />}>Manage invites</Button>
                        </Box>
                        <Box>
                          <Text size="xs" tt="uppercase" c="gray.6" fw={600} mb={6}>Responses</Text>
                          <Text size="xl" fw={700} mb="sm">{submittedCount}</Text>
                          <Button size="sm" variant="light" leftSection={<HugeiconsIcon icon={InboxIcon} size={16} />} onClick={() => setActiveTab('responses')}>View responses</Button>
                        </Box>
                      </SimpleGrid>
                    </Paper>
                    <Paper p="xl" withBorder>
                      <Group justify="space-between" align="center" mb="lg">
                        <Title order={4}>Line items</Title>
                        <Button variant="subtle" size="compact-sm" c="gray.7" fw={600} rightSection={<HugeiconsIcon icon={ArrowRight01Icon} size={14} />} onClick={() => setActiveTab('line-items')}>
                          See all
                        </Button>
                      </Group>
                      <Stack gap="md">
                        {DEMO_LINE_ITEMS.map((item, i) => (
                          <Text key={i} size="sm" fw={500} lh={1.4}>{item}</Text>
                        ))}
                      </Stack>
                    </Paper>
                  </SimpleGrid>
                </Stack>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

        <Tabs.Panel value="responses" pt="md">
          <ResponsesTabPanel eventBids={event.bids ?? 0} />
        </Tabs.Panel>

        <Tabs.Panel value="line-items" pt="md">
          <LineItemsTabPanel />
        </Tabs.Panel>
        <Tabs.Panel value="sow" pt="md">
          <ScopeOfWorkTabPanel />
        </Tabs.Panel>
        <Tabs.Panel value="questionnaire" pt="md">
          <QuestionnaireTabPanel />
        </Tabs.Panel>
        <Tabs.Panel value="activity" pt="md">
          <Paper p="md" withBorder>
            <Text size="sm" fw={700} mb="md">Activity</Text>
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm">O Alan — {formatDate(event.created_date)}</Text>
                <Text size="xs" c="dimmed">Event created</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">O Alan — {formatDate(event.updated_at)}</Text>
                <Text size="xs" c="dimmed">Last updated</Text>
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>
      </Stack>
    </DetailErrorBoundary>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Text size="sm" c="gray.6" fw={500}>{label}</Text>
      <Text size="sm" fw={600}>{value}</Text>
    </Group>
  )
}

// ─── Line Items Tab ──────────────────────────────────────────────────────────

function LineItemsTabPanel() {
  const totalBudget = 16435
  const columnDefs: ColDef<LineItemRow>[] = useMemo(
    () => [
      { field: 'itemName', headerName: 'Item Name', minWidth: 220, flex: 1 },
      { field: 'category', headerName: 'Category', minWidth: 100 },
      { field: 'assetLocation', headerName: 'Asset Location', minWidth: 140 },
      { field: 'costCode', headerName: 'Cost Code', minWidth: 100 },
      { field: 'glCode', headerName: 'GL Code', minWidth: 100 },
      {
        field: 'retainageEligible',
        headerName: 'Retainage Eligible',
        minWidth: 120,
        cellRenderer: RetainageCellRenderer,
      },
      { field: 'unitOfMeasure', headerName: 'Unit of Measure', minWidth: 110 },
      { field: 'quantity', headerName: 'Quantity', minWidth: 90, type: 'numericColumn' },
      {
        field: 'targetUnitPrice',
        headerName: 'Target Unit Price',
        minWidth: 120,
        cellClass: 'ag-right-aligned-cell',
      },
    ],
    []
  )

  return (
    <Stack gap="md">
      <Box>
        <Text size="xs" tt="uppercase" c="dimmed" fw={600} mb={4}>Total Target Budget</Text>
        <Text size="xl" fw={800} style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
          {formatCurrency(totalBudget)}
        </Text>
      </Box>
      <Group justify="space-between" align="center">
        <Text size="sm" fw={700}>Line Items</Text>
        <Button size="sm" leftSection={<HugeiconsIcon icon={Add01Icon} size={16} />}>+ Add New</Button>
      </Group>
      <Box className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
        <AgGridReact<LineItemRow>
          {...AG_GRID_DEFAULT_GRID_PROPS}
          defaultColDef={AG_GRID_DEFAULT_COL_DEF}
          columnDefs={columnDefs}
          rowData={DEMO_LINE_ITEMS_ROWS}
          rowSelection="multiple"
        />
      </Box>
    </Stack>
  )
}

function RetainageCellRenderer({ value }: ICellRendererParams<LineItemRow>) {
  if (value == null) return null
  return value ? (
    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: 'var(--mantine-color-green-6)' }} />
  ) : (
    <HugeiconsIcon icon={Cancel01Icon} size={14} style={{ color: 'var(--mantine-color-red-6)' }} />
  )
}

// ─── Scope of Work Tab ───────────────────────────────────────────────────────

function ScopeOfWorkTabPanel() {
  const [showBanner, setShowBanner] = useState(true)

  return (
    <Stack gap="md">
      {showBanner && (
        <Alert
          color="blue"
          variant="light"
          icon={<HugeiconsIcon icon={Alert02Icon} size={20} />}
          title="Auto-Generated Content"
          onClose={() => setShowBanner(false)}
          withCloseButton
        >
          The initial scope of work was generated using the project description and business objectives. You can edit it manually or re-generate it with AI when in edit mode.
        </Alert>
      )}
      <Group justify="space-between" align="center">
        <Title order={4}>Scope of Work</Title>
        <Button variant="subtle" size="sm" leftSection={<HugeiconsIcon icon={PencilEdit01Icon} size={16} />}>Edit</Button>
      </Group>
      <Paper p="lg" withBorder>
        <Text size="sm" fw={700} mb="xs">Project Overview</Text>
        <Text size="sm" c="dimmed" lh={1.6}>
          This project involves improving a designated portion of the dog park to enhance safety, usability, and long-term durability. The selected vendor will complete surfacing and drainage improvements within the small dog play zone. Work includes removal of existing materials, installation of engineered surfacing, minor grading, and ensuring proper drainage to prevent pooling after heavy rainfall. The goal is to upgrade this specific zone while minimizing disruption to the broader park operations.
        </Text>
        <Text size="sm" fw={700} mt="lg" mb="xs">Detailed Scope of Work</Text>
        <Stack gap="xs" component="ol" style={{ paddingLeft: 20, margin: 0 }}>
          <li>
            <Text size="sm" fw={600} component="span">Site Preparation</Text>
            <ul style={{ marginTop: 4, paddingLeft: 18 }}>
              <li><Text size="sm" c="dimmed" component="span">Conduct pre-construction walkthrough with property representative.</Text></li>
              <li><Text size="sm" c="dimmed" component="span">Establish staging area and ensure protection of adjacent amenities and landscaping.</Text></li>
              <li><Text size="sm" c="dimmed" component="span">Remove and dispose of existing play-area surfacing (mulch, debris, and deteriorated underlay).</Text></li>
              <li><Text size="sm" c="dimmed" component="span">Identify and flag existing utilities before subsurface work begins.</Text></li>
            </ul>
          </li>
          <li>
            <Text size="sm" fw={600} component="span">Surface & Subsurface Improvements</Text>
            <ul style={{ marginTop: 4, paddingLeft: 18 }}>
              <li><Text size="sm" c="dimmed" component="span">Grade and re-level the play area to ensure proper slope toward drainage points.</Text></li>
              <li><Text size="sm" c="dimmed" component="span">Install geotextile fabric over compacted soil base.</Text></li>
              <li><Text size="sm" c="dimmed" component="span">Position and secure French drain along the west perimeter.</Text></li>
              <li><Text size="sm" c="dimmed" component="span">Provide and install 4" perforated drain pipe with gravel bedding.</Text></li>
            </ul>
          </li>
          <li>
            <Text size="sm" fw={600} component="span">Surfacing Installation</Text>
            <ul style={{ marginTop: 4, paddingLeft: 18 }}>
              <li><Text size="sm" c="dimmed" component="span">Supply engineered wood fiber (EWF) surfacing meeting ASTM F1292 impact standards.</Text></li>
              <li><Text size="sm" c="dimmed" component="span">Apply material uniformly across the full designated square footage.</Text></li>
              <li><Text size="sm" c="dimmed" component="span">Compact surfacing to manufacturer-recommended depth and density.</Text></li>
            </ul>
          </li>
          <li>
            <Text size="sm" fw={600} component="span">Site Restoration & Cleanup</Text>
            <ul style={{ marginTop: 4, paddingLeft: 18 }}>
              <li><Text size="sm" c="dimmed" component="span">Remove all excess material, debris, and equipment from site.</Text></li>
              <li><Text size="sm" c="dimmed" component="span">Restore any minor damage to turf or adjacent fixtures caused by equipment movement.</Text></li>
              <li><Text size="sm" c="dimmed" component="span">Conduct final walkthrough to confirm cleanliness and readiness for public use.</Text></li>
            </ul>
          </li>
        </Stack>
        <Text size="sm" fw={700} mt="lg" mb="xs">Material Specifications</Text>
        <Stack gap="xs" component="ul" style={{ paddingLeft: 20, margin: 0 }}>
          <li><Text size="sm" c="dimmed" component="span">Engineered Wood Fiber (EWF): Must be IPEMA-certified and installed to minimum 9–12" compacted depth.</Text></li>
          <li><Text size="sm" c="dimmed" component="span">Geotextile Fabric: Non-woven stabilization fabric suitable for playground and high-traffic canine activity.</Text></li>
          <li><Text size="sm" c="dimmed" component="span">Drain Pipe: 4" perforated HDPE pipe with filter sock, set within washed gravel bedding.</Text></li>
        </Stack>
      </Paper>
    </Stack>
  )
}

// ─── Questionnaire Tab ───────────────────────────────────────────────────────

function RequiredCellRenderer({ value }: ICellRendererParams<QuestionRow>) {
  if (value == null) return null
  return value ? (
    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: 'var(--mantine-color-green-6)' }} />
  ) : (
    <HugeiconsIcon icon={Cancel01Icon} size={14} style={{ color: 'var(--mantine-color-red-6)' }} />
  )
}

function QuestionnaireTabPanel() {
  const columnDefs: ColDef<QuestionRow>[] = useMemo(
    () => [
      { field: 'question', headerName: 'Question', minWidth: 280, flex: 1 },
      { field: 'category', headerName: 'Category', minWidth: 160 },
      { field: 'required', headerName: 'Required Question?', minWidth: 120, cellRenderer: RequiredCellRenderer },
      { field: 'fileUploadRequired', headerName: 'File Upload Required?', minWidth: 140, cellRenderer: RequiredCellRenderer },
      { field: 'importance', headerName: 'Importance', minWidth: 110 },
      { field: 'responseType', headerName: 'Response Type', minWidth: 220 },
    ],
    []
  )

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={700}>Questions</Text>
        <Button size="sm" leftSection={<HugeiconsIcon icon={Add01Icon} size={16} />}>+ Add New</Button>
      </Group>
      <Box className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
        <AgGridReact<QuestionRow>
          {...AG_GRID_DEFAULT_GRID_PROPS}
          defaultColDef={AG_GRID_DEFAULT_COL_DEF}
          columnDefs={columnDefs}
          rowData={DEMO_QUESTIONS}
          rowSelection="multiple"
        />
      </Box>
    </Stack>
  )
}

// ─── Responses Tab ───────────────────────────────────────────────────────────

function StatusPillCellRenderer({ value }: ICellRendererParams<ResponseRow>) {
  if (!value) return null
  const color = value === 'SUBMITTED' ? 'violet' : 'gray'
  return <Badge size="sm" color={color} variant="light">{value}</Badge>
}

function ScoreCellRenderer({ value, data }: ICellRendererParams<ResponseRow>) {
  if (value == null || data?.status === 'NOT RECEIVED') return <Text size="sm" c="dimmed">—</Text>
  const color = value >= 90 ? 'green' : value >= 70 ? 'blue' : 'orange'
  return <Text size="sm" fw={600} c={color}>{value}/100</Text>
}

function LineItemsCellRenderer({ data }: ICellRendererParams<ResponseRow>) {
  if (!data) return null
  const { lineItemsCount, addedByVendor } = data
  return (
    <Group gap={6} wrap="nowrap">
      <Text size="sm">{lineItemsCount}</Text>
      {addedByVendor > 0 && (
        <Badge size="xs" color="violet" variant="light">{addedByVendor} ADDED BY VENDOR</Badge>
      )}
    </Group>
  )
}

function ResponsesTabPanel({ eventBids }: { eventBids: number }) {
  const columnDefs: ColDef<ResponseRow>[] = useMemo(
    () => [
      { field: 'vendor', headerName: 'Vendor', minWidth: 180, flex: 1 },
      {
        field: 'proposedCost',
        headerName: 'Proposed Cost',
        minWidth: 120,
        valueFormatter: (p) => p.value ?? '—',
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 120,
        cellRenderer: StatusPillCellRenderer,
      },
      {
        field: 'score',
        headerName: 'Score',
        minWidth: 100,
        cellRenderer: ScoreCellRenderer,
      },
      {
        field: 'lineItemsCount',
        headerName: 'Line Items',
        minWidth: 140,
        cellRenderer: LineItemsCellRenderer,
      },
      {
        field: 'attachments',
        headerName: 'Attachments',
        minWidth: 110,
        valueFormatter: (p) => (p.value != null ? String(p.value) : '—'),
      },
      {
        field: 'submitted',
        headerName: 'Submitted',
        minWidth: 150,
        valueFormatter: (p) => p.value ?? '—',
      },
    ],
    []
  )

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {eventBids === 0
          ? 'No bids received yet. Invite vendors and they will appear here when they submit responses.'
          : `${eventBids} bid${eventBids === 1 ? '' : 's'} received. Compare and score responses to shortlist or award.`}
      </Text>
      <Group gap="xs">
        <Select size="xs" placeholder="Show" data={['All columns', 'Essential']} style={{ width: 140 }} />
        <Select size="xs" placeholder="Filter" data={['All vendors', 'Submitted only']} style={{ width: 150 }} />
      </Group>
      <Box className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
        <AgGridReact<ResponseRow>
          {...AG_GRID_DEFAULT_GRID_PROPS}
          defaultColDef={AG_GRID_DEFAULT_COL_DEF}
          columnDefs={columnDefs}
          rowData={DEMO_RESPONSES}
          rowSelection="multiple"
        />
      </Box>
      <Button variant="light" size="sm">View comparison</Button>
    </Stack>
  )
}
