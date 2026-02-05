import { Box, Button, Group, Text, TextInput } from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { HpyAppIcon, type HpyAppIconType } from './HpyAppIcon'

type HpyPageHeaderProps = {
  title?: string
  appIconType?: HpyAppIconType
  appIconNode?: React.ReactNode
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  /** When set, replaces the search field with custom content (e.g. property selector + date range). */
  trailingContent?: React.ReactNode
  ctaLabel?: string
  onCtaClick?: () => void
  ctaDisabled?: boolean
  /** When true, the primary CTA button (e.g. "Create Work Order") is not rendered. */
  hideCta?: boolean
}

export function HpyPageHeader({
  title = 'Work Orders',
  appIconType = 'Inspections',
  appIconNode,
  searchPlaceholder = 'Search',
  searchValue,
  onSearchChange,
  trailingContent,
  ctaLabel = 'Create Work Order',
  onCtaClick,
  ctaDisabled = false,
  hideCta = false,
}: HpyPageHeaderProps) {
  return (
    <Group justify="space-between" align="center" gap="xl" wrap="nowrap">
      <Group gap="xl" align="center">
        {appIconNode ?? <HpyAppIcon type={appIconType} size={48} radius={8} />}
        <Text fw={700} style={{ fontSize: 32, lineHeight: '40px' }}>
          {title}
        </Text>
      </Group>
      <Group gap="xl" align="center" justify="flex-end" style={{ flex: 1 }}>
        {trailingContent ?? (
          <Box style={{ width: 408 }}>
            <TextInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.currentTarget.value)}
              leftSection={<HugeiconsIcon icon={Search01Icon} size={16} />}
              leftSectionWidth={32}
              styles={{
                input: {
                  height: 48,
                  backgroundColor: 'var(--mantine-color-body)',
                  borderColor: 'var(--mantine-color-default-border)',
                },
              }}
            />
          </Box>
        )}
        {!hideCta && (
          <Button size="lg" color="purple" onClick={onCtaClick} disabled={ctaDisabled}>
            {ctaLabel}
          </Button>
        )}
      </Group>
    </Group>
  )
}

