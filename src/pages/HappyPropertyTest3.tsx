import { Alert, Box, Group, Paper, Skeleton, Stack, Text } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { getHappyCoConfig, happyCoGraphql } from '../lib/happyco'

type PropertyNode = {
  id: string
  name: string
  createdAt?: string | null
  address?: {
    line1?: string | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
  } | null
}

type CustomerPropertiesResponse = {
  customer: {
    id: string
    name: string
    propertiesV2: {
      count: number
      edges: { cursor: string; node: PropertyNode }[]
    }
  } | null
}

type UserPropertiesResponse = {
  user: {
    id: string
    customer: {
      id: string
      name: string
      propertiesV2: {
        count: number
        edges: { cursor: string; node: PropertyNode }[]
      }
    } | null
  } | null
}

const CUSTOMER_PROPERTIES_QUERY = `
  query CustomerProperties($customerId: ID!) {
    customer(customerId: $customerId) {
      id
      name
      propertiesV2 {
        count
        edges {
          cursor
          node {
            id
            name
            createdAt
            address {
              line1
              city
              state
              postalCode
            }
          }
        }
      }
    }
  }
`

const USER_PROPERTIES_QUERY = `
  query UserProperties($userId: ID!) {
    user(userID: $userId) {
      id
      customer {
        id
        name
        propertiesV2 {
          count
          edges {
            cursor
            node {
              id
              name
              createdAt
              address {
                line1
                city
                state
                postalCode
              }
            }
          }
        }
      }
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
  const customerId = import.meta.env.VITE_HAPPYCO_CUSTOMER_ID
  const userId = import.meta.env.VITE_HAPPYCO_USER_ID
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [properties, setProperties] = useState<PropertyNode[]>([])

  useEffect(() => {
    if (!hasToken) return

    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        if (userId) {
          if (userId.includes('@')) {
            setError('VITE_HAPPYCO_USER_ID must be a user ID, not an email address.')
            return
          }
          const propertiesData = await happyCoGraphql<UserPropertiesResponse>(
            USER_PROPERTIES_QUERY,
            { userId },
            { baseUrl }
          )
          if (!isMounted) return
          const customer = propertiesData.user?.customer
          setCustomerName(customer?.name ?? null)
          setProperties(customer?.propertiesV2.edges.map((edge) => edge.node) ?? [])
          return
        }

        if (!customerId) {
          setError('Missing VITE_HAPPYCO_CUSTOMER_ID or VITE_HAPPYCO_USER_ID for properties query.')
          return
        }

        const propertiesData = await happyCoGraphql<CustomerPropertiesResponse>(
          CUSTOMER_PROPERTIES_QUERY,
          { customerId },
          { baseUrl }
        )
        if (!isMounted) return
        const customer = propertiesData.customer
        setCustomerName(customer?.name ?? null)
        setProperties(customer?.propertiesV2.edges.map((edge) => edge.node) ?? [])
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
  }, [baseUrl, customerId, hasToken])

  const filteredProperties = useMemo(() => {
    if (!searchValue.trim()) return properties
    const query = searchValue.toLowerCase()
    return properties.filter((property) => {
      const address = property.address
      const addressText = [address?.line1, address?.city, address?.state, address?.postalCode]
        .filter(Boolean)
        .join(' ')
      return [property.name, addressText].filter(Boolean).some((value) => value.toLowerCase().includes(query))
    })
  }, [properties, searchValue])

  return (
    <>
      <GlobalHeader variant="product" />
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
              title="Test 3"
              appIconType="Tasks"
              searchPlaceholder="Search properties"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              ctaLabel="Run query"
              ctaDisabled
            />
            <Stack gap="md">
              {!hasToken ? (
                <Alert color="red" title="HappyCo token missing">
                  <Text size="sm">
                    Add `VITE_HAPPYCO_TOKEN` to your local `.env.local` to enable API access.
                  </Text>
                </Alert>
              ) : !customerId && !userId ? (
                <Alert color="red" title="HappyCo ID missing">
                  <Text size="sm">
                    Add `VITE_HAPPYCO_USER_ID` (preferred for staging) or `VITE_HAPPYCO_CUSTOMER_ID` to your local
                    `.env.local` to fetch properties.
                  </Text>
                </Alert>
              ) : error ? (
                <Alert color="red" title="HappyCo error">
                  <Text size="sm">{error}</Text>
                </Alert>
              ) : (
                <Alert color="green" title="HappyCo connected">
                  <Text size="sm">
                    {customerName ? `Customer: ${customerName}` : 'Ready to query HappyCo data.'}
                  </Text>
                </Alert>
              )}
              <Paper withBorder radius="md" p="lg">
                <Stack gap="sm">
                  <Group gap="xs">
                    <Text fw={600}>Base URL:</Text>
                    <Text size="sm">{baseUrl}</Text>
                  </Group>
                  <Group gap="xs">
                    <Text fw={600}>Auth:</Text>
                    <Text size="sm">Bearer Token</Text>
                  </Group>
                  <Group gap="xs">
                    <Text fw={600}>Token Lifetime:</Text>
                    <Text size="sm">30 minutes max</Text>
                  </Group>
                  {customerId && (
                    <Group gap="xs">
                      <Text fw={600}>Customer ID:</Text>
                      <Text size="sm">{customerId}</Text>
                    </Group>
                  )}
                  {userId && (
                    <Group gap="xs">
                      <Text fw={600}>User ID:</Text>
                      <Text size="sm">{userId}</Text>
                    </Group>
                  )}
                </Stack>
              </Paper>
              <Stack gap="sm">
                <Text fw={700}>Properties</Text>
                {loading ? (
                  <Stack gap="xs">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} height={64} radius="md" />
                    ))}
                  </Stack>
                ) : filteredProperties.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No properties found.
                  </Text>
                ) : (
                  <Stack gap="xs">
                    {filteredProperties.map((property) => {
                      const address = property.address
                      const addressText = [address?.line1, address?.city, address?.state, address?.postalCode]
                        .filter(Boolean)
                        .join(', ')
                      const createdAt = formatFuzzyDate(property.createdAt)
                      return (
                        <Paper key={property.id} withBorder radius="md" p="md">
                          <Stack gap={4}>
                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                              <Text fw={600}>{property.name}</Text>
                              <Text size="sm" c="dimmed" title={createdAt.tooltip}>
                                {createdAt.label}
                              </Text>
                            </Group>
                            <Text size="sm" c="dimmed">
                              {addressText || 'Address unavailable'}
                            </Text>
                          </Stack>
                        </Paper>
                      )
                    })}
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </>
  )
}
