import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Timeline,
  UnstyledButton,
} from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowRight01Icon, DocumentValidationIcon, File02Icon, Shield01Icon } from '@hugeicons/core-free-icons'
import { useInsightsPropertySelection } from '../contexts/InsightsPropertyContext'
import { supabaseMetrics } from '../lib/supabaseMetrics'
import { UnavailableOutline } from '../theme/components/UnavailableOutline'
import { InsightsPageShell } from './InsightsPageShell'

type DocType = 'Policy' | 'Contract' | 'Template'
type ChangeKind = 'Modified' | 'Removed' | 'Added' | 'Clarified'

type DemoDoc = {
  id: string
  type: DocType
  title: string
  subtitle: string
  riskLabel: string | null
  riskCount: number
  changeCount: number
}

type DemoChange = {
  id: string
  kind: ChangeKind
  label: string
  detail: string
  page: number
}

function moneyRangeLabel(beforeUsd: number, afterUsd: number) {
  const f = (v: number) => `$${Math.round(v / 1000)}k`
  return `${f(beforeUsd)} → ${f(afterUsd)}`
}

function ChangeKindBadge({ kind }: { kind: ChangeKind }) {
  const cfg =
    kind === 'Modified'
      ? { color: 'blue' as const, label: 'MODIFIED' }
      : kind === 'Removed'
        ? { color: 'red' as const, label: 'REMOVED' }
        : kind === 'Added'
          ? { color: 'green' as const, label: 'ADDED' }
          : { color: 'gray' as const, label: 'CLARIFIED' }
  return (
    <Badge size="xs" variant="light" color={cfg.color} radius="sm">
      {cfg.label}
    </Badge>
  )
}

function InlineDiffToken({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: 'good' | 'bad' | 'warn' | 'info'
}) {
  const accent =
    tone === 'good'
      ? 'var(--mantine-color-success-6)'
      : tone === 'bad'
        ? 'var(--mantine-color-danger-6)'
        : tone === 'warn'
          ? 'var(--mantine-color-warning-6)'
          : 'var(--mantine-color-gray-6)'

  return (
    <Box
      component="span"
      px={6}
      py={2}
      style={{
        borderRadius: 6,
        display: 'inline-block',
        lineHeight: 1.35,
        background: `color-mix(in oklab, ${accent} 18%, transparent)`,
        border: `1px solid color-mix(in oklab, ${accent} 40%, transparent)`,
        color: 'var(--mantine-color-text)',
        fontWeight: 700,
      }}
    >
      {children}
    </Box>
  )
}

