import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, Group, Paper, Stack, Switch, Text, TextInput } from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Alert02Icon } from '@hugeicons/core-free-icons'
import { supabaseMetrics } from '../lib/supabaseMetrics'
import { HpyRegionWatchMap, type RegionWatchLayers, type RegionWatchProperty } from '../theme/components/HpyRegionWatchMap'
import { InsightsPageShell } from './InsightsPageShell'

type HazardType = 'Weather' | 'Regulation' | 'Flood' | 'Crime'
type Severity = 'critical' | 'warning'

type HazardItem = {
  id: string
  propertyId: string
  type: HazardType
  severity: Severity
  title: string
  summary: string
  regionLabel: string
  exposureUnits: number
  timingLabel: string
  ctaLabel: string
  aiConfidencePct: number
  assignedLabel: string
}

function hashToUnitFloat(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // eslint-disable-next-line no-bitwise
  return ((h >>> 0) % 1_000_000) / 1_000_000
}

function seededRange(seed: string, min: number, max: number): number {
  const t = hashToUnitFloat(seed)
  return min + t * (max - min)
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function HpmRegionWatchPage() {
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<RegionWatchProperty[]>([])
  const [focusedPropertyId, setFocusedPropertyId] = useState<string | null>(null)

  const [layers, setLayers] = useState<RegionWatchLayers>({
    weather: true,
    flood: true,
    crime: false,
  })

  const [riskSearch, setRiskSearch] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabaseMetrics
          .from('properties')
          .select('property_id, name, street, city, state, postal_code, unit_count, market, latitude, longitude')
          .order('name')
        if (error) throw error
        if (!mounted) return
        setProperties((data ?? []) as RegionWatchProperty[])
      } catch {
        if (mounted) setProperties([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    return () => {
      mounted = false
    }
  }, [])

  const onGeocoded = useCallback(async (args: { propertyId: string; latitude: number; longitude: number }) => {
    try {
      await supabaseMetrics
        .from('properties')
        .update({ latitude: args.latitude, longitude: args.longitude })
        .eq('property_id', args.propertyId)
    } catch {
      // ignore (demo)
    }
  }, [])

  const hazards = useMemo(() => {
    const out: HazardItem[] = []
    const visibleTypes = new Set<HazardType>([
      ...(layers.weather ? (['Weather'] as const) : []),
      ...(layers.flood ? (['Flood'] as const) : []),
      ...(layers.crime ? (['Crime'] as const) : []),
      'Regulation',
    ])

    for (const p of properties) {
      const units = p.unit_count ?? Math.round(seededRange(`units:${p.property_id}`, 60, 420))
      const city = p.city ?? 'Metro'
      const regionLabel = `${city} ${p.market ? `${p.market}` : ''}`.trim()

      const weatherRoll = hashToUnitFloat(`wx:${p.property_id}`)
      const floodRoll = hashToUnitFloat(`fl:${p.property_id}`)
      const crimeRoll = hashToUnitFloat(`cr:${p.property_id}`)
      const regRoll = hashToUnitFloat(`rg:${p.property_id}`)

      if (visibleTypes.has('Weather') && weatherRoll > 0.55) {
        const critical = weatherRoll > 0.82
        out.push({
          id: `haz-wx-${p.property_id}`,
          propertyId: p.property_id,
          type: 'Weather',
          severity: critical ? 'critical' : 'warning',
          title: critical ? 'Severe Storm Warning' : 'High Wind Advisory',
          summary: critical
            ? 'High wind & hail risk with potential roof damage.'
            : 'Gusts expected; secure loose items and inspect common areas.',
          regionLabel,
          exposureUnits: Math.round(units * seededRange(`wxexp:${p.property_id}`, 0.35, 0.9)),
          timingLabel: critical ? 'Active now · expires 6:00pm' : 'Starts Thu 2am · 24hr window',
          ctaLabel: critical ? 'Launch Storm Prep Protocol' : 'Launch Weather Checklist',
          aiConfidencePct: Math.round(seededRange(`wxc:${p.property_id}`, 82, 96)),
          assignedLabel: weatherRoll > 0.75 ? 'Unassigned' : 'Assigned',
        })
      }

      if (visibleTypes.has('Flood') && floodRoll > 0.6) {
        const critical = floodRoll > 0.85
        out.push({
          id: `haz-fl-${p.property_id}`,
          propertyId: p.property_id,
          type: 'Flood',
          severity: critical ? 'critical' : 'warning',
          title: critical ? 'Flood Zone Alert: Heavy Rain Forecast' : 'Flood Zone Watch',
          summary: critical ? '3–5 inches expected; properties in 100-year flood zone.' : 'Flood risk elevated; confirm pumps & drains.',
          regionLabel,
          exposureUnits: Math.round(units * seededRange(`flexp:${p.property_id}`, 0.2, 0.75)),
          timingLabel: critical ? 'Active now · 48hr window' : 'Next 72 hours',
          ctaLabel: 'Launch Flood Readiness',
          aiConfidencePct: Math.round(seededRange(`flc:${p.property_id}`, 78, 95)),
          assignedLabel: floodRoll > 0.7 ? 'Assigned' : 'Unassigned',
        })
      }

      if (visibleTypes.has('Crime') && crimeRoll > 0.62) {
        const critical = crimeRoll > 0.9
        out.push({
          id: `haz-cr-${p.property_id}`,
          propertyId: p.property_id,
          type: 'Crime',
          severity: critical ? 'critical' : 'warning',
          title: critical ? 'Crime Index Spike' : 'Crime Trend Watch',
          summary: critical ? 'Incidents trending up near property perimeter.' : 'Monitor after-hours access and lighting coverage.',
          regionLabel,
          exposureUnits: Math.round(units * seededRange(`crexp:${p.property_id}`, 0.15, 0.55)),
          timingLabel: 'Last 14 days',
          ctaLabel: 'Launch Security Checklist',
          aiConfidencePct: Math.round(seededRange(`crc:${p.property_id}`, 72, 92)),
          assignedLabel: crimeRoll > 0.8 ? 'Unassigned' : 'Assigned',
        })
      }

      // Regulations always shown as "other hazards"
      if (visibleTypes.has('Regulation') && regRoll > 0.58) {
        out.push({
          id: `haz-rg-${p.property_id}`,
          propertyId: p.property_id,
          type: 'Regulation',
          severity: regRoll > 0.88 ? 'critical' : 'warning',
          title: 'New Local Ordinance: Waste Management',
          summary: 'Recycling requirements updated; compliance deadline approaching.',
          regionLabel,
          exposureUnits: Math.round(units * seededRange(`rgexp:${p.property_id}`, 0.2, 0.65)),
          timingLabel: `Starts ${['Mar 1', 'Apr 15', 'May 10'][Math.floor(seededRange(`rgd:${p.property_id}`, 0, 3))] ?? 'Mar 1'} · 26 days to comply`,
          ctaLabel: 'Launch Compliance Checklist',
          aiConfidencePct: Math.round(seededRange(`rgc:${p.property_id}`, 84, 97)),
          assignedLabel: regRoll > 0.7 ? 'Assigned' : 'Unassigned',
        })
      }
    }

    // Sort critical first, then weather/flood/crime/regulation.
    const typeOrder: Record<HazardType, number> = { Weather: 0, Flood: 1, Crime: 2, Regulation: 3 }
    const sevOrder: Record<Severity, number> = { critical: 0, warning: 1 }
    out.sort((a, b) => (sevOrder[a.severity] - sevOrder[b.severity]) || (typeOrder[a.type] - typeOrder[b.type]))

    return out
  }, [layers, properties])

  const filteredHazards = useMemo(() => {
    const q = riskSearch.trim().toLowerCase()
    if (!q) return hazards
    return hazards.filter((h) => (h.title + ' ' + h.summary + ' ' + h.regionLabel).toLowerCase().includes(q))
  }, [hazards, riskSearch])

  const counts = useMemo(() => {
    const critical = hazards.filter((h) => h.severity === 'critical').length
    const warnings = hazards.filter((h) => h.severity === 'warning').length
    const propSet = new Set(hazards.map((h) => h.propertyId))
    return { critical, warnings, properties: propSet.size }
  }, [hazards])

  const propertyBadges = useMemo(() => {
    const map: Record<string, { critical: number; warnings: number }> = {}
    hazards.forEach((h) => {
      const cur = map[h.propertyId] ?? { critical: 0, warnings: 0 }
      if (h.severity === 'critical') cur.critical += 1
      else cur.warnings += 1
      map[h.propertyId] = cur
    })
    return map
  }, [hazards])

  const mapHeight = 760

  return (
    <InsightsPageShell title="Region Watch" hideHeaderFilters>
      <Box style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
        {/* Left hazard feed */}
        <Box style={{ width: 360, flex: '0 0 360px' }}>
          <Paper withBorder radius="lg" p="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Text fw={900}>Regional Watch</Text>
                <Text size="xs" c="dimmed">
                  Real-time risk monitoring (demo)
                </Text>
              </Stack>
              <Group gap={8}>
                <Badge color="red" variant="light">
                  {counts.critical} critical
                </Badge>
                <Badge color="yellow" variant="light">
                  {counts.warnings} warnings
                </Badge>
                <Badge color="gray" variant="light">
                  {counts.properties} properties
                </Badge>
              </Group>
            </Group>

            <TextInput
              mt="sm"
              placeholder="Search risks…"
              value={riskSearch}
              onChange={(e) => setRiskSearch(e.currentTarget.value)}
            />

            <Box mt="sm" style={{ maxHeight: mapHeight - 120, overflowY: 'auto' }}>
              <Stack gap="sm">
                {filteredHazards.map((h) => {
                  const border =
                    h.severity === 'critical'
                      ? 'var(--mantine-color-red-6)'
                      : h.type === 'Regulation'
                        ? 'var(--mantine-color-yellow-6)'
                        : 'var(--mantine-color-orange-6)'

                  const accentBg = `color-mix(in oklab, ${border} 14%, transparent)`

                  return (
                    <Paper
                      key={h.id}
                      withBorder
                      radius="lg"
                      p="sm"
                      style={{
                        borderColor: border,
                        background: accentBg,
                        cursor: 'pointer',
                      }}
                      onClick={() => setFocusedPropertyId(h.propertyId)}
                    >
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Group gap="sm" align="flex-start" wrap="nowrap">
                          <Box
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 10,
                              background: border,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <HugeiconsIcon icon={Alert02Icon} size={16} color="white" />
                          </Box>
                          <Box style={{ minWidth: 0 }}>
                            <Group gap={8} wrap="wrap">
                              <Badge size="xs" variant="light" color={h.severity === 'critical' ? 'red' : 'yellow'}>
                                {h.severity === 'critical' ? 'Critical' : 'Warning'}
                              </Badge>
                              <Text size="xs" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                                {h.type}
                              </Text>
                            </Group>
                            <Text fw={900} size="sm" mt={4} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {h.title}
                            </Text>
                            <Text size="xs" c="dimmed" mt={2}>
                              {h.summary}
                            </Text>

                            <Group gap={10} mt="sm" wrap="wrap">
                              <Box>
                                <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                                  Region
                                </Text>
                                <Text size="xs" fw={900}>
                                  {h.regionLabel}
                                </Text>
                              </Box>
                              <Box>
                                <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                                  Exposure
                                </Text>
                                <Text size="xs" fw={900}>
                                  {h.exposureUnits} units
                                </Text>
                              </Box>
                            </Group>

                            <Group justify="space-between" mt="sm" align="center">
                              <Text size="xs" c="dimmed">
                                {h.timingLabel}
                              </Text>
                              <Text size="xs" c="dimmed">
                                AI Confidence: {h.aiConfidencePct}%
                              </Text>
                            </Group>

                            <Button
                              mt="sm"
                              fullWidth
                              rightSection={<HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
                              styles={{ inner: { justifyContent: 'space-between' } }}
                            >
                              {h.ctaLabel}
                            </Button>

                            <Text size="xs" c="dimmed" mt={6}>
                              {h.assignedLabel}
                            </Text>
                          </Box>
                        </Group>
                      </Group>
                    </Paper>
                  )
                })}

                {filteredHazards.length === 0 && (
                  <Text size="sm" c="dimmed">
                    No hazards match your search (or the current layer toggles).
                  </Text>
                )}
              </Stack>
            </Box>
          </Paper>
        </Box>

        {/* Map area */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Paper withBorder radius="lg" p="md" style={{ marginBottom: 12 }}>
            <Group justify="space-between" wrap="wrap" align="center">
              <Group gap="sm" align="center">
                <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
                  Layers
                </Text>
                <Group gap="md">
                  <Switch
                    checked={layers.weather}
                    onChange={(e) => {
                      const checked = e.currentTarget.checked
                      setLayers((prev) => ({ ...prev, weather: checked }))
                    }}
                    label="Weather"
                  />
                  <Switch
                    checked={layers.flood}
                    onChange={(e) => {
                      const checked = e.currentTarget.checked
                      setLayers((prev) => ({ ...prev, flood: checked }))
                    }}
                    label="Flood Zones"
                  />
                  <Switch
                    checked={layers.crime}
                    onChange={(e) => {
                      const checked = e.currentTarget.checked
                      setLayers((prev) => ({ ...prev, crime: checked }))
                    }}
                    label="Crime Index"
                  />
                </Group>
              </Group>
            </Group>
          </Paper>

          <HpyRegionWatchMap
            properties={properties}
            loading={loading}
            height={mapHeight}
            layers={layers}
            focusedPropertyId={focusedPropertyId}
            onGeocoded={onGeocoded}
            propertyBadges={propertyBadges}
          />
        </Box>
      </Box>
    </InsightsPageShell>
  )
}
