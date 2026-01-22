import { Alert, Box, Group, Paper, Stack, Text } from '@mantine/core'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { getHappyCoConfig } from '../lib/happyco'

export function HappyPropertyTest3() {
  const { baseUrl, hasToken } = getHappyCoConfig()

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
              searchPlaceholder="Search HappyCo data"
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
              ) : (
                <Alert color="green" title="HappyCo token detected">
                  <Text size="sm">Ready to connect to the HappyCo Graph API.</Text>
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
                </Stack>
              </Paper>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </>
  )
}
