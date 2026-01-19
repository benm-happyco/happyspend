import { Badge, Box, Combobox, useCombobox, useMantineTheme } from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import type { BadgeProps } from '@mantine/core'
import {
  Alert02Icon,
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  EnergyIcon,
  Forward02Icon,
  HourglassIcon,
  NotificationOff02Icon,
  Progress03Icon,
  RemoveCircleIcon,
  Rocket01Icon,
  SignalFull02Icon,
  SignalMedium02Icon,
  SignalNo02Icon,
  StarIcon,
  StopIcon,
  TimeScheduleIcon,
  TriangleIcon,
  ViewIcon,
  PauseIcon,
} from '@hugeicons-pro/core-stroke-rounded'

type IconSvgObject = typeof RemoveCircleIcon

type StatusBadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'

type StatusBadgeDefinition = {
  statusKey: string
  label: string
  icon: IconSvgObject
  tone: StatusBadgeTone
}

export type StatusBadgeStatus =
  | 'CANCELED'
  | 'EXPIRED'
  | 'INACTIVE'
  | 'DRAFT'
  | 'NORMAL'
  | 'NOT_SETUP'
  | 'READY_TO_START'
  | 'EARLY_ACCESS'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'COMPLETE'
  | 'CONNECTED'
  | 'ON_TRACK'
  | 'OPEN'
  | 'RELEASED'
  | 'ON_HOLD'
  | 'FOR_REVIEW'
  | 'MUTED'
  | 'UNSTABLE'
  | 'DISCONNECTED'
  | 'OFF_TRACK'
  | 'URGENT'

const STATUS_BADGES: Record<StatusBadgeStatus, StatusBadgeDefinition> = {
  CANCELED: { statusKey: 'CANCELED', label: 'Canceled', icon: RemoveCircleIcon, tone: 'neutral' },
  EXPIRED: { statusKey: 'EXPIRED', label: 'Expired', icon: HourglassIcon, tone: 'neutral' },
  INACTIVE: { statusKey: 'INACTIVE', label: 'Inactive', icon: StopIcon, tone: 'neutral' },
  DRAFT: { statusKey: 'DRAFT', label: 'Draft', icon: Progress03Icon, tone: 'neutral' },
  NORMAL: { statusKey: 'NORMAL', label: 'Normal', icon: CircleIcon, tone: 'neutral' },
  NOT_SETUP: { statusKey: 'NOT_SETUP', label: 'Not Setup', icon: SignalNo02Icon, tone: 'neutral' },
  READY_TO_START: { statusKey: 'READY_TO_START', label: 'Ready to Start', icon: CircleIcon, tone: 'primary' },
  EARLY_ACCESS: { statusKey: 'EARLY_ACCESS', label: 'Early Access', icon: Rocket01Icon, tone: 'primary' },
  SCHEDULED: { statusKey: 'SCHEDULED', label: 'Scheduled', icon: TimeScheduleIcon, tone: 'primary' },
  ACTIVE: { statusKey: 'ACTIVE', label: 'Active', icon: EnergyIcon, tone: 'success' },
  IN_PROGRESS: { statusKey: 'IN_PROGRESS', label: 'In Progress', icon: Progress03Icon, tone: 'success' },
  COMPLETE: { statusKey: 'COMPLETE', label: 'Complete', icon: CheckmarkCircle02Icon, tone: 'success' },
  CONNECTED: { statusKey: 'CONNECTED', label: 'Connected', icon: SignalFull02Icon, tone: 'success' },
  ON_TRACK: { statusKey: 'ON_TRACK', label: 'On Track', icon: Forward02Icon, tone: 'success' },
  OPEN: { statusKey: 'OPEN', label: 'Open', icon: CircleIcon, tone: 'success' },
  RELEASED: { statusKey: 'RELEASED', label: 'Released', icon: StarIcon, tone: 'success' },
  ON_HOLD: { statusKey: 'ON_HOLD', label: 'On Hold', icon: PauseIcon, tone: 'warning' },
  FOR_REVIEW: { statusKey: 'FOR_REVIEW', label: 'For Review', icon: ViewIcon, tone: 'warning' },
  MUTED: { statusKey: 'MUTED', label: 'Muted', icon: NotificationOff02Icon, tone: 'warning' },
  UNSTABLE: { statusKey: 'UNSTABLE', label: 'Unstable', icon: SignalMedium02Icon, tone: 'warning' },
  DISCONNECTED: { statusKey: 'DISCONNECTED', label: 'Disconnected', icon: SignalNo02Icon, tone: 'danger' },
  OFF_TRACK: { statusKey: 'OFF_TRACK', label: 'Off Track', icon: Alert02Icon, tone: 'danger' },
  URGENT: { statusKey: 'URGENT', label: 'Urgent', icon: TriangleIcon, tone: 'danger' },
}

