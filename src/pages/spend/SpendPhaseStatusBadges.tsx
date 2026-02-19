import { Badge, Group } from '@mantine/core'

const PHASE_COLORS: Record<string, string> = {
  'Planning & Creation': 'gray',
  'Market Engagement': 'green',
  Evaluation: 'blue',
  'Award & Contracting': 'violet',
  Conclusion: 'gray',
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 'gray',
  'Pending Approval': 'yellow',
  Rejected: 'red',
  Scheduled: 'gray',
  Open: 'green',
  'Amendment Draft': 'green',
  Amended: 'green',
  Paused: 'orange',
  Retracted: 'red',
  'Under Review': 'blue',
  'Evaluation Paused': 'orange',
  Shortlisting: 'blue',
  BAFO: 'blue',
  'Closed (No Award)': 'gray',
  'Award Pending': 'yellow',
  Awarded: 'violet',
  Contracting: 'blue',
  Rescinded: 'red',
  Completed: 'violet',
  Converted: 'violet',
  Cancelled: 'red',
}

type SpendPhaseStatusBadgesProps = {
  phase: string
  status: string
}

export function SpendPhaseStatusBadges({ phase, status }: SpendPhaseStatusBadgesProps) {
  const phaseColor = PHASE_COLORS[phase] ?? 'gray'
  const statusColor = STATUS_COLORS[status] ?? 'gray'
  return (
    <Group gap="xs">
      <Badge size="sm" color={phaseColor} variant="light">
        {phase}
      </Badge>
      <Badge size="sm" color={statusColor} variant="light">
        {status}
      </Badge>
    </Group>
  )
}
