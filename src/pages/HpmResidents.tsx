import { Alert, Box, Skeleton, Stack, Text } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'
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

export function HpmResidents() {
  const [residents, setResidents] = useState<ResidentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    let isMounted = true
    const fetchResidents = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data, error: supabaseError } = await supabase.from('residents').select('*')

        if (supabaseError) {
          throw supabaseError
        }

        if (!isMounted) return
        setResidents(data ?? [])
      } catch (err) {
        if (!isMounted) return
        const message =
          (err as Error).message ||
          'Connection issue: Unable to load residents from Supabase. Check your residents table.'
        setError(message)
      } finally {
        if (!isMounted) return
        setLoading(false)
      }
    }

    fetchResidents()

    return () => {
      isMounted = false
    }
  }, [])

  const columnDefs = useMemo<ColDef[]>(() => {
    const sample = residents[0]
    if (!sample) return []
    return Object.keys(sample).map((key) => ({
      field: key,
      headerName: toTitleCase(key),
      flex: 1,
      minWidth: 140,
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: ({ value }) => (value === null || value === undefined ? '' : String(value)),
    }))
  }, [residents])

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
              title="Residents"
              appIconType="Tasks"
              searchPlaceholder="Search residents"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              ctaLabel="Add Resident"
            />
            <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
              {error ? (
                <Alert color="red" title="Connection Issue">
                  <Text size="sm">{error}</Text>
                </Alert>
              ) : loading ? (
                <Stack gap="xs">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} height={56} radius="md" />
                  ))}
                </Stack>
              ) : residents.length === 0 ? (
                <Alert color="yellow" title="No residents found">
                  <Text size="sm">The residents table is empty.</Text>
                </Alert>
              ) : (
                <Box style={{ flex: 1, minHeight: 0 }} className="ag-theme-alpine">
                  <AgGridReact
                    {...AG_GRID_DEFAULT_GRID_PROPS}
                    rowData={residents}
                    columnDefs={columnDefs}
                    defaultColDef={AG_GRID_DEFAULT_COL_DEF}
                    quickFilterText={searchValue}
                    overlayNoRowsTemplate="No residents found."
                  />
                </Box>
              )}
            </Stack>
          </Stack>
        </Box>
      </Box>
    </>
  )
}
