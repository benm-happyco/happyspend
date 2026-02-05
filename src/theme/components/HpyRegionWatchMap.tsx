import { Box, Group, Paper, Stack, Text } from '@mantine/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, CircleMarker, MapContainer, Marker, Rectangle, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { ensureLeafletDefaultMarkerIcons } from '../../lib/leafletMarkerFix'

export type RegionWatchProperty = {
  property_id: string
  name: string | null
  street: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  unit_count: number | null
  market: string | null
  latitude: number | null
  longitude: number | null
}

export type RegionWatchLayers = {
  weather: boolean
  flood: boolean
  crime: boolean
}

type LatLng = { lat: number; lng: number }

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = points.map((p) => [p.lat, p.lng] as [number, number])
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 11 })
  }, [map, points])
  return null
}

function FocusProperty({ point }: { point: LatLng | null }) {
  const map = useMap()
  useEffect(() => {
    if (!point) return
    map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 10), { duration: 0.6 })
  }, [map, point])
  return null
}

function formatAddress(p: RegionWatchProperty): string {
  const parts = [p.street, [p.city, p.state].filter(Boolean).join(', '), p.postal_code].filter(Boolean)
  return parts.join(' ')
}

export function HpyRegionWatchMap({
  properties,
  loading,
  height,
  layers,
  focusedPropertyId,
  onGeocoded,
  propertyBadges,
}: {
  properties: RegionWatchProperty[]
  loading: boolean
  height: number
  layers: RegionWatchLayers
  focusedPropertyId?: string | null
  onGeocoded?: (args: { propertyId: string; latitude: number; longitude: number }) => void
  propertyBadges?: Record<string, { critical: number; warnings: number }>
}) {
  const geocodeRunRef = useRef(0)
  const [overrides, setOverrides] = useState<Record<string, LatLng>>({})
  const [geocodeProgress, setGeocodeProgress] = useState<{ done: number; total: number } | null>(null)

  useEffect(() => {
    ensureLeafletDefaultMarkerIcons()
  }, [])

  const missingWithAddress = useMemo(
    () =>
      properties.filter((p) => {
        const hasCoords = p.latitude != null && p.longitude != null
        if (hasCoords) return false
        return Boolean(formatAddress(p))
      }),
    [properties]
  )

  useEffect(() => {
    // Geocode sequentially (polite to public geocoder). Cache per property+address.
    const runId = ++geocodeRunRef.current

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    const geocodeOne = async (p: RegionWatchProperty) => {
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
        // ignore
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
          // ignore
        } finally {
          done += 1
          setGeocodeProgress({ done, total: queue.length })
          await sleep(1100)
        }
      }
    }

    void run()
  }, [missingWithAddress, onGeocoded, overrides])

  const points = useMemo(() => {
    return properties
      .map((p) => {
        const o = overrides[p.property_id]
        const lat = p.latitude ?? o?.lat ?? null
        const lng = p.longitude ?? o?.lng ?? null
        return lat != null && lng != null ? { lat, lng, p } : null
      })
      .filter((x): x is { lat: number; lng: number; p: RegionWatchProperty } => x != null)
  }, [properties, overrides])

  const focusedPoint = useMemo(() => {
    if (!focusedPropertyId) return null
    const found = points.find((pt) => pt.p.property_id === focusedPropertyId)
    return found ? { lat: found.lat, lng: found.lng } : null
  }, [focusedPropertyId, points])

  const mapCenter: [number, number] = [39.5, -98.35] // default US center

  // Generate a few realistic overlay zones based on existing pins.
  const overlays = useMemo(() => {
    const pts = points.map((p) => ({ lat: p.lat, lng: p.lng }))
    if (pts.length === 0) return { weather: [], flood: [], crime: [] } as const

    const pick = (i: number) => pts[Math.min(pts.length - 1, i)]
    const a = pick(0)
    const b = pick(Math.floor(pts.length / 2))
    const c = pick(pts.length - 1)

    return {
      weather: [
        { center: a, radius: 140_000, color: 'var(--mantine-color-red-6)' },
        { center: b, radius: 120_000, color: 'var(--mantine-color-orange-6)' },
      ],
      flood: [
        {
          bounds: [
            [c.lat - 0.8, c.lng - 1.0],
            [c.lat + 0.8, c.lng + 1.0],
          ] as [[number, number], [number, number]],
        },
      ],
      crime: [
        { center: b, radius: 65_000, color: 'var(--mantine-color-violet-6)' },
        { center: a, radius: 45_000, color: 'var(--mantine-color-yellow-6)' },
      ],
    } as const
  }, [points])

  return (
    <Box
      style={{
        height,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--mantine-color-default-border)',
        position: 'relative',
        background: 'var(--mantine-color-default-hover)',
      }}
    >
      <MapContainer center={mapCenter} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds points={points.map((p) => ({ lat: p.lat, lng: p.lng }))} />
        <FocusProperty point={focusedPoint} />

        {layers.weather &&
          overlays.weather.map((z, idx) => (
            <Circle
              key={`w-${idx}`}
              center={[z.center.lat, z.center.lng]}
              radius={z.radius}
              pathOptions={{
                color: z.color,
                weight: 2,
                fillColor: z.color,
                fillOpacity: 0.12,
              }}
            />
          ))}

        {layers.flood &&
          overlays.flood.map((z, idx) => (
            <Rectangle
              key={`f-${idx}`}
              bounds={z.bounds}
              pathOptions={{
                color: 'var(--mantine-color-cyan-6)',
                weight: 2,
                fillColor: 'var(--mantine-color-cyan-6)',
                fillOpacity: 0.12,
              }}
            />
          ))}

        {layers.crime &&
          overlays.crime.map((z, idx) => (
            <CircleMarker
              key={`c-${idx}`}
              center={[z.center.lat, z.center.lng]}
              radius={18}
              pathOptions={{
                color: z.color,
                weight: 2,
                fillColor: z.color,
                fillOpacity: 0.22,
              }}
            />
          ))}

        {points.map(({ lat, lng, p }) => {
          const badge = propertyBadges?.[p.property_id]
          return (
            <Marker key={p.property_id} position={[lat, lng]}>
              <Tooltip className="hpy-map-tooltip" direction="top" offset={[0, -8]} opacity={1} sticky>
                <Paper
                  withBorder
                  radius="md"
                  p="sm"
                  style={{
                    minWidth: 220,
                    background: 'color-mix(in srgb, var(--mantine-color-body) 92%, var(--mantine-color-dark-9))',
                  }}
                >
                  <Stack gap={6}>
                    <Text fw={900} size="sm" c="var(--mantine-color-text)">
                      {p.name ?? 'Unknown property'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {[p.city, p.state].filter(Boolean).join(', ')} · {p.unit_count ?? '—'} units
                    </Text>
                    {badge ? (
                      <Group gap={8}>
                        <Text size="xs" fw={900} style={{ color: 'var(--mantine-color-red-7)' }}>
                          {badge.critical} critical
                        </Text>
                        <Text size="xs" fw={900} style={{ color: 'var(--mantine-color-yellow-7)' }}>
                          {badge.warnings} warnings
                        </Text>
                      </Group>
                    ) : (
                      <Text size="xs" c="dimmed">
                        No active hazards
                      </Text>
                    )}
                  </Stack>
                </Paper>
              </Tooltip>
            </Marker>
          )
        })}
      </MapContainer>

      <Box
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          width: 220,
          pointerEvents: 'none',
        }}
      >
        <Paper withBorder radius="lg" p="sm" style={{ background: 'color-mix(in srgb, var(--mantine-color-body) 92%, transparent)' }}>
          <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
            Map legend
          </Text>
          <Stack gap={6} mt={6}>
            <Group gap={8} wrap="nowrap">
              <Box style={{ width: 10, height: 10, borderRadius: 10, background: 'var(--mantine-color-red-6)' }} />
              <Text size="xs">Critical risk</Text>
            </Group>
            <Group gap={8} wrap="nowrap">
              <Box style={{ width: 10, height: 10, borderRadius: 10, background: 'var(--mantine-color-orange-6)' }} />
              <Text size="xs">Warning</Text>
            </Group>
            <Group gap={8} wrap="nowrap">
              <Box style={{ width: 10, height: 10, borderRadius: 10, background: 'var(--mantine-color-cyan-6)' }} />
              <Text size="xs">Flood zone</Text>
            </Group>
            <Group gap={8} wrap="nowrap">
              <Box style={{ width: 10, height: 10, borderRadius: 10, background: 'var(--mantine-color-violet-6)' }} />
              <Text size="xs">Crime index</Text>
            </Group>
          </Stack>
        </Paper>
      </Box>

      <Box
        style={{
          position: 'absolute',
          left: 16,
          top: 16,
          pointerEvents: 'none',
        }}
      >
        <Paper withBorder radius="lg" p="sm" style={{ background: 'color-mix(in srgb, var(--mantine-color-body) 92%, transparent)' }}>
          <Group justify="space-between" gap="sm">
            <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
              {loading ? 'Loading map…' : geocodeProgress ? `Geocoding ${geocodeProgress.done}/${geocodeProgress.total}` : `${points.length}/${properties.length} mapped`}
            </Text>
          </Group>
        </Paper>
      </Box>
    </Box>
  )
}

