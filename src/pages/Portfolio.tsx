import { useMemo } from 'react'
import { Box, Stack, Text } from '@mantine/core'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { HpyAppIcon } from '../theme/components/HpyAppIcon'
import { PORTFOLIO_APP_NAV } from './portfolioInsightsNav'

export function Portfolio() {
  const appNavOverride = useMemo(() => PORTFOLIO_APP_NAV, [])

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
              title="Portfolio Snapshot"
              appIconNode={<HpyAppIcon type="Insights" size={48} radius={8} />}
              searchPlaceholder="Search portfolios"
              hideCta
            />
            <Text size="sm" c="dimmed">
              Content coming soon.
            </Text>
          </Stack>
        </Box>
      </Box>
    </>
  )
}