export function HpmDocumentsPage() {
  const { selectedPropertyIds } = useInsightsPropertySelection()
  const [propertyName, setPropertyName] = useState<string | null>(null)
  const unavailable = true // document analysis is demo data for now

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const pid = selectedPropertyIds[0]
      if (!pid) {
        if (mounted) setPropertyName(null)
        return
      }
      try {
        const { data, error } = await supabaseMetrics.from('properties').select('name').eq('property_id', pid).single()
        if (error) throw error
        if (mounted) setPropertyName((data?.name as string | null) ?? null)
      } catch {
        if (mounted) setPropertyName(null)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [selectedPropertyIds])

  const docs: DemoDoc[] = useMemo(
    () => [
      {
        id: 'doc-policy',
        type: 'Policy',
        title: 'Property Insurance Policy',
        subtitle: 'Nationwide Ins.',
        riskLabel: 'Missing Clauses',
        riskCount: 1,
        changeCount: 8,
      },
      {
        id: 'doc-contract',
        type: 'Contract',
        title: 'Vendor SLA Agreement',
        subtitle: 'ServiceMaster',
        riskLabel: 'SLA weakened',
        riskCount: 1,
        changeCount: 4,
      },
      {
        id: 'doc-template',
        type: 'Template',
        title: 'Lease Amendment Template',
        subtitle: 'Legal Ops',
        riskLabel: 'Minor updates',
        riskCount: 0,
        changeCount: 2,
      },
    ],
    []
  )

  const [filter, setFilter] = useState<'High Risk (3)' | 'All Docs'>('High Risk (3)')
  const [search, setSearch] = useState('')
  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = docs
    if (filter.startsWith('High Risk')) list = list.filter((d) => d.riskCount > 0)
    if (q) list = list.filter((d) => (d.title + ' ' + d.subtitle).toLowerCase().includes(q))
    return list
  }, [docs, filter, search])

  const [selectedDocId, setSelectedDocId] = useState(docs[0]?.id ?? 'doc-policy')
  const selectedDoc = useMemo(() => docs.find((d) => d.id === selectedDocId) ?? docs[0], [docs, selectedDocId])

  const changes: DemoChange[] = useMemo(() => {
    if (selectedDoc?.id !== 'doc-policy') {
      return [
        {
          id: 'chg-1',
          kind: 'Modified',
          label: 'Response time',
          detail: 'Vendor response window tightened from 72h to 48h.',
          page: 2,
        },
        {
          id: 'chg-2',
          kind: 'Clarified',
          label: 'Escalation path',
          detail: 'Added escalation contacts for after-hours incidents.',
          page: 3,
        },
        {
          id: 'chg-3',
          kind: 'Added',
          label: 'Reporting cadence',
          detail: 'Weekly completion summary required for make-ready work.',
          page: 4,
        },
      ]
    }

    return [
      {
        id: 'chg-terms',
        kind: 'Modified',
        label: 'Coverage terms',
        detail: `Deductible increased from $10k to $25k.`,
        page: 1,
      },
      {
        id: 'chg-notice',
        kind: 'Modified',
        label: 'Notice period',
        detail: `Notice period reduced from 60 to 30 days.`,
        page: 1,
      },
      {
        id: 'chg-flood',
        kind: 'Removed',
        label: 'Flood coverage',
        detail: `Flood damage clause removed.`,
        page: 2,
      },
      {
        id: 'chg-factor',
        kind: 'Added',
        label: 'Premium calculation',
        detail: `New adjustment factor for claims history added.`,
        page: 2,
      },
      {
        id: 'chg-cancel',
        kind: 'Modified',
        label: 'Cancellation',
        detail: `Early termination fee structure updated.`,
        page: 3,
      },
      {
        id: 'chg-liability',
        kind: 'Clarified',
        label: 'Liability limits',
        detail: `Language clarification; no material change.`,
        page: 1,
      },
    ]
  }, [selectedDoc?.id])

  const keyTerms = useMemo(() => {
    if (selectedDoc?.id !== 'doc-policy') return []
    return [
      { label: 'Deductible', value: moneyRangeLabel(10_000, 25_000), tone: 'warn' as const },
      { label: 'Notice period', value: '60 days → 30 days', tone: 'bad' as const },
      { label: 'Premium', value: '$42k/yr', tone: 'info' as const },
      { label: 'Coverage limit', value: '$5M', tone: 'info' as const },
    ]
  }, [selectedDoc?.id])

  const leftIcon =
    selectedDoc?.type === 'Policy'
      ? Shield01Icon
      : selectedDoc?.type === 'Contract'
        ? DocumentValidationIcon
        : File02Icon

  return (
    <InsightsPageShell title="Documents" hideHeaderFilters>
      <Stack gap="lg">
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 260px) minmax(0, 1fr) minmax(0, 1fr) minmax(260px, 320px)',
            gap: 16,
          }}
        >
          {/* Navigator (left) */}
          <Paper withBorder radius="lg" p="md">
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Text fw={900}>Document Navigator</Text>
                  {propertyName ? (
                    <Text size="xs" c="dimmed">
                      Reviewing changes for <Text component="span" fw={700}>{propertyName}</Text>
                    </Text>
                  ) : (
                    <Text size="xs" c="dimmed">
                      Review change sets across your selected properties.
                    </Text>
                  )}
                </Stack>
              </Group>

              <TextInput placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.currentTarget.value)} />

              <SegmentedControl
                value={filter}
                onChange={(v) => setFilter(v as typeof filter)}
                data={[{ label: 'High Risk (3)', value: 'High Risk (3)' }, { label: 'All Docs', value: 'All Docs' }]}
                fullWidth
              />

              <Stack gap="xs" mt={4}>
                {filteredDocs.map((d) => {
                  const selected = d.id === selectedDocId
                  return (
                    <UnstyledButton key={d.id} onClick={() => setSelectedDocId(d.id)} style={{ textAlign: 'left' }}>
                      <UnavailableOutline unavailable={unavailable} radius={16}>
                        <Paper
                          withBorder
                          radius="lg"
                          p="sm"
                          style={{
                            borderColor: selected ? 'var(--mantine-color-purple-5)' : 'var(--mantine-color-default-border)',
                            background: selected ? 'var(--mantine-color-purple-light)' : undefined,
                          }}
                        >
                          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                            <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                              <Group gap={8} wrap="nowrap">
                                <Badge size="xs" variant="light" color="gray" radius="sm">
                                  {d.type.toUpperCase()}
                                </Badge>
                                {d.riskLabel ? (
                                  <Badge size="xs" variant="light" color="red" radius="sm">
                                    {d.riskLabel}
                                  </Badge>
                                ) : null}
                              </Group>
                              <Text fw={900} size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {d.title}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {d.subtitle} · {d.changeCount} changes
                              </Text>
                            </Stack>
                            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                          </Group>
                        </Paper>
                      </UnavailableOutline>
                    </UnstyledButton>
                  )
                })}

                {filteredDocs.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No documents match your filters.
                  </Text>
                ) : null}
              </Stack>
            </Stack>
          </Paper>

          {/* Before (middle-left) */}
          <Paper withBorder radius="lg" p="md">
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Group gap={8} wrap="nowrap">
                    <HugeiconsIcon icon={leftIcon} size={18} />
                    <Text fw={900} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Previous Version (2024)
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    v1.4 · Baseline terms
                  </Text>
                </Stack>
                <Group gap={8} wrap="nowrap">
                  {keyTerms.length ? (
                    <Badge size="xs" variant="light" color="gray">
                      Key terms
                    </Badge>
                  ) : null}
                </Group>
              </Group>

              {keyTerms.length ? (
                <SimpleGrid cols={2} spacing="xs">
                  {keyTerms.map((t) => (
                    <Paper key={t.label} withBorder radius="md" p="xs">
                      <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                        {t.label}
                      </Text>
                      <Text size="sm" fw={900}>
                        {t.value}
                      </Text>
                    </Paper>
                  ))}
                </SimpleGrid>
              ) : null}

              <Divider />

              <Stack gap="md">
                <Stack gap={6}>
                  <Text fw={900} size="sm">
                    Section 3.2 – Coverage Terms
                  </Text>
                  <Text size="sm" lh={1.55}>
                    The insured shall be responsible for a deductible of{' '}
                    <InlineDiffToken tone="info">$10,000</InlineDiffToken> per occurrence.
                  </Text>
                </Stack>

                <Stack gap={6}>
                  <Text fw={900} size="sm">
                    Section 4.1 – Notice Period
                  </Text>
                  <Text size="sm" lh={1.55}>
                    The insured must provide written notice of cancellation at least{' '}
                    <InlineDiffToken tone="info">60 days</InlineDiffToken> prior to the effective date.
                  </Text>
                </Stack>

                <Stack gap={6}>
                  <Text fw={900} size="sm">
                    Section 5.3 – Flood Coverage
                  </Text>
                  <Text size="sm" lh={1.55}>
                    This policy includes comprehensive flood damage coverage up to the stated limits, subject to the standard deductible.
                  </Text>
                </Stack>

                <Stack gap={6}>
                  <Text fw={900} size="sm">
                    Section 6.2 – Liability Limits
                  </Text>
                  <Text size="sm" lh={1.55}>
                    The maximum liability under this policy shall not exceed $5,000,000 per occurrence.
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          {/* After (middle-right) */}
          <Paper withBorder radius="lg" p="md">
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Group gap={8} wrap="nowrap">
                    <HugeiconsIcon icon={leftIcon} size={18} />
                    <Text fw={900} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Current Version (2025)
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    v2.0 · Proposed renewal terms
                  </Text>
                </Stack>
                <Group gap={8} wrap="nowrap">
                  <Badge size="xs" variant="light" color="purple">
                    8 changes detected
                  </Badge>
                </Group>
              </Group>

              {keyTerms.length ? (
                <SimpleGrid cols={2} spacing="xs">
                  {keyTerms.map((t) => (
                    <Paper key={t.label} withBorder radius="md" p="xs">
                      <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                        {t.label}
                      </Text>
                      <Text size="sm" fw={900}>
                        {t.value}
                      </Text>
                    </Paper>
                  ))}
                </SimpleGrid>
              ) : null}

              <Divider />

              <Stack gap="md">
                <Stack gap={6}>
                  <Text fw={900} size="sm">
                    Section 3.2 – Coverage Terms
                  </Text>
                  <Text size="sm" lh={1.55}>
                    The insured shall be responsible for a deductible of{' '}
                    <InlineDiffToken tone="warn">$25,000</InlineDiffToken> per occurrence.
                  </Text>
                </Stack>

                <Stack gap={6}>
                  <Text fw={900} size="sm">
                    Section 4.1 – Notice Period
                  </Text>
                  <Text size="sm" lh={1.55}>
                    The insured must provide written notice of cancellation at least{' '}
                    <InlineDiffToken tone="bad">30 days</InlineDiffToken> prior to the effective date.
                  </Text>
                </Stack>

                <Stack gap={6}>
                  <Text fw={900} size="sm">
                    Section 5.3 – Flood Coverage
                  </Text>
                  <Text size="sm" lh={1.55}>
                    <InlineDiffToken tone="bad">[Section removed in 2025 renewal]</InlineDiffToken>
                  </Text>
                </Stack>

                <Stack gap={6}>
                  <Text fw={900} size="sm">
                    Section 6.2 – Liability Limits
                  </Text>
                  <Text size="sm" lh={1.55}>
                    The maximum liability under this policy shall not exceed $5,000,000 per occurrence,{' '}
                    <InlineDiffToken tone="good">and shall be subject to annual review and adjustment based on portfolio risk profile</InlineDiffToken>.
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          {/* Change timeline (right) */}
          <Paper withBorder radius="lg" p="md">
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text fw={900}>Change Navigator</Text>
                  <Text size="xs" c="dimmed">
                    {changes.length} changes detected
                  </Text>
                </Stack>
              </Group>

              <Timeline active={0} bulletSize={22} lineWidth={2}>
                {changes.map((c) => {
                  const color = c.kind === 'Removed' ? 'red' : c.kind === 'Added' ? 'green' : c.kind === 'Modified' ? 'blue' : 'gray'
                  return (
                    <Timeline.Item
                      key={c.id}
                      title={
                        <Group gap={8} wrap="nowrap" align="center">
                          <Text size="sm" fw={900}>
                            {c.label}
                          </Text>
                          <ChangeKindBadge kind={c.kind} />
                        </Group>
                      }
                      color={color}
                    >
                      <Text size="xs" c="dimmed" lh={1.5}>
                        {c.detail}
                      </Text>
                      <Text size="xs" c="dimmed" mt={4}>
                        Page {c.page}
                      </Text>
                    </Timeline.Item>
                  )
                })}
              </Timeline>
            </Stack>
          </Paper>
        </Box>

        {/* Bottom impact summary */}
        <Paper withBorder radius="lg" p="lg" style={{ borderColor: 'var(--mantine-color-purple-3)' }}>
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Group gap="sm" align="center">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'var(--mantine-color-purple-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HugeiconsIcon icon={Alert02Icon} size={18} />
              </Box>
              <Stack gap={0}>
                <Text fw={900}>Why This Matters</Text>
                <Text size="xs" c="dimmed">
                  AI-powered impact analysis (demo)
                </Text>
              </Stack>
            </Group>
            <Badge variant="light" color="purple" radius="xl">
              Confidence: 92%
            </Badge>
          </Group>

          <Divider my="md" />

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            <Stack gap={6}>
              <Group gap="sm" align="center">
                <HugeiconsIcon icon={Shield01Icon} size={18} />
                <Text fw={900} size="sm">
                  Financial Exposure Increased
                </Text>
              </Group>
              <Text size="sm" lh={1.55}>
                The deductible increase from <InlineDiffToken tone="warn">$10k</InlineDiffToken> to{' '}
                <InlineDiffToken tone="warn">$25k</InlineDiffToken> raises per-incident exposure by $15,000. Based on
                historical incidents, this can materially increase annual risk.
              </Text>
            </Stack>

            <Stack gap={6}>
              <Group gap="sm" align="center">
                <HugeiconsIcon icon={DocumentValidationIcon} size={18} />
                <Text fw={900} size="sm">
                  Reduced Flexibility on Cancellation
                </Text>
              </Group>
              <Text size="sm" lh={1.55}>
                Notice period reduction from <InlineDiffToken tone="bad">60</InlineDiffToken> to{' '}
                <InlineDiffToken tone="bad">30</InlineDiffToken> days limits your ability to shop for better rates or respond
                to market changes mid-term.
              </Text>
            </Stack>

            <Stack gap={6}>
              <Group gap="sm" align="center">
                <HugeiconsIcon icon={File02Icon} size={18} />
                <Text fw={900} size="sm">
                  Coverage Gap Introduced
                </Text>
              </Group>
              <Text size="sm" lh={1.55}>
                Flood coverage language was removed. Properties in flood zones may now have zero coverage for this risk
                category unless endorsements are added.
              </Text>
            </Stack>
          </SimpleGrid>

          <Group justify="flex-end" mt="lg" gap="sm" wrap="wrap">
            <Button variant="default">Flag for review</Button>
            <Button color="red" variant="filled">
              Reject &amp; escalate
            </Button>
            <Button color="green" variant="filled">
              Approve changes
            </Button>
          </Group>
        </Paper>
      </Stack>
    </InsightsPageShell>
  )
}
