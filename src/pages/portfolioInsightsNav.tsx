import {
  Brain02Icon,
  Calendar03Icon,
  Calendar04Icon,
  Camera01Icon,
  ChartLineData02Icon,
  DashboardBrowsingIcon,
  File01Icon,
  Flowchart01Icon,
  Folder02Icon,
  InboxIcon,
  Megaphone02Icon,
  PieChartIcon,
  QrCodeIcon,
  Settings05Icon,
  StickyNote02Icon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import { HpyAppIcon } from '../theme/components/HpyAppIcon'
import type { SidebarNavItem } from '../theme/components/HpySidebar'

export const INSIGHTS_BASE = '/happy-property/insights'

export const PORTFOLIO_APP_NAV: SidebarNavItem[] = [
  {
    id: 'inspections',
    label: 'Inspections',
    iconNode: <HpyAppIcon type="Inspections" />,
    expandable: true,
    subItems: [
      { id: 'inspections-schedules', label: 'Schedules', icon: Calendar04Icon },
      { id: 'inspections-reports', label: 'Reports', icon: File01Icon },
      { id: 'inspections-live', label: 'Live', icon: Video01Icon },
    ],
  },
  { id: 'tasks', label: 'Work Orders', iconNode: <HpyAppIcon type="Tasks" /> },
  { id: 'projects', label: 'Projects', iconNode: <HpyAppIcon type="Projects" /> },
  {
    id: 'callManagement',
    label: 'Call Management',
    iconNode: <HpyAppIcon type="Call Management" />,
    expandable: true,
    subItems: [
      { id: 'call-oncall', label: 'On-Call Schedule', icon: Calendar03Icon },
      { id: 'call-messages', label: 'Messages', icon: InboxIcon },
      { id: 'call-notify', label: 'Notify', icon: Megaphone02Icon },
      { id: 'call-settings', label: 'Settings', icon: Settings05Icon },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    iconNode: <HpyAppIcon type="Insights" />,
    expandable: true,
    subItems: [
      { id: 'insights-dashboard', label: 'Dashboard', icon: DashboardBrowsingIcon, path: `${INSIGHTS_BASE}/dashboard` },
      { id: 'insights-analysis', label: 'Detections', icon: ChartLineData02Icon, path: `${INSIGHTS_BASE}/analysis` },
      { id: 'insights-strategy', label: 'Strategy', icon: Brain02Icon, path: `${INSIGHTS_BASE}/strategy` },
      { id: 'insights-approvals', label: 'Approvals', icon: StickyNote02Icon, path: `${INSIGHTS_BASE}/approvals` },
      { id: 'insights-workflows', label: 'Workflows', icon: Flowchart01Icon, path: `${INSIGHTS_BASE}/workflows` },
      { id: 'insights-portfolio', label: 'Portfolio', icon: Camera01Icon, path: `${INSIGHTS_BASE}/snapshots` },
      { id: 'insights-documents', label: 'Documents', icon: Folder02Icon, path: `${INSIGHTS_BASE}/documents` },
      { id: 'insights-region-watch', label: 'Region Watch', icon: ChartLineData02Icon, path: `${INSIGHTS_BASE}/region-watch` },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    iconNode: <HpyAppIcon type="Inventory" />,
    expandable: true,
    subItems: [
      { id: 'inventory-items', label: 'Individual Items', icon: QrCodeIcon },
      { id: 'inventory-models', label: 'Makes/Models', icon: Flowchart01Icon },
    ],
  },
  { id: 'fixed-assets', label: 'Fixed Assets', iconNode: <HpyAppIcon type="Inventory" /> },
]
