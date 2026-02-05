import { Outlet } from 'react-router-dom'
import { InsightsPropertyProvider } from '../contexts/InsightsPropertyContext'
import { UnavailableHighlightProvider } from '../contexts/UnavailableHighlightContext'
import { JoyAiFloatingChat } from '../theme/components/JoyAiFloatingChat'

/**
 * Wraps all Insights subpages with shared context (e.g. property selection).
 * Renders the matched child route via Outlet.
 */
export function InsightsLayout() {
  return (
    <InsightsPropertyProvider>
      <UnavailableHighlightProvider>
        <Outlet />
        <JoyAiFloatingChat />
      </UnavailableHighlightProvider>
    </InsightsPropertyProvider>
  )
}
