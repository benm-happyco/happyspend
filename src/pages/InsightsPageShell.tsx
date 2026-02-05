import { useEffect, useMemo, useState } from 'react'
import { Box, Group, MultiSelect, Stack, Switch, Text } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import '@mantine/dates/styles.css'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { HpyAppIcon } from '../theme/components/HpyAppIcon'
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
  children?: React.ReactNode
}

export function InsightsPageShell({ title, children }: InsightsPageShellProps) {
  const appNavOverride = useMemo(() => PORTFOLIO_APP_NAV, [])
  const { selectedPropertyIds, setSelectedPropertyIds, dateRange, setDateRange } = useInsightsPropertySelection()
  const { highlightUnavailable, setHighlightUnavailable } = useUnavailableHighlight()
  const [propertyOptions, setPropertyOptions] = useState<{ value: string; label: string }[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)

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

  const multiSelectData = useMemo(() => {
    if (loadingProperties && selectedPropertyIds.length > 0) {
      return selectedPropertyIds.map((id) => ({ value: id, label: '…' }))
    }
    return propertyOptions
  }, [loadingProperties, selectedPropertyIds, propertyOptions])

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
                <Group align="flex-end" gap="md" wrap="wrap">
                  <Box style={{ minWidth: 280, maxWidth: 480 }}>
                    <MultiSelect
                      placeholder={loadingProperties ? 'Loading properties...' : 'Select properties'}
                      data={multiSelectData}
                      value={selectedPropertyIds}
                      onChange={setSelectedPropertyIds}
                      searchable
                      clearable
                      hidePickedOptions
                    />
                  </Box>
                  <DateInput
                    label="From"
                    value={parseDateValue(dateRange.startDate)}
                    onChange={(value) => setDateRange((prev) => ({ ...prev, startDate: formatDateValue(value) }))}
                    maxDate={parseDateValue(dateRange.endDate) ?? undefined}
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
                    value={parseDateValue(dateRange.endDate)}
                    onChange={(value) => setDateRange((prev) => ({ ...prev, endDate: formatDateValue(value) }))}
                    minDate={parseDateValue(dateRange.startDate) ?? undefined}
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
                </Group>
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
