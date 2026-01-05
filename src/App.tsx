import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, NavLink, Stack, Group, Title } from '@mantine/core'
import { FormShowcase } from './pages/FormShowcase'
import { ComponentShowcase } from './pages/ComponentShowcase'
import { Test } from './pages/Test'
import { ColorSchemeToggle } from './components/ColorSchemeToggle'

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={4}>Mantine Theme</Title>
        <ColorSchemeToggle />
      </Group>
      <Stack gap="xs">
        <NavLink
          label="Form Showcase"
          active={location.pathname === '/'}
          onClick={() => navigate('/')}
        />
        <NavLink
          label="Component Showcase"
          active={location.pathname === '/components'}
          onClick={() => navigate('/components')}
        />
        <NavLink
          label="Test"
          active={location.pathname === '/test'}
          onClick={() => navigate('/test')}
        />
      </Stack>
    </Stack>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell
        navbar={{
          width: 250,
          breakpoint: 'sm',
        }}
        padding="md"
      >
        <AppShell.Navbar p="md">
          <Navigation />
        </AppShell.Navbar>

        <AppShell.Main style={{ overflowY: 'auto', height: '100vh' }}>
          <Routes>
            <Route path="/" element={<FormShowcase />} />
            <Route path="/components" element={<ComponentShowcase />} />
            <Route path="/test" element={<Test />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </BrowserRouter>
  )
}

export default App

