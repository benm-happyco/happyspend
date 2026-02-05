import { Box, Chip, Divider, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { ensureLeafletDefaultMarkerIcons } from '../../lib/leafletMarkerFix'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Idea01Icon, ArrowRight02Icon } from '@hugeicons/core-free-icons'

type InsightType = 'NOI Delta' | 'Risk Clusters' | 'Turn Bottlenecks' | 'Utilities Drift' | 'Resident Experience'

type PropertyLocation = {
  property_id: string
  name: string | null
  street: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  unit_count?: number | null
  market?: string | null
  latitude: number | null
  longitude: number | null
  insights?: {
    occupancyPct: number | null
    avgRent: number | null
    rentGrowthPct: number | null
    noiImpactAnnual: number | null
    riskClustersNow: number | null
    turnDaysNow: number | null
    utilitiesOpenNow: number | null
    utilitiesOpenPrev: number | null
    residentSentimentNow: number | null
    residentSentimentDelta: number | null
    churnRiskLabel: 'LOW' | 'MEDIUM' | 'HIGH'
    insightTypes: InsightType[]
  }
}

function FitBounds({ points }: { points: Array<{ lat: number; lng: number }> }) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) return
    const bounds = points.map((p) => [p.lat, p.lng] as [number, number])
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 })
  }, [map, points])

  return null
}

function formatAddress(p: PropertyLocation): string {
  const parts = [p.street, [p.city, p.state].filter(Boolean).join(', '), p.postal_code].filter(Boolean)
  return parts.join(' ')
}

function formatCompactCurrency(value: number, decimals = 0): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(decimals)}m`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(decimals)}k`
  return `${sign}$${abs.toFixed(decimals)}`
}

