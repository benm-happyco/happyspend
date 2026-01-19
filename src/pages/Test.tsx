import {
  Button,
  TextInput,
  PasswordInput,
  Checkbox,
  Stack,
  Title,
  Paper,
  Group,
  Container,
  Alert,
  Loader,
  Text,
} from '@mantine/core'
import { useState, useEffect, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { supabase } from '../lib/supabase'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

// Resident interface - will be dynamically typed based on actual Supabase columns
type Resident = Record<string, any>

export function Test() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    agree: false,
  })

  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchResidents()
  }, [])

  const fetchResidents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First, get all columns by selecting * without ordering to see what exists
      const { data, error: supabaseError } = await supabase
        .from('residents')
        .select('*')
        .limit(50)

      if (supabaseError) {
        throw supabaseError
      }

      if (data) {
        setResidents(data)
      } else {
        setError('No residents table found. Please create a "residents" table in your Supabase database.')
      }
    } catch (err: any) {
      console.error('Error fetching residents:', err)
      
      if (err.code === 'PGRST116') {
        setError('Connection issue: The "residents" table does not exist in your Supabase database. Please create it first.')
      } else if (err.message?.includes('column') && err.message?.includes('does not exist')) {
        setError(`Connection issue: ${err.message}. Please check the actual column names in your Supabase residents table.`)
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Connection issue: Unable to connect to Supabase. Please check your internet connection and Supabase URL in .env.local')
      } else if (err.message?.includes('Invalid API key')) {
        setError('Connection issue: Invalid Supabase API key. Please check your VITE_SUPABASE_ANON_KEY in .env.local')
      } else {
        setError(`Connection issue: ${err.message || 'Unknown error occurred while fetching residents'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login submitted:', formData)
    // Handle login logic here
  }

  const handleCancel = () => {
    setFormData({
      username: '',
      password: '',
      agree: false,
    })
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Title order={1}>Test Page</Title>
        
        <Paper p="xl" withBorder shadow="sm" radius="md">
          <Stack gap="md">
            <Title order={2}>Residents</Title>
            
            {error && (
              <Alert color="red" title="Connection Issue">
                <Text size="sm">{error}</Text>
                <Button 
                  size="sm" 
                  variant="light" 
                  color="red" 
                  mt="md"
                  onClick={fetchResidents}
                >
                  Retry Connection
                </Button>
              </Alert>
            )}

            {loading && !error && (
              <Group justify="center" py="xl">
                <Loader size="md" />
                <Text>Loading residents from Supabase...</Text>
              </Group>
            )}

            {!loading && !error && residents.length === 0 && (
              <Alert color="blue" title="No Data">
                <Text size="sm">No residents found in the database. The table exists but is empty.</Text>
              </Alert>
            )}

            {!loading && !error && residents.length > 0 && (
              <ResidentsGrid residents={residents} />
            )}
          </Stack>
        </Paper>

        <Stack gap="sm" align="center">
          <Group justify="center" gap="md">
            <Button variant="filled" color="blurple">
              Wow
            </Button>
            <Button variant="filled" color="warning">
              Warning
            </Button>
            <Button variant="filled" color="danger">
              Error
            </Button>
          </Group>
          <Button variant="light" size="sm" color="blurple">
            Teeny
          </Button>
        </Stack>

        <Paper p="xl" withBorder shadow="sm" radius="md">
          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              <Title order={2}>Login Form</Title>

              <TextInput
                label="Username"
                placeholder="Enter your username"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.currentTarget.value })}
              />

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.currentTarget.value })}
              />

              <Checkbox
                label="I agree to the terms and conditions"
                checked={formData.agree}
                onChange={(e) => setFormData({ ...formData, agree: e.currentTarget.checked })}
                required
              />

              <Group justify="flex-end" gap="md" mt="md">
                <Button variant="outline" color="gray" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="filled"
                  color="blurple"
                  disabled={!formData.username || !formData.password || !formData.agree}
                >
                  Login
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  )
}

// AG Grid component for residents
function ResidentsGrid({ residents }: { residents: Resident[] }) {
  const columnDefs = useMemo<ColDef[]>(() => {
    if (residents.length === 0) return []

    const dataColumns = Object.keys(residents[0] || {}).map((key) => ({
      field: key,
      headerName: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      flex: 1,
      minWidth: 100,
      sortable: true,
      filter: true,
      resizable: true,
    }))

    return dataColumns
  }, [residents])

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  )

  return (
    <div style={{ height: '600px', width: '100%' }} className="ag-theme-alpine">
      <AgGridReact
        rowData={residents}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        theme="legacy"
        animateRows={true}
        rowSelection={{ mode: 'multiRow', checkboxes: true, headerCheckbox: true }}
        headerHeight={40}
        rowHeight={48}
        pagination={true}
        paginationPageSize={25}
        paginationPageSizeSelector={[10, 25, 50, 100]}
      />
    </div>
  )
}
