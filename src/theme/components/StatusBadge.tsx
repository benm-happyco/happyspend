import { Badge, Box, Combobox, UnstyledButton, useCombobox, useMantineTheme } from '@mantine/core'
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

const STATUS_BADGE_DROPDOWN_KEYS: StatusBadgeStatus[] = [
  'CANCELED',
  'FOR_REVIEW',
  'ACTIVE',
  'COMPLETE',
  'SCHEDULED',
]

type StatusBadgeCustomStatus = {
  statusKey: string
  label: string
  icon: IconSvgObject
  tone?: StatusBadgeTone
}

const hexToRgba = (value: string, alpha: number) => {
  const hex = value.replace('#', '')
  const normalized =
    hex.length === 3 ? hex.split('').map((char) => `${char}${char}`).join('') : hex
  if (normalized.length !== 6) {
    return value
  }
  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) {
    return value
  }
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export type StatusBadgeProps = Omit<BadgeProps, 'component' | 'children' | 'leftSection' | 'rightSection'> & {
  status: StatusBadgeStatus | StatusBadgeCustomStatus
  condensed?: boolean
  withBorder?: boolean
  component?: 'div' | 'button'
  interactive?: boolean
  presentation?: 'default' | 'menu'
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
  const alpha = 0.1

  if (themeColor) {
    const baseColor = themeColor[6] ?? themeColor[5] ?? themeColor[4]
    return {
      background: hexToRgba(baseColor, alpha),
      iconColor: baseColor,
    }
  }

  switch (tone) {
    case 'primary':
      return {
        background: hexToRgba(theme.colors.blurple[6], alpha),
        iconColor: theme.colors.blurple[6],
      }
    case 'success':
      return {
        background: hexToRgba(theme.colors.green[6], alpha),
        iconColor: theme.colors.green[6],
      }
    case 'warning':
      return {
        background: hexToRgba(theme.colors.yellow[6], alpha),
        iconColor: theme.colors.yellow[6],
      }
    case 'danger':
      return {
        background: hexToRgba(theme.colors.red[6], alpha),
        iconColor: theme.colors.red[6],
      }
    default:
      return {
        background: hexToRgba(theme.colors.gray[6], alpha),
        iconColor: theme.colors.gray[6],
      }
  }
}

const toTitleCase = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const resolveDisplayLabel = (status: StatusBadgeProps['status'], definition: StatusBadgeDefinition) => {
  if (typeof status !== 'string') {
    return toTitleCase(status.label)
  }

  return toTitleCase(definition.label)
}

export function StatusBadge({
  status,
  condensed = false,
  withBorder = false,
  component = 'div',
  interactive = false,
  presentation = 'default',
  color,
  ...props
}: StatusBadgeProps) {
  const theme = useMantineTheme()
  const definition = resolveStatusDefinition(status)
  const displayLabel = resolveDisplayLabel(status, definition)
  const isIconOnly = condensed
  const isMenuPresentation = presentation === 'menu'
  const toneColors = resolveToneColors(theme, definition.tone, color)
  const iconElement = <HugeiconsIcon icon={definition.icon} size={16} color={toneColors.iconColor} />

  return (
    <Badge
      component={component}
      color={color}
      styles={{
        root: {
          height: 26,
          minWidth: isIconOnly ? 26 : undefined,
          width: isIconOnly ? 26 : isMenuPresentation ? '100%' : undefined,
          justifyContent: isIconOnly ? 'center' : isMenuPresentation ? 'flex-start' : undefined,
          paddingLeft: isIconOnly ? 0 : 8,
          paddingRight: isIconOnly ? 0 : 8,
          borderRadius: theme.radius.sm,
          backgroundColor: toneColors.background,
          border: 'none',
          cursor: interactive ? 'pointer' : 'default',
        },
        label: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: isIconOnly ? 0 : 8,
          width: isIconOnly ? '100%' : undefined,
          justifyContent: isIconOnly ? 'center' : undefined,
          fontSize: isMenuPresentation ? theme.fontSizes.sm : theme.fontSizes.xs,
          fontWeight: 700,
          lineHeight: isMenuPresentation ? '20.3px' : '15px',
          color: 'var(--mantine-color-text)',
          textTransform: 'none',
        },
        section: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: isIconOnly ? 0 : undefined,
          marginRight: isIconOnly ? 0 : undefined,
          marginLeft: isIconOnly ? 0 : undefined,
        },
      }}
      leftSection={isIconOnly ? undefined : iconElement}
      rightSection={
        interactive && !isIconOnly ? <HugeiconsIcon icon={ArrowDown01Icon} size={12} color={theme.colors.gray[6]} /> : undefined
      }
      {...props}
    >
      {isIconOnly ? iconElement : displayLabel}
    </Badge>
  )
}

export function StatusBadgeSelect({
  value,
  onChange,
  options = STATUS_BADGE_DROPDOWN_KEYS,
  emptyStatus = { statusKey: 'EMPTY', label: 'Empty', icon: RemoveCircleIcon, tone: 'neutral' },
  withBorder = false,
  condensed = false,
  ...props
}: StatusBadgeSelectProps) {
  const theme = useMantineTheme()
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  const currentStatus = value ?? emptyStatus

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      width="auto"
      position="bottom-start"
      middlewares={{ flip: true, shift: true }}
      styles={{
        dropdown: {
          padding: 8,
          borderRadius: theme.radius.sm,
          border: '1px solid var(--mantine-color-default-border)',
          backgroundColor: 'var(--mantine-color-body)',
          boxShadow: 'none',
        },
        options: {
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: 0,
        },
        option: {
          padding: 0,
          backgroundColor: 'transparent',
        },
      }}
      onOptionSubmit={(nextValue) => {
        combobox.closeDropdown()
        onChange(nextValue as StatusBadgeStatus)
      }}
      transitionProps={{ transition: 'fade-down', duration: 150 }}
    >
      <Combobox.Target>
        <UnstyledButton type="button" onClick={() => combobox.toggleDropdown()} style={{ cursor: 'pointer' }}>
          <StatusBadge
            status={currentStatus}
            component="button"
            interactive
            withBorder={withBorder && Boolean(value)}
            condensed={condensed}
            {...props}
          />
        </UnstyledButton>
      </Combobox.Target>
      <Combobox.Dropdown maw={200}>
        <Combobox.Options>
          {options.map((statusKey) => (
            <Combobox.Option key={statusKey} value={statusKey}>
              <Box w="100%">
                <StatusBadge
                  status={statusKey}
                  withBorder={withBorder && value === statusKey}
                  condensed={false}
                  presentation="menu"
                />
              </Box>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}

