import { Switch, Group, useMantineColorScheme, useComputedColorScheme } from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import { Sun02Icon, Moon02Icon } from '@hugeicons-pro/core-stroke-rounded'

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  return (
    <Group gap="xs">
      <HugeiconsIcon icon={Moon02Icon} size={16} />
      <Switch
        checked={computedColorScheme === 'dark'}
        onChange={(event) => setColorScheme(event.currentTarget.checked ? 'dark' : 'light')}
        aria-label="Toggle color scheme"
      />
      <HugeiconsIcon icon={Sun02Icon} size={16} />
    </Group>
  )
}

