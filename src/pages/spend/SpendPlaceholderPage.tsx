import { Stack } from '@mantine/core'
import { HpyPageHeader } from '../../theme/components/HpyPageHeader'
import { HpyAppIcon } from '../../theme/components/HpyAppIcon'
import type { HpyAppIconType } from '../../theme/components/HpyAppIcon'

type SpendPlaceholderPageProps = {
  title: string
  appIconType?: HpyAppIconType
}

/** Placeholder for Happy Spend sections not yet implemented. */
export function SpendPlaceholderPage({ title, appIconType = 'Projects' }: SpendPlaceholderPageProps) {
  return (
    <Stack gap="md">
      <HpyPageHeader
        title={title}
        appIconType={appIconType}
        searchPlaceholder="Search..."
        hideCta
      />
    </Stack>
  )
}
