import { ActionIcon, Box, Paper } from '@mantine/core'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { JoyAiChatWindow } from './JoyAiChatWindow'
import { JoyAiIcon } from './JoyAiIcon'

export function JoyAiFloatingChat() {
  const [opened, setOpened] = useState(false)

  return (
    <Box
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 2600,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
        // Don't block clicks on underlying page; only interactive children should capture clicks.
        pointerEvents: 'none',
      }}
    >
      {/* Keep mounted so chat history persists while navigating */}
      <Paper
        withBorder
        radius="md"
        style={{
          width: 380,
          height: 520,
          overflow: 'hidden',
          backgroundColor: 'var(--mantine-color-default)',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.22)',
          opacity: opened ? 1 : 0,
          transform: opened ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 140ms ease, transform 140ms ease',
          pointerEvents: opened ? 'auto' : 'none',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
          }}
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Close JOYAI chat"
            onClick={() => setOpened(false)}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </ActionIcon>
        </Box>
        <JoyAiChatWindow />
      </Paper>

      <ActionIcon
        size={56}
        radius={999}
        aria-label={opened ? 'Hide JOYAI chat' : 'Open JOYAI chat'}
        onClick={() => setOpened((v) => !v)}
        style={{
          background: 'transparent',
          boxShadow: 'none',
          pointerEvents: 'auto',
        }}
      >
        <JoyAiIcon size={56} alt="JOYAI" />
      </ActionIcon>
    </Box>
  )
}

