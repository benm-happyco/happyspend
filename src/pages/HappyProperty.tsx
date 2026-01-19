import { Box } from '@mantine/core'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'

export function HappyProperty() {
  return (
    <>
      <GlobalHeader variant="product" />
      <Box style={{ paddingTop: GLOBAL_HEADER_HEIGHT, minHeight: '100vh' }} />
    </>
  )
}

