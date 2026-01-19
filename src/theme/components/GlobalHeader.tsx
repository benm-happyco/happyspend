import { ActionIcon, Avatar, Box, Group, Image, Text, useComputedColorScheme, useMantineColorScheme, useMantineTheme } from '@mantine/core'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Briefcase03Icon,
  GridIcon,
  More03Icon,
  HelpCircleIcon,
  Home03Icon,
  Mortarboard02Icon,
  Notification02Icon,
  Moon02Icon,
  Settings01Icon,
  Sun02Icon,
} from '@hugeicons-pro/core-stroke-rounded'
import logoWhite from '../../assets/logos/Mark=Face, Color=White.png'
import techAvatar from '../../assets/figma/4f423e193b1940a23e8e55793ecfd0ab4dde1ba5.png'

const HEADER_HEIGHT = 56

type GlobalHeaderVariant = 'product' | 'settings'

type GlobalHeaderProps = {
  variant?: GlobalHeaderVariant
  productTitle?: string
  showExperienceSwitcher?: boolean
  showRightIcons?: boolean
}

export function GlobalHeader({
  variant = 'product',
  productTitle,
  showExperienceSwitcher = true,
  showRightIcons = true,
}: GlobalHeaderProps) {
  const theme = useMantineTheme()
  const { setColorScheme } = useMantineColorScheme()
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const isDark = colorScheme === 'dark'
  const backgroundColor = theme.colors.navy[9]

  const actionIconStyles = {
    root: {
      color: theme.white,
      width: 24,
      height: 24,
    },
  }

  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_HEIGHT,
        backgroundColor,
        zIndex: theme.zIndex?.appShell ?? theme.zIndex?.modal ?? 2000,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
      }}
    >
      <Group justify="space-between" style={{ width: '100%' }}>
        <Group gap="md">
          <Image src={logoWhite} alt="HappyCo" h={21} w={24} />
          {showExperienceSwitcher && (
            <ActionIcon variant="transparent" aria-label="Experience switcher" styles={actionIconStyles}>
              <HugeiconsIcon icon={More03Icon} size={20} />
            </ActionIcon>
          )}
          {productTitle && (
            <Text fw={700} size="md" c="white">
              {productTitle}
            </Text>
          )}
          {variant === 'product' && (
            <Group gap="sm">
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 32,
                  padding: '4px 12px 4px 8px',
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.blurple[6],
                  color: theme.white,
                }}
              >
                <HugeiconsIcon icon={Briefcase03Icon} size={16} />
                <Text size="sm" fw={600}>
                  Pinnacle Living
                </Text>
              </Box>
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 32,
                  padding: '4px 12px 4px 8px',
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.navy[7],
                  color: theme.white,
                }}
              >
                <HugeiconsIcon icon={Home03Icon} size={16} />
                <Text size="sm" fw={600}>
                  Capitol Heights
                </Text>
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
              </Box>
            </Group>
          )}
          {variant === 'settings' && (
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 32,
                padding: '4px 12px',
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.blurple[6],
                color: theme.white,
              }}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              <Text size="sm" fw={600}>
                Exit Settings
              </Text>
            </Box>
          )}
        </Group>
        {showRightIcons && (
          <Group gap="md">
            <ActionIcon variant="transparent" aria-label="Education" styles={actionIconStyles}>
              <HugeiconsIcon icon={Mortarboard02Icon} size={20} />
            </ActionIcon>
            <ActionIcon variant="transparent" aria-label="Help" styles={actionIconStyles}>
              <HugeiconsIcon icon={HelpCircleIcon} size={20} />
            </ActionIcon>
            <ActionIcon variant="transparent" aria-label="Settings" styles={actionIconStyles}>
              <HugeiconsIcon icon={Settings01Icon} size={20} />
            </ActionIcon>
            <ActionIcon variant="transparent" aria-label="Notifications" styles={actionIconStyles}>
              <HugeiconsIcon icon={Notification02Icon} size={20} />
            </ActionIcon>
            <ActionIcon
              variant="transparent"
              aria-label="Toggle color scheme"
              styles={actionIconStyles}
              onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
            >
              <HugeiconsIcon icon={isDark ? Sun02Icon : Moon02Icon} size={20} />
            </ActionIcon>
            <Avatar src={techAvatar} radius="xl" size={32} />
          </Group>
        )}
      </Group>
    </Box>
  )
}

export const GLOBAL_HEADER_HEIGHT = HEADER_HEIGHT

