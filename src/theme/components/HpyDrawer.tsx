import type { ReactNode } from 'react'
import { ActionIcon, Box, Divider, Drawer, Group, Menu, Stack, Text } from '@mantine/core'
import { useClickOutside } from '@mantine/hooks'
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
  closeOnOutsideClick?: boolean
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
      <Group gap="sm" align="flex-start" wrap="nowrap">
        {icon && <HugeiconsIcon icon={icon} size={24} />}
        <Stack gap={4}>
          {(title || subtitle) && (
            <Group gap={8} wrap="nowrap">
              {title && (
                <Text fw={700} size="xl">
                  {title}
                </Text>
              )}
              {subtitle && (
                <Group gap={8} wrap="nowrap">
                  <Divider orientation="vertical" />
                  <Text size="sm" c="dimmed">
                    {subtitle}
                  </Text>
                </Group>
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

      <Group gap="xs" align="center">
        {withMoreButton && (
          <Menu position="bottom-end" withinPortal {...moreButtonProps?.menuProps}>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="More actions"
                size={32}
                {...moreButtonProps?.actionIconProps}
              >
                <HugeiconsIcon icon={MoreVerticalIcon} size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>{moreButtonProps?.items}</Menu.Dropdown>
          </Menu>
        )}
        {withCloseButton && (
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Close drawer"
            size={32}
            onClick={onClose}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
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
  closeOnOutsideClick = false,
  children,
  ...drawerProps
}: HpyDrawerProps) {
  const contentRef = useClickOutside(() => {
    if (opened && closeOnOutsideClick) {
      onClose()
    }
  })

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position={position}
      zIndex={4000}
      withCloseButton={false}
      trapFocus={!preventInitialDrawerFocus}
      returnFocus={!preventInitialDrawerFocus}
      padding={0}
      size={500}
      styles={{
        overlay: { backgroundColor: 'rgba(59, 55, 153, 0.3)', zIndex: 4000 },
        content: {
          backgroundColor: 'var(--mantine-color-body)',
          boxShadow:
            '0px 7px 7px -5px rgba(0,0,0,0.04), 0px 10px 15px -5px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.05)',
          borderRadius: 'var(--mantine-radius-xl) 0 0 var(--mantine-radius-xl)',
          overflow: 'hidden',
          zIndex: 4001,
        },
        inner: { padding: 0 },
        body: { height: '100%', padding: 0 },
      }}
      {...drawerProps}
    >
      <Box
        ref={contentRef}
        h="100%"
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 32,
        }}
      >
        <Stack gap="xl" style={{ flex: 1, minHeight: 0 }}>
          <Stack gap="xl">
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
              <Group gap="xl" {...statusTogglesProps.flexProps}>
                {statusTogglesProps.items}
              </Group>
            )}
          </Stack>

          <Box style={{ flex: 1, overflowY: 'auto' }}>
            <Stack gap="xl">
              {withTabs ? tabsProps?.items : children}
            </Stack>
          </Box>

          {withFooter && footerProps?.items && (
            <Group gap="lg" justify="flex-end" {...footerProps.flexProps}>
              {footerProps.items}
            </Group>
          )}
        </Stack>
      </Box>
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
  return (
    <HpyDrawer
      withOverlay={false}
      lockScroll={false}
      closeOnClickOutside
      closeOnOutsideClick
      {...props}
    />
  )
}

