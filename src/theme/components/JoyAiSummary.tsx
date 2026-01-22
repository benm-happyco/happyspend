import { Group, Stack, Text } from '@mantine/core'
import { JoyAiIcon } from './JoyAiIcon'

type JoyAiSummaryProps = {
  summary: string
}

export function JoyAiSummary({ summary }: JoyAiSummaryProps) {
  return (
    <Stack gap={4}>
      <Group gap="xs" align="center">
        <JoyAiIcon />
        <Text
          size="sm"
          fw={600}
          variant="gradient"
          gradient={{ from: 'var(--mantine-color-teal-4)', to: 'var(--mantine-color-blurple-6)', deg: 90 }}
        >
          Summary by JoyAI
        </Text>
      </Group>
      <Text size="md">{summary}</Text>
    </Stack>
  )
}
