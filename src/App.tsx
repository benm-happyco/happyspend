import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, NavLink, Stack, Group, Image, useComputedColorScheme } from '@mantine/core'
import { FormShowcase } from './pages/FormShowcase'
import { ComponentShowcase } from './pages/ComponentShowcase'
import { CustomizedComponents } from './pages/CustomizedComponents'
import { Test } from './pages/Test'
import { HappyProperty } from './pages/HappyProperty'
import { ColorSchemeToggle } from './theme/components/ColorSchemeToggle'

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const logoSrc =
    colorScheme === 'dark'
      ? '/src/assets/logos/wordmarkColor=White.svg'
      : '/src/assets/logos/wordmarkColor=Navy.svg'

  return (
    <Stack gap="md" h="100%" justify="space-between">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Image src={logoSrc} alt="HappyCo" h={24} />
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
            label="Customized Components"
            active={location.pathname === '/customized-components'}
            onClick={() => navigate('/customized-components')}
          />
          <NavLink
            label="Test"
            active={location.pathname === '/test'}
            onClick={() => navigate('/test')}
          />
          <NavLink
            label="Happy Property"
            active={location.pathname === '/happy-property'}
            onClick={() => navigate('/happy-property')}
          />
        </Stack>
      </Stack>
      <Group justify="space-between" align="center">
        <ColorSchemeToggle />
      </Group>
    </Stack>
  )
}

function AppLayout() {
  const location = useLocation()
  const isHappyProperty = location.pathname.startsWith('/happy-property')

  if (isHappyProperty) {
    return (
      <Routes>
        <Route path="/happy-property/*" element={<HappyProperty />} />
      </Routes>
    )
  }

  return (
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
          <Route path="/customized-components" element={<CustomizedComponents />} />
          <Route path="/test" element={<Test />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App