function formatSigned(value: number, decimals = 0): string {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${Math.abs(value).toFixed(decimals)}`
}

function TooltipCard({ p }: { p: PropertyLocation }) {
  const ins = p.insights
  const occupancy = ins?.occupancyPct
  const avgRent = ins?.avgRent
  const growth = ins?.rentGrowthPct
  const noiImpact = ins?.noiImpactAnnual
  const sentimentDelta = ins?.residentSentimentDelta

  const banners: Array<{ label: string; value: string; tone: 'good' | 'bad' | 'warn' }> = []

  if (noiImpact != null && Math.abs(noiImpact) >= 50_000) {
    banners.push({
      label: 'NOI Impact',
      value: formatCompactCurrency(noiImpact, 0),
      tone: noiImpact >= 0 ? 'good' : 'bad',
    })
  }

  if (sentimentDelta != null && Math.abs(sentimentDelta) >= 0.3) {
    banners.push({
      label: 'Sentiment Risk',
      value: formatSigned(sentimentDelta, 1),
      tone: sentimentDelta < 0 ? 'bad' : 'warn',
    })
  }

  if (ins?.churnRiskLabel) {
    banners.push({
      label: `${ins.churnRiskLabel} Risk`,
      value: 'Churn Risk',
      tone: ins.churnRiskLabel === 'HIGH' ? 'bad' : ins.churnRiskLabel === 'MEDIUM' ? 'warn' : 'good',
    })
  }

  const toneStyles = (tone: 'good' | 'bad' | 'warn') => {
    // Stronger contrast for dark mode readability.
    if (tone === 'good') {
      return {
        background: 'color-mix(in srgb, var(--mantine-color-success-2) 70%, var(--mantine-color-body))',
        color: 'var(--mantine-color-success-9)',
      }
    }
    if (tone === 'bad') {
      return {
        background: 'color-mix(in srgb, var(--mantine-color-danger-2) 70%, var(--mantine-color-body))',
        color: 'var(--mantine-color-danger-9)',
      }
    }
    return {
      background: 'color-mix(in srgb, var(--mantine-color-yellow-2) 70%, var(--mantine-color-body))',
      color: 'var(--mantine-color-yellow-9)',
    }
  }

  const unitCount = typeof p.unit_count === 'number' ? p.unit_count : null
  const hasInsights = (ins?.insightTypes?.length ?? 0) > 0

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      style={{
        width: 260,
        background: 'color-mix(in srgb, var(--mantine-color-body) 92%, var(--mantine-color-dark-9))',
        color: 'var(--mantine-color-text)',
      }}
    >
      <Stack gap={8}>
        <Stack gap={2}>
          <Text fw={900} size="md" lineClamp={2} style={{ lineHeight: 1.2, wordBreak: 'break-word' }}>
            {p.name ?? 'Unnamed property'}
          </Text>
          <Text size="xs" c="dimmed" fw={700}>
            {unitCount != null ? `${unitCount.toLocaleString()} units` : 'Units unknown'}
            {p.market ? ` • ${p.market}` : ''}
          </Text>
        </Stack>

        <SimpleGrid cols={3} spacing="xs">
          <Stack gap={2} align="center">
            <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
              Occupancy
            </Text>
            <Text fw={900} style={{ fontSize: 16 }}>
              {occupancy == null ? '—' : `${Math.round(occupancy)}%`}
            </Text>
          </Stack>
          <Stack gap={2} align="center">
            <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
              Avg Rent
            </Text>
            <Text fw={900} style={{ fontSize: 16 }}>
              {avgRent == null ? '—' : `$${Math.round(avgRent).toLocaleString()}`}
            </Text>
          </Stack>
          <Stack gap={2} align="center">
            <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
              Growth
            </Text>
            <Text
              fw={900}
              style={{
                fontSize: 16,
                color:
                  growth == null
                    ? undefined
                    : growth >= 0
                      ? 'var(--mantine-color-success-7)'
                      : 'var(--mantine-color-danger-7)',
              }}
            >
              {growth == null ? '—' : `${growth >= 0 ? '+' : ''}${Math.round(growth)}%`}
            </Text>
          </Stack>
        </SimpleGrid>

        {hasInsights ? (
          <Stack gap={6}>
            {banners.length > 0 ? (
              banners.slice(0, 3).map((b) => (
                <Group
                  key={b.label}
                  justify="space-between"
                  px="xs"
                  py={6}
                  style={{
                    borderRadius: 10,
                    ...toneStyles(b.tone),
                  }}
                >
                  <Group gap={8} wrap="nowrap">
                    {b.tone === 'bad' && <HugeiconsIcon icon={Alert02Icon} size={16} color="currentColor" />}
                    <Text fw={900} size="sm">
                      {b.label}
                    </Text>
                  </Group>
                  <Text
                    fw={900}
                    size="sm"
                    style={{
                      maxWidth: 110,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'right',
                    }}
                  >
                    {b.value}
                  </Text>
                </Group>
              ))
            ) : (
              <Group
                justify="space-between"
                px="xs"
                py={6}
                style={{
                  borderRadius: 10,
                  background: 'color-mix(in srgb, var(--mantine-color-default-hover) 85%, var(--mantine-color-body))',
                  border: '1px solid var(--mantine-color-default-border)',
                }}
              >
                <Text fw={900} size="sm">
                  Insights available
                </Text>
                <Text fw={900} size="sm" c="dimmed">
                  View details →
                </Text>
              </Group>
            )}
          </Stack>
        ) : (
          <Paper
            withBorder
            radius="md"
            p="sm"
            style={{
              background: 'color-mix(in srgb, var(--mantine-color-default-hover) 85%, var(--mantine-color-body))',
            }}
          >
            <Stack gap={4}>
              <Text fw={900} size="sm">
                No insights found
              </Text>
              <Text size="xs" c="dimmed">
                This property doesn’t currently match any selected insight types.
              </Text>
            </Stack>
          </Paper>
        )}

        <Divider />

        <Group justify="center" gap={8} style={{ color: 'var(--mantine-color-blue-6)' }}>
          <HugeiconsIcon icon={Idea01Icon} size={16} color="currentColor" />
          <Text fw={900} size="sm">
            Click for detailed analysis
          </Text>
          <HugeiconsIcon icon={ArrowRight02Icon} size={16} color="currentColor" />
        </Group>
      </Stack>
    </Paper>
  )
}

export function HpyPropertyMap({
  title = 'Property map',
  properties,
  loading,
  height = 300,
  onGeocoded,
}: {
  title?: string
  properties: PropertyLocation[]
  loading: boolean
  height?: number
  onGeocoded?: (args: { propertyId: string; latitude: number; longitude: number }) => void
}) {
  useEffect(() => {
    ensureLeafletDefaultMarkerIcons()
  }, [])

  const INSIGHT_FILTERS: Array<{ key: InsightType; label: string }> = [
    { key: 'NOI Delta', label: 'NOI Delta' },
    { key: 'Risk Clusters', label: 'Risk Clusters' },
    { key: 'Turn Bottlenecks', label: 'Turn Bottlenecks' },
    { key: 'Utilities Drift', label: 'Utilities Drift' },
    { key: 'Resident Experience', label: 'Resident Experience' },
  ]

  const [activeFilters, setActiveFilters] = useState<InsightType[]>([])

  const filteredProperties = useMemo(() => {
    if (activeFilters.length === 0) return properties
    return properties.filter((p) => activeFilters.some((f) => p.insights?.insightTypes?.includes(f)))
  }, [activeFilters, properties])

  const [overrides, setOverrides] = useState<Record<string, { lat: number; lng: number }>>({})
  const [geocodeProgress, setGeocodeProgress] = useState<{ done: number; total: number } | null>(null)
  const geocodeRunRef = useRef(0)

  const missingWithAddress = useMemo(() => {
    return filteredProperties.filter((p) => {
      const hasCoords = p.latitude != null && p.longitude != null
      if (hasCoords) return false
      const address = formatAddress(p)
      return Boolean(address)
    })
  }, [filteredProperties])

  useEffect(() => {
    if (filteredProperties.length === 0) return

    // Load any cached geocodes immediately.
    const cached: Record<string, { lat: number; lng: number }> = {}
    filteredProperties.forEach((p) => {
      const addressKey = formatAddress(p)
      if (!addressKey) return
      const cacheKey = `hpy:geo:${p.property_id}:${addressKey}`
      try {
        const raw = localStorage.getItem(cacheKey)
        if (!raw) return
        const parsed = JSON.parse(raw) as { lat?: unknown; lng?: unknown }
        const lat = typeof parsed.lat === 'number' ? parsed.lat : Number(parsed.lat)
        const lng = typeof parsed.lng === 'number' ? parsed.lng : Number(parsed.lng)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          cached[p.property_id] = { lat, lng }
        }
      } catch {
        // ignore cache parse errors
      }
    })

    if (Object.keys(cached).length > 0) {
      setOverrides((prev) => ({ ...cached, ...prev }))
    }
  }, [filteredProperties])

  useEffect(() => {
    // Geocode any properties missing coordinates, sequentially to respect typical OSM policies.
    // This uses real address data from Supabase; results are cached in localStorage and optionally persisted via onGeocoded.
    const runId = ++geocodeRunRef.current

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    const geocodeOne = async (p: PropertyLocation) => {
      const address = formatAddress(p)
      if (!address) return null

      const cacheKey = `hpy:geo:${p.property_id}:${address}`
      try {
        const cachedRaw = localStorage.getItem(cacheKey)
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw) as { lat?: unknown; lng?: unknown }
          const lat = typeof parsed.lat === 'number' ? parsed.lat : Number(parsed.lat)
          const lng = typeof parsed.lng === 'number' ? parsed.lng : Number(parsed.lng)
          if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
        }
      } catch {
        // ignore
      }

      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) return null
      const data = (await res.json()) as Array<{ lat?: string; lon?: string }>
      const first = data[0]
      if (!first?.lat || !first?.lon) return null
      const lat = Number(first.lat)
      const lng = Number(first.lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

      try {
        localStorage.setItem(cacheKey, JSON.stringify({ lat, lng }))
      } catch {
        // ignore quota errors
      }

      return { lat, lng }
    }

    const run = async () => {
      const queue = missingWithAddress.filter((p) => overrides[p.property_id] == null)
      if (queue.length === 0) {
        setGeocodeProgress(null)
        return
      }

      setGeocodeProgress({ done: 0, total: queue.length })

      let done = 0
      for (const p of queue) {
        if (runId !== geocodeRunRef.current) return
        try {
          const result = await geocodeOne(p)
          if (runId !== geocodeRunRef.current) return
          if (result) {
            setOverrides((prev) => ({ ...prev, [p.property_id]: result }))
            onGeocoded?.({ propertyId: p.property_id, latitude: result.lat, longitude: result.lng })
          }
        } catch {
          // ignore individual failures
        } finally {
          done += 1
          setGeocodeProgress({ done, total: queue.length })
          // Be polite to the public geocoder.
          await sleep(1100)
        }
      }
    }

    void run()
  }, [missingWithAddress, onGeocoded, overrides])

  const points = useMemo(
    () =>
      filteredProperties
        .map((p) => {
          const o = overrides[p.property_id]
          const lat = p.latitude ?? o?.lat ?? null
          const lng = p.longitude ?? o?.lng ?? null
          return lat != null && lng != null ? { lat, lng, p } : null
        })
        .filter((x): x is { lat: number; lng: number; p: PropertyLocation } => x != null),
    [filteredProperties, overrides]
  )

  // Default view: Seattle-ish, just to show the map UI even if we have no coords yet.
  const center: [number, number] = [47.6062, -122.3321]

  return (
    <Paper withBorder shadow="sm" radius="lg" p="lg" style={{ backgroundColor: 'var(--mantine-color-body)' }}>
      <Stack gap="md">
        <Group justify="space-between" gap="sm">
          <Text fw={900} size="lg">
            {title}
          </Text>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
            {loading
              ? 'Loading…'
              : geocodeProgress
                ? `Geocoding ${geocodeProgress.done}/${geocodeProgress.total} • ${points.length}/${properties.length} mapped`
                : `${points.length}/${properties.length} mapped`}
          </Text>
        </Group>

        <Stack gap="xs">
          <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: '0.08em' }}>
            Filters
          </Text>
          <Chip.Group multiple value={activeFilters} onChange={(v) => setActiveFilters(v as InsightType[])}>
            <Group gap="xs">
              {INSIGHT_FILTERS.map((f) => (
                <Chip key={f.key} value={f.key} size="xs" variant="light">
                  {f.label}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Stack>

        {properties.length === 0 ? (
          <Text size="sm" c="dimmed">
            No properties found.
          </Text>
        ) : (
          <Box
            style={{
              height,
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid var(--mantine-color-default-border)',
              background: 'var(--mantine-color-default-hover)',
              position: 'relative',
            }}
          >
            <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FitBounds points={points.map((p) => ({ lat: p.lat, lng: p.lng }))} />

              {points.map(({ lat, lng, p }) => (
                <Marker key={p.property_id} position={[lat, lng]}>
                  <Tooltip className="hpy-map-tooltip" direction="top" offset={[0, -8]} opacity={1} sticky>
                    <TooltipCard p={p} />
                  </Tooltip>
                </Marker>
              ))}
            </MapContainer>

            {filteredProperties.length === 0 && activeFilters.length > 0 && (
              <Box
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  background:
                    'linear-gradient(180deg, color-mix(in srgb, var(--mantine-color-body) 35%, transparent), transparent 55%)',
                }}
              >
                <Paper
                  withBorder
                  radius="md"
                  p="md"
                  style={{
                    maxWidth: 360,
                    background: 'color-mix(in srgb, var(--mantine-color-body) 92%, var(--mantine-color-dark-9))',
                  }}
                >
                  <Stack gap={6} align="center">
                    <Text fw={900}>No properties match these filters</Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Try turning off a filter (or selecting a different insight type) to see pins on the map.
                    </Text>
                  </Stack>
                </Paper>
              </Box>
            )}
          </Box>
        )}

        {filteredProperties.length > 0 && points.length === 0 && !loading && (
          <Text size="sm" c="dimmed">
            No coordinates yet — I’m geocoding using property addresses. If nothing shows up, check that `street/city/state/postal_code` are populated.
          </Text>
        )}
      </Stack>
    </Paper>
  )
}

