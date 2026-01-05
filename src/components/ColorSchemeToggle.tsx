import { Switch, Group, useMantineColorScheme, useComputedColorScheme, Text } from '@mantine/core'

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  return (
    <Group gap="xs">
      <Text size="sm">🌙</Text>
      <Switch
        checked={computedColorScheme === 'dark'}
        onChange={(event) => setColorScheme(event.currentTarget.checked ? 'dark' : 'light')}
        aria-label="Toggle color scheme"
      />
      <Text size="sm">☀️</Text>
    </Group>
  )
}