export const STATUS_BADGE_KEYS = Object.keys(STATUS_BADGES) as StatusBadgeStatus[]

type StatusBadgeCustomStatus = {
  statusKey: string
  label: string
  icon: IconSvgObject
  tone?: StatusBadgeTone
}

export type StatusBadgeProps = Omit<BadgeProps, 'component' | 'children' | 'leftSection' | 'rightSection'> & {
  status: StatusBadgeStatus | StatusBadgeCustomStatus
  condensed?: boolean
  withBorder?: boolean
  component?: 'div' | 'button'
  interactive?: boolean
}

type StatusBadgeSelectProps = Omit<StatusBadgeProps, 'status' | 'interactive'> & {
  value: StatusBadgeStatus | null
  onChange: (value: StatusBadgeStatus) => void
  options?: StatusBadgeStatus[]
  emptyStatus?: StatusBadgeCustomStatus
}

const resolveStatusDefinition = (status: StatusBadgeProps['status']): StatusBadgeDefinition => {
  if (typeof status === 'string') {
    return STATUS_BADGES[status]
  }

  return {
    statusKey: status.statusKey,
    label: status.label,
    icon: status.icon,
    tone: status.tone ?? 'neutral',
  }
}

const resolveToneColors = (theme: ReturnType<typeof useMantineTheme>, tone: StatusBadgeTone, color?: BadgeProps['color']) => {
  const themeColor = color && theme.colors[color] ? theme.colors[color] : null

  if (themeColor) {
    return {
      background: themeColor[0],
      iconColor: themeColor[6] ?? themeColor[5] ?? themeColor[4],
    }
  }

  switch (tone) {
    case 'primary':
      return { background: theme.colors.blurple[0], iconColor: theme.colors.blurple[6] }
    case 'success':
      return { background: theme.colors.green[0], iconColor: theme.colors.green[6] }
    case 'warning':
      return { background: theme.colors.yellow[0], iconColor: theme.colors.yellow[6] }
    case 'danger':
      return { background: theme.colors.red[0], iconColor: theme.colors.red[6] }
    default:
      return { background: theme.colors.gray[0], iconColor: theme.colors.gray[6] }
  }
}

export function StatusBadge({
  status,
  condensed = false,
  withBorder = false,
  component = 'div',
  interactive = false,
  color,
  ...props
}: StatusBadgeProps) {
  const theme = useMantineTheme()
  const definition = resolveStatusDefinition(status)
  const isIconOnly = condensed
  const toneColors = resolveToneColors(theme, definition.tone, color)

  return (
    <Badge
      component={component}
      color={color}
      styles={{
        root: {
          height: 26,
          minWidth: isIconOnly ? 26 : undefined,
          paddingLeft: 8,
          paddingRight: 8,
          borderRadius: theme.radius.sm,
          backgroundColor: toneColors.background,
          border: withBorder ? `1px solid var(--mantine-color-default-border)` : 'none',
          cursor: component === 'button' ? 'pointer' : 'default',
        },
        label: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: theme.fontSizes.xs,
          fontWeight: 700,
          lineHeight: '15px',
          color: 'var(--mantine-color-text)',
        },
        section: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
      leftSection={<HugeiconsIcon icon={definition.icon} size={16} color={toneColors.iconColor} />}
      rightSection={
        interactive ? <HugeiconsIcon icon={ArrowDown01Icon} size={12} color={theme.colors.gray[6]} /> : undefined
      }
      {...props}
    >
      {!isIconOnly && definition.label}
    </Badge>
  )
}

export function StatusBadgeSelect({
  value,
  onChange,
  options = STATUS_BADGE_KEYS,
  emptyStatus = { statusKey: 'EMPTY', label: 'Empty', icon: RemoveCircleIcon, tone: 'neutral' },
  withBorder = false,
  condensed = false,
  ...props
}: StatusBadgeSelectProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  const currentStatus = value ?? emptyStatus

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      width="auto"
      onOptionSubmit={(nextValue) => {
        combobox.closeDropdown()
        onChange(nextValue as StatusBadgeStatus)
      }}
      transitionProps={{ transition: 'fade-down', duration: 150 }}
    >
      <Combobox.Target>
        <StatusBadge
          status={currentStatus}
          component="button"
          type="button"
          interactive
          withBorder={withBorder && Boolean(value)}
          condensed={condensed}
          onClick={() => combobox.toggleDropdown()}
          {...props}
        />
      </Combobox.Target>
      <Combobox.Dropdown maw={200}>
        <Combobox.Options>
          {options.map((statusKey) => (
            <Combobox.Option key={statusKey} value={statusKey}>
              <Box w="100%" my={3}>
                <StatusBadge status={statusKey} withBorder={withBorder && value === statusKey} condensed={condensed} />
              </Box>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}

