import { Box, Stack, Title } from '@mantine/core'
import { useMantineTheme } from '@mantine/core'

export function RedRectTest() {
  const theme = useMantineTheme()

  return (
    <Stack gap="md" align="flex-start">
      <Title order={1}>Red Rectangle Test</Title>
      <Box
        w={100}
        h={100}
        style={{ backgroundColor: theme.colors.red[0] }}
      />
    </Stack>
  )
}
