import { Alert, Box, Button, Skeleton, Stack, Text } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import { InlineEditorDrawer } from '../theme/components/HpyDrawer'
import { supabase } from '../lib/supabase'
import { AG_GRID_DEFAULT_COL_DEF, AG_GRID_DEFAULT_GRID_PROPS } from '../lib/agGridDefaults'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([AllCommunityModule])

type ResidentRow = Record<string, unknown>

const toTitleCase = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

export function ClaudeTest() {
  const [drawerOpened, setDrawerOpened] = useState(false)
  const [residents, setResidents] = useState<ResidentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchResidents = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data, error: supabaseError } = await supabase.from('residents').select('*')
        if (supabaseError) throw supabaseError
        if (!isMounted) return
        setResidents(data ?? [])
      } catch (err) {
        if (!isMounted) return
        setError((err as Error).message || 'Unable to load residents.')
      } finally {
        if (!isMounted) return
        setLoading(false)
      }
    }
    fetchResidents()
    return () => { isMounted = false }
  }, [])

  const columnDefs = useMemo<ColDef[]>(() => {
    const sample = residents[0]
    if (!sample) return []
    return Object.keys(sample).map((key) => ({
      field: key,
      headerName: toTitleCase(key),
      valueFormatter: ({ value }: { value: unknown }) =>
        value === null || value === undefined ? '' : String(value),
    }))
  }, [residents])

  return (
    <>
      <Stack p="xl" style={{ height: '100%' }}>
        <Button onClick={() => setDrawerOpened(true)} style={{ alignSelf: 'flex-start' }}>
          Click Me
        </Button>

        {error ? (
          <Alert color="red" title="Connection Issue">
            <Text size="sm">{error}</Text>
          </Alert>
        ) : loading ? (
          <Stack gap="xs">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={56} radius="md" />
            ))}
          </Stack>
        ) : residents.length === 0 ? (
          <Alert color="yellow" title="No residents found">
            <Text size="sm">The residents table is empty.</Text>
          </Alert>
        ) : (
          <Box style={{ flex: 1, minHeight: 400 }} className="ag-theme-alpine">
            <AgGridReact
              {...AG_GRID_DEFAULT_GRID_PROPS}
              rowData={residents}
              columnDefs={columnDefs}
              defaultColDef={AG_GRID_DEFAULT_COL_DEF}
              overlayNoRowsTemplate="No residents found."
            />
          </Box>
        )}
      </Stack>

      <InlineEditorDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        title="Inline Editor"
        withCloseButton
      >
        <Text>Drawer content goes here.</Text>
      </InlineEditorDrawer>
    </>
  )
}
