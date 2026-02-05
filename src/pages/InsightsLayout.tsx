import { Outlet, useLocation } from 'react-router-dom'
import { InsightsPropertyProvider } from '../contexts/InsightsPropertyContext'
import { UnavailableHighlightProvider } from '../contexts/UnavailableHighlightContext'
import { JoyAiFloatingChat } from '../theme/components/JoyAiFloatingChat'

/**
 * Wraps all Insights subpages with shared context (e.g. property selection).
 * Renders the matched child route via Outlet.
 */
export function InsightsLayout() {
  const location = useLocation()
  const hideFloatingJoyAi = location.pathname.includes('/happy-property/insights/workflows')

  return (
    <InsightsPropertyProvider>
      <UnavailableHighlightProvider>
        <Outlet />
        {!hideFloatingJoyAi && <JoyAiFloatingChat />}
      </UnavailableHighlightProvider>
    </InsightsPropertyProvider>
  )
}
