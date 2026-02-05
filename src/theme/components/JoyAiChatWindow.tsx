import { Box, Group, ScrollArea, Stack, Text, Textarea, UnstyledButton } from '@mantine/core'
import { useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Forward02Icon } from '@hugeicons/core-free-icons'
import { JoyAiIcon } from './JoyAiIcon'

const WELCOME_MESSAGE = `I'm JOYAI, your AI assistant for property and portfolio analysis. I can help you generate insights, strategies, and action plans based on your selected properties. Ask me anything about your portfolio data.`

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function JoyAiChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: WELCOME_MESSAGE },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setLoading(true)
    // Placeholder: simulate reply. Replace with real API call when backend is ready.
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'This is a placeholder reply. Connect JOYAI to your AI backend to analyze property and portfolio data and generate insights, strategies, and action plans.',
        },
      ])
      setLoading(false)
    }, 800)
  }

  return (
    <Stack
      gap={0}
      pt="md"
      px="md"
      style={{
        height: '100%',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Group gap="sm" align="center" mb="md" wrap="nowrap" style={{ flexShrink: 0 }}>
        <Box w={32} h={32} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <JoyAiIcon />
        </Box>
        <Text
          size="xl"
          fw={800}
          variant="gradient"
          gradient={{ from: 'var(--mantine-color-teal-4)', to: 'var(--mantine-color-purple-6)', deg: 90 }}
          style={{ lineHeight: 1.2, letterSpacing: '-0.01em' }}
        >
          Ask Joy Anything
        </Text>
      </Group>

      <ScrollArea
        viewportRef={scrollRef}
        type="auto"
        scrollbarSize="sm"
        style={{ flex: 1, minHeight: 0 }}
        styles={{ viewport: { '& > div': { display: 'block !important' } }, root: { flex: 1, minHeight: 0 } }}
      >
        <Stack gap="md" py="xs" pr="xs">
          {messages.map((msg, i) => (
            <Group
              key={i}
              align="flex-start"
              gap="sm"
              wrap="nowrap"
              style={{
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.role === 'assistant' && (
                <Box style={{ flexShrink: 0 }}>
                  <JoyAiIcon />
                </Box>
              )}
              <Box
                style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor:
                    msg.role === 'user'
                      ? 'color-mix(in srgb, var(--mantine-color-purple-6) 18%, var(--mantine-color-default-hover))'
                      : 'var(--mantine-color-default-hover)',
                  color: 'var(--mantine-color-text)',
                }}
              >
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Text>
              </Box>
            </Group>
          ))}
          {loading && (
            <Group align="flex-start" gap="sm" wrap="nowrap">
              <Box style={{ flexShrink: 0 }}>
                <JoyAiIcon />
              </Box>
              <Text size="sm" c="dimmed" fs="italic">
                JOYAI is thinking...
              </Text>
            </Group>
          )}
        </Stack>
      </ScrollArea>

      <Box p="md" mx="-md" style={{ flexShrink: 0 }}>
        <Group align="flex-end" gap="xs" wrap="nowrap">
          <Textarea
            placeholder="Ask about your portfolio..."
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            minRows={1}
            maxRows={3}
            autosize
            disabled={loading}
            style={{ flex: 1 }}
            styles={{ input: { backgroundColor: 'var(--mantine-color-default-hover)' } }}
          />
          <UnstyledButton
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--mantine-color-purple-6)',
              color: 'white',
              opacity: loading || !input.trim() ? 0.5 : 1,
            }}
            aria-label="Send message"
          >
            <HugeiconsIcon icon={Forward02Icon} size={20} />
          </UnstyledButton>
        </Group>
      </Box>
    </Stack>
  )
}
