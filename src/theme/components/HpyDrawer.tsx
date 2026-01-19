import type { ReactNode } from 'react'
import { ActionIcon, Divider, Drawer, Group, Menu, Stack, Text, ThemeIcon } from '@mantine/core'
import type { ActionIconProps, DrawerProps, GroupProps, MenuProps } from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, MoreVerticalIcon } from '@hugeicons-pro/core-stroke-rounded'

type IconSvgObject = typeof Cancel01Icon

type DrawerHeaderProps = {
  title?: ReactNode
  subtitle?: ReactNode
  eyebrow?: ReactNode
  icon?: IconSvgObject
  withCloseButton?: boolean
  withMoreButton?: boolean
  onClose: () => void
  moreButtonProps?: {
    items?: ReactNode
    menuProps?: MenuProps
    actionIconProps?: ActionIconProps
  }
}

type DrawerSectionProps = {
  items?: ReactNode
  flexProps?: GroupProps
}

export type HpyDrawerProps = Omit<DrawerProps, 'title' | 'opened' | 'onClose' | 'children'> & {
  opened: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  eyebrow?: ReactNode
  icon?: IconSvgObject
  withCloseButton?: boolean
  preventInitialDrawerFocus?: boolean
  withMoreButton?: boolean
  moreButtonProps?: DrawerHeaderProps['moreButtonProps']
  withStatusToggles?: boolean
  statusTogglesProps?: DrawerSectionProps
  withTabs?: boolean
  tabsProps?: { items?: ReactNode }
  withFooter?: boolean
  footerProps?: DrawerSectionProps
  children?: ReactNode
}

function DrawerHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  withCloseButton,
  withMoreButton,
  onClose,
  moreButtonProps,
}: DrawerHeaderProps) {
  return (
    <Group justify="space-between" align="flex-start" gap="md" wrap="nowrap">
      <Group gap="sm" align="center" wrap="nowrap">
        {icon && (
          <ThemeIcon variant="light" color="gray" size={36} radius="xl">
            <HugeiconsIcon icon={icon} size={18} />
          </ThemeIcon>
        )}
        <Stack gap={2}>
          {(title || subtitle) && (
            <Group gap={8} wrap="nowrap">
              {title && (
                <Text fw={600} size="lg">
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text size="sm" c="dimmed">
                  {subtitle}
                </Text>
              )}
            </Group>
          )}
          {eyebrow && (
            <Text size="sm" fw={600} tt="uppercase">
              {eyebrow}
            </Text>
          )}
        </Stack>
      </Group>

      <Group gap="xs">
        {withMoreButton && (
          <Menu position="bottom-end" withinPortal {...moreButtonProps?.menuProps}>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="More actions"
                {...moreButtonProps?.actionIconProps}
              >
                <HugeiconsIcon icon={MoreVerticalIcon} size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>{moreButtonProps?.items}</Menu.Dropdown>
          </Menu>
        )}
        {withCloseButton && (
          <ActionIcon variant="subtle" color="gray" aria-label="Close drawer" onClick={onClose}>
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </ActionIcon>
        )}
      </Group>
    </Group>
  )
}

export function HpyDrawer({
  opened,
  onClose,
  position = 'right',
  title,
  subtitle,
  eyebrow,
  icon,
  withCloseButton = false,
  preventInitialDrawerFocus = false,
  withMoreButton = false,
  moreButtonProps,
  withStatusToggles = false,
  statusTogglesProps,
  withTabs = false,
  tabsProps,
  withFooter = false,
  footerProps,
  children,
  ...drawerProps
}: HpyDrawerProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position={position}
      withCloseButton={false}
      trapFocus={!preventInitialDrawerFocus}
      returnFocus={!preventInitialDrawerFocus}
      {...drawerProps}
    >
      <Stack gap="md">
        <DrawerHeader
          title={title}
          subtitle={subtitle}
          eyebrow={eyebrow}
          icon={icon}
          withCloseButton={withCloseButton}
          withMoreButton={withMoreButton}
          moreButtonProps={moreButtonProps}
          onClose={onClose}
        />

        {withStatusToggles && statusTogglesProps?.items && (
          <>
            <Group gap="md" {...statusTogglesProps.flexProps}>
              {statusTogglesProps.items}
            </Group>
            <Divider />
          </>
        )}

        {withTabs ? tabsProps?.items : children}

        {withFooter && footerProps?.items && (
          <>
            <Divider />
            <Group gap="md" {...footerProps.flexProps}>
              {footerProps.items}
            </Group>
          </>
        )}
      </Stack>
    </Drawer>
  )
}

type InlineEditorDrawerProps = Omit<
  HpyDrawerProps,
  'withTabs' | 'tabsProps' | 'withStatusToggles' | 'statusTogglesProps' | 'withFooter' | 'footerProps'
> & {
  statusToggles?: ReactNode
  tabs?: ReactNode
  footer?: ReactNode
  footerFlexProps?: GroupProps
}

export function InlineEditorDrawer({
  statusToggles,
  tabs,
  footer,
  footerFlexProps,
  ...props
}: InlineEditorDrawerProps) {
  return (
    <HpyDrawer
      withOverlay
      lockScroll
      withStatusToggles={Boolean(statusToggles)}
      statusTogglesProps={{ items: statusToggles }}
      withTabs={Boolean(tabs)}
      tabsProps={{ items: tabs }}
      withFooter={Boolean(footer)}
      footerProps={{ items: footer, flexProps: footerFlexProps }}
      {...props}
    />
  )
}

type WorkflowDrawerProps = Omit<HpyDrawerProps, 'withFooter' | 'footerProps'> & {
  footerLeft?: ReactNode
  footerRight?: ReactNode
  footerFlexProps?: GroupProps
}

export function WorkflowDrawer({
  footerLeft,
  footerRight,
  footerFlexProps,
  ...props
}: WorkflowDrawerProps) {
  return (
    <HpyDrawer
      withOverlay
      lockScroll
      withFooter={Boolean(footerLeft || footerRight)}
      footerProps={{
        items: (
          <>
            {footerLeft}
            <Group gap="md">{footerRight}</Group>
          </>
        ),
        flexProps: { justify: 'space-between', ...footerFlexProps },
      }}
      {...props}
    />
  )
}

type DetailDrawerProps = HpyDrawerProps

export function DetailDrawer(props: DetailDrawerProps) {
  return <HpyDrawer withOverlay={false} lockScroll={false} {...props} />
}

