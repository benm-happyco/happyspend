import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, NavLink, Stack, Group, Image, useComputedColorScheme } from '@mantine/core'
import { useEffect, useRef } from 'react'
import { FormShowcase } from './pages/FormShowcase'
import { ComponentShowcase } from './pages/ComponentShowcase'
import { CustomizedComponents } from './pages/CustomizedComponents'
import { Test } from './pages/Test'
import { TestV1 } from './pages/TestV1'
import { ClaudeTest } from './pages/ClaudeTest'
import { RedRectTest } from './pages/RedRectTest'
import { HappyProperty } from './pages/HappyProperty'
import { HappyPropertyOnboarding } from './pages/HappyPropertyOnboarding'
import { HappyPropertyTest3 } from './pages/HappyPropertyTest3'
import { HpmResidents } from './pages/HpmResidents'
import { HpmLogbooks } from './pages/HpmLogbooks'
import { HpmDashboard } from './pages/HpmDashboard'
import { HpmVendors } from './pages/HpmVendors'
import { HpmDemoDashboard } from './pages/HpmDemoDashboard'
import { Portfolio } from './pages/Portfolio'
import { HpmInsightsPage } from './pages/HpmInsightsPage'
import { HpmDetectionsPage } from './pages/HpmDetectionsPage'
import { HpmStrategyPage } from './pages/HpmStrategyPage'
import { HpmApprovalsPage } from './pages/HpmApprovalsPage'
import { HpmWorkflowsPage } from './pages/HpmWorkflowsPage'
import { HpmSnapshotsPage } from './pages/HpmSnapshotsPage'
import { HpmDocumentsPage } from './pages/HpmDocumentsPage'
import { HpmRegionWatchPage } from './pages/HpmRegionWatchPage'
import { InsightsLayout } from './pages/InsightsLayout'
import { SpendLayout } from './pages/spend/SpendLayout'
import { SpendDashboard } from './pages/spend/SpendDashboard'
import { SpendEventsList } from './pages/spend/SpendEventsList'
import { SpendEventDetail } from './pages/spend/SpendEventDetail'
import { SpendPlaceholderPage } from './pages/spend/SpendPlaceholderPage'
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
            label="Test V1"
            active={location.pathname === '/test-v1'}
            onClick={() => navigate('/test-v1')}
          />
          <NavLink
            label="Claude Test"
            active={location.pathname === '/claude-test'}
            onClick={() => navigate('/claude-test')}
          />
          <NavLink
            label="Red Rect Test"
            active={location.pathname === '/red-rect-test'}
            onClick={() => navigate('/red-rect-test')}
          />
          <NavLink
            label="Portfolio"
            active={location.pathname === '/happy-property/portfolio'}
            onClick={() => navigate('/happy-property/portfolio')}
          />
          <NavLink
            label="Happy Property"
            active={location.pathname === '/happy-property'}
            onClick={() => navigate('/happy-property')}
          />
          <NavLink
            label="HPM Dashboard"
            active={location.pathname === '/happy-property/dashboard'}
            onClick={() => navigate('/happy-property/dashboard')}
          />
          <NavLink
            label="Logbooks"
            active={location.pathname === '/happy-property/logbooks'}
            onClick={() => navigate('/happy-property/logbooks')}
          />
          <NavLink
            label="Staging API"
            active={location.pathname === '/happy-property/staging-api'}
            onClick={() => navigate('/happy-property/staging-api')}
          />
          <NavLink
            label="Residents"
            active={location.pathname === '/happy-property/residents'}
            onClick={() => navigate('/happy-property/residents')}
          />
          <NavLink
            label="Happy Spend"
            active={location.pathname.startsWith('/happy-spend')}
            onClick={() => navigate('/happy-spend')}
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
  const isHappySpend = location.pathname.startsWith('/happy-spend')
  const defaultTitleRef = useRef<string | null>(null)

  useEffect(() => {
    if (defaultTitleRef.current == null) defaultTitleRef.current = document.title
    document.title = isHappySpend
      ? 'Happy Spend'
      : isHappyProperty
        ? 'Property Graph Demo'
        : (defaultTitleRef.current ?? 'Mantine Theme Showcase')
  }, [isHappyProperty, isHappySpend])

  if (isHappySpend) {
    return (
      <Routes>
        <Route path="/happy-spend" element={<SpendLayout />}>
          <Route index element={<SpendDashboard />} />
          <Route path="projects" element={<SpendPlaceholderPage title="Projects" />} />
          <Route path="events" element={<SpendEventsList />} />
          <Route path="events/:eventId" element={<SpendEventDetail />} />
          <Route path="contracts" element={<SpendPlaceholderPage title="Contracts" />} />
          <Route path="compliance" element={<SpendPlaceholderPage title="Compliance" />} />
          <Route path="analytics" element={<SpendPlaceholderPage title="Analytics" />} />
          <Route path="vendors" element={<SpendPlaceholderPage title="Vendors" />} />
          <Route path="settings" element={<SpendPlaceholderPage title="Settings" />} />
        </Route>
      </Routes>
    )
  }

  if (isHappyProperty) {
    return (
      <Routes>
        <Route path="/happy-property/onboarding" element={<HappyPropertyOnboarding />} />
        <Route path="/happy-property/portfolio" element={<Portfolio />} />
        <Route path="/happy-property/insights" element={<InsightsLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<HpmInsightsPage title="Dashboard" searchPlaceholder="Search dashboard" />} />
          <Route path="analysis" element={<HpmDetectionsPage />} />
          <Route path="strategy" element={<HpmStrategyPage />} />
          <Route path="approvals" element={<HpmApprovalsPage />} />
          <Route path="workflows" element={<HpmWorkflowsPage />} />
          <Route path="snapshots" element={<HpmSnapshotsPage />} />
          <Route path="documents" element={<HpmDocumentsPage />} />
          <Route path="region-watch" element={<HpmRegionWatchPage />} />
        </Route>
        <Route path="/happy-property/dashboard" element={<HpmDashboard />} />
        <Route path="/happy-property/logbooks" element={<HpmLogbooks />} />
        <Route path="/happy-property/vendors" element={<HpmVendors />} />
        <Route path="/happy-property/demo-dashboard" element={<HpmDemoDashboard />} />
        <Route path="/happy-property/staging-api" element={<HappyPropertyTest3 />} />
        <Route path="/happy-property/residents" element={<HpmResidents />} />
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
          <Route path="/test-v1" element={<TestV1 />} />
          <Route path="/claude-test" element={<ClaudeTest />} />
          <Route path="/red-rect-test" element={<RedRectTest />} />
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

