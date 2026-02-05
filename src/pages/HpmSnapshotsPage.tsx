import { InsightsPageShell } from './InsightsPageShell'
import { PortfolioSnapshotContent } from './PortfolioSnapshotContent'

export function HpmSnapshotsPage() {
  return (
    <InsightsPageShell title="Portfolio" hideHeaderFilters>
      <PortfolioSnapshotContent />
    </InsightsPageShell>
  )
}
