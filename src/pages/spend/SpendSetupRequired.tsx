import { Alert, Box, Code, Stack, Text } from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon } from '@hugeicons/core-free-icons'

type SpendSetupRequiredProps = {
  /** Raw error message from the API (e.g. 404) */
  error?: string | null
}

/**
 * Shown when Supabase returns 404 or error for sourcing_events — table not created yet.
 * Tells the user to run the migration and seed in Supabase SQL Editor.
 */
export function SpendSetupRequired({ error }: SpendSetupRequiredProps) {
  return (
    <Alert
      color="orange"
      title="Happy Spend setup required"
      icon={<HugeiconsIcon icon={Alert02Icon} size={20} />}
    >
      <Stack gap="sm">
        <Text size="sm">
          The <Code>sourcing_events</Code> table was not found in your Supabase project. Create it and add sample data with these steps:
        </Text>
        <Box component="ol" style={{ margin: 0, paddingLeft: 20 }}>
          <Text size="sm" component="li">
            Open your Supabase project → SQL Editor.
          </Text>
          <Text size="sm" component="li">
            Run the migration: open <Code>supabase/migrations/20260219000001_create_sourcing_events.sql</Code> in this repo, copy its contents, and execute it in the SQL Editor.
          </Text>
          <Text size="sm" component="li">
            Run the seed: open <Code>supabase/seed_sourcing_events.sql</Code>, copy its contents, and execute it to insert 20 sample events.
          </Text>
        </Box>
        {error && (
          <Text size="xs" c="dimmed">
            Error: {error}
          </Text>
        )}
      </Stack>
    </Alert>
  )
}
