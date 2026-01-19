import { Box } from '@mantine/core'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'

export function HappyProperty() {
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
        <Box style={{ flex: 1, padding: 24 }} />
      </Box>
    </>
  )
}

