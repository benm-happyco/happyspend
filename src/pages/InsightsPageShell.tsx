import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Group, Stack, Switch, Text } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import '@mantine/dates/styles.css'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { HpyAppIcon } from '../theme/components/HpyAppIcon'
import { PropertyPicker } from '../theme/components/PropertyPicker'
import { useInsightsPropertySelection } from '../contexts/InsightsPropertyContext'
import { useUnavailableHighlight } from '../contexts/UnavailableHighlightContext'
import { supabaseMetrics } from '../lib/supabaseMetrics'
import { PORTFOLIO_APP_NAV } from './portfolioInsightsNav'

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

type InsightsPageShellProps = {
  title: string
  hideHeaderFilters?: boolean
  children?: React.ReactNode
}

export function InsightsPageShell({ title, hideHeaderFilters, children }: InsightsPageShellProps) {
  const appNavOverride = useMemo(() => PORTFOLIO_APP_NAV, [])
  const { selectedPropertyIds, setSelectedPropertyIds, dateRange, setDateRange } = useInsightsPropertySelection()
  const { highlightUnavailable, setHighlightUnavailable } = useUnavailableHighlight()
  const [propertyOptions, setPropertyOptions] = useState<{ value: string; label: string }[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const MAX_SELECTED_PROPERTIES = 25
  const [draftPropertyIds, setDraftPropertyIds] = useState<string[]>(selectedPropertyIds)
  const [draftDateRange, setDraftDateRange] = useState(dateRange)
  const [draftTouched, setDraftTouched] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabaseMetrics
          .from('properties')
          .select('property_id, name')
          .order('name')
        if (error) throw error
        if (!mounted) return
        const list = data ?? []
        setPropertyOptions(
          list.map((p) => ({
            value: p.property_id,
            label: p.name ?? 'Unknown property',
          }))
        )
      } catch {
        if (mounted) setPropertyOptions([])
      } finally {
        if (mounted) setLoadingProperties(false)
      }
    }
    fetchProperties()
    return () => {
      mounted = false
    }
  }, [])

  const pickerOptions = useMemo(() => {
    if (!loadingProperties || draftPropertyIds.length === 0) return propertyOptions
    // While options are loading, include placeholders for any preselected ids
    // so users can still see/toggle them.
    const seen = new Set<string>()
    const merged: { value: string; label: string }[] = []
    for (const id of draftPropertyIds) {
      const v = String(id ?? '').trim()
      if (!v || seen.has(v)) continue
      seen.add(v)
      merged.push({ value: v, label: '…' })
    }
    for (const o of propertyOptions) {
      if (!o.value || seen.has(o.value)) continue
      seen.add(o.value)
      merged.push(o)
    }
    return merged
  }, [loadingProperties, draftPropertyIds, propertyOptions])

  const safeDatePopoverProps = useMemo(
    () => ({
      withinPortal: false,
      position: 'bottom-start' as const,
      middlewares: { flip: false, shift: false },
    }),
    []
  )

  const idsKey = useMemo(() => (ids: string[]) => ids.join('\u0000'), [])
  const isDraftDirty = useMemo(() => {
    return (
      idsKey(draftPropertyIds) !== idsKey(selectedPropertyIds) ||
      draftDateRange.startDate !== dateRange.startDate ||
      draftDateRange.endDate !== dateRange.endDate
    )
  }, [draftPropertyIds, selectedPropertyIds, draftDateRange.startDate, draftDateRange.endDate, dateRange.startDate, dateRange.endDate, idsKey])

  useEffect(() => {
    // Keep draft in sync with applied filters unless the user has started editing.
    if (draftTouched && isDraftDirty) return
    setDraftPropertyIds(selectedPropertyIds)
    setDraftDateRange(dateRange)
    setDraftTouched(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPropertyIds, dateRange.startDate, dateRange.endDate])

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
                hideHeaderFilters ? null : (
                <Group align="flex-end" gap="md" wrap="wrap">
                  <PropertyPicker
                    options={pickerOptions}
                    value={draftPropertyIds}
                    onChange={(next) => {
                      setDraftTouched(true)
                      setDraftPropertyIds(next.slice(0, MAX_SELECTED_PROPERTIES))
                    }}
                    loading={loadingProperties}
                    maxSelected={MAX_SELECTED_PROPERTIES}
                    label="Properties"
                  />
                  <DateInput
                    label="From"
                    value={parseDateValue(draftDateRange.startDate)}
                    onChange={(value) => {
                      setDraftTouched(true)
                      setDraftDateRange((prev) => ({ ...prev, startDate: formatDateValue(value) }))
                    }}
                    maxDate={parseDateValue(draftDateRange.endDate) ?? undefined}
                    popoverProps={safeDatePopoverProps}
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
                    onChange={(value) => {
                      setDraftTouched(true)
                      setDraftDateRange((prev) => ({ ...prev, endDate: formatDateValue(value) }))
                    }}
                    minDate={parseDateValue(draftDateRange.startDate) ?? undefined}
                    popoverProps={safeDatePopoverProps}
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
                      setSelectedPropertyIds(draftPropertyIds.slice(0, MAX_SELECTED_PROPERTIES))
                      setDateRange(draftDateRange)
                      setDraftTouched(false)
                    }}
                  >
                    Apply
                  </Button>
                </Group>
                )
              }
            />
            {children}
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
