import { Box, Stack } from '@mantine/core'
import { useState } from 'react'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
import { InlineEditorDrawer } from '../theme/components/HpyDrawer'

export function HpmVendors() {
  const [searchValue, setSearchValue] = useState('')
  const [drawerOpened, setDrawerOpened] = useState(false)

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
              title="Vendors"
              appIconType="Inventory"
              searchPlaceholder="Search vendors"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              ctaLabel="New Vendor"
              onCtaClick={() => setDrawerOpened(true)}
            />
          </Stack>
        </Box>
      </Box>
      <InlineEditorDrawer opened={drawerOpened} onClose={() => setDrawerOpened(false)} title="New Vendor" withCloseButton />
    </>
  )
}
