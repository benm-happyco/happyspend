import { Box, Group, ScrollArea, Stack, Text, Textarea, UnstyledButton } from '@mantine/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Forward02Icon } from '@hugeicons/core-free-icons'
import { useLocation } from 'react-router-dom'
import { JoyAiIcon } from './JoyAiIcon'
import { useInsightsPropertySelectionOptional } from '../../contexts/InsightsPropertyContext'

const WELCOME_GENERAL = `I'm JOYAI, your AI assistant for property and portfolio analysis. I can help you generate insights, strategies, and action plans based on your selected properties. Ask me anything about your portfolio data.`
const WELCOME_WORKFLOWS = `I'm JOYAI. Tell me what you want to optimize and I’ll propose a workflow: triggers, steps, owners, and guardrails.\n\nTry: “Show active workflows”, “Build a turn time workflow”, or “Optimize vendor SLA setup”.`

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME_SPEND = `I'm JOYAI, your sourcing assistant. I can help you create sourcing events, move them through their lifecycle, and complete RFx workflows.\n\nTry: "Create a new RFQ for HVAC replacement", "Open Parking Lot Resurfacing for bidding", "Submit HVAC for approval", "Recommend award for Lobby Renovation", or "Show events needing action".`

export type SpendAction =
  | { type: 'create_event'; name: string; eventType?: 'RFQ' | 'RFP' | 'RFI'; budget?: number }
  | { type: 'update_status'; eventIdOrName: string; newStatus: string }

type SpendContext = { eventId?: string; eventName?: string }

type JoyAiChatWindowProps = {
  mode?: 'general' | 'workflows' | 'spend'
  draft?: string
  onDraftChange?: (value: string) => void
  focusKey?: number
  showHeader?: boolean
  spendContext?: SpendContext
  onSpendAction?: (action: SpendAction) => void | Promise<void>
}

function normalize(text: string) {
  return text.trim().toLowerCase()
}

function simulateWorkflowsReply(message: string, ctx: { depth: number; lastIntent: string | null }) {
  const m = normalize(message)

  const intent =
    m.includes('show active') || m.includes('active workflows')
      ? 'show-active'
      : m.includes('turn time') || m.includes('make ready') || m.includes('turn-time')
        ? 'build-turn'
        : m.includes('vendor sla') || m.includes('sla')
          ? 'optimize-sla'
          : m.includes('loss to lease') || m.includes('ltl') || m.includes('lease audit')
            ? 'reduce-ltl'
            : 'generic'

  // second-level answers: if user asks "yes" or "do it" after a specific plan
  const isFollowUp = ctx.depth >= 1 && (m === 'yes' || m.startsWith('yes,') || m.includes('do it') || m.includes('sounds good') || m.includes('next'))

  const finalIntent = isFollowUp && ctx.lastIntent && intent === 'generic' ? ctx.lastIntent : intent

  if (finalIntent === 'show-active') {
    return `Here’s what’s active right now (demo):\n\n- **Running (3)**: 2 on track, 1 waiting on vendor scheduling\n- **Actions pending (3)**: 2 due today, 1 due tomorrow\n- **Est savings (active)**: ~$37k/mo across revenue + ops workflows\n\nHigh-level actions I’d take next:\n1) Approve the lease audit ruleset (unblocks $9.1k/mo)\n2) Get vendor acknowledgment on SLA enforcement (prevents drift)\n3) Confirm schedule for the envelope inspection window\n\nWant me to generate a 7‑day “next actions” checklist by property?`
  }

  if (finalIntent === 'build-turn') {
    if (!isFollowUp) {
      return `Great — here’s a **Turn Time Compression** workflow draft (demo):\n\n**Trigger(s)**\n- Ready-date drift > 2 days for a building OR vendor ETA slips twice\n\n**Steps (5)**\n1) Detect drift + assign “Turn Captain”\n2) Auto-schedule vendor blocks + materials check\n3) Daily checkpoint until Ready\n4) If drift persists: escalate vendor SLA + swap vendor option\n5) Close-out: capture root cause + update playbook\n\n**Guardrails**\n- Don’t reschedule residents within 48h of move-in\n- Escalation only if > 2 units impacted OR rent loss > $2k\n\nIf you want, I can tailor this to **your current bottleneck**: vendor scheduling vs materials vs inspections. Which one is it?`
    }
    return `Perfect — I’ll tailor it to **vendor scheduling** (most common).\n\n**Tightened SLA rules**\n- ETA required within 4 business hours\n- Auto-escalate if “Waiting” status > 24 hours\n\n**Automations**\n- Pre-book a backup vendor slot (holds a 2‑hour window)\n- Auto-send a daily schedule digest to onsite lead\n\n**Next steps**\n- Pick the “Turn Captain” role (PM vs Maintenance Supervisor)\n- Choose escalation contacts\n- Set your default vendor pool (primary + 2 backups)\n\nWant this workflow to auto-create a weekly report (turn days saved + $ recovered)?`
  }

  if (finalIntent === 'optimize-sla') {
    if (!isFollowUp) {
      return `Here’s how I’d **optimize Vendor SLA** setup (demo) without being annoying:\n\n**1) Define 2 SLA tiers**\n- Emergency: response < 2h, on-site < 6h\n- Standard: response < 24h, on-site < 72h\n\n**2) Measure drift**\n- Track “Waiting” time + reschedules per vendor\n- Flag drift if 7‑day median worsens > 15%\n\n**3) Escalation playbook**\n- Nudge → manager ping → swap vendor (only after 2 misses)\n\n**Recommended next actions**\n- Apply Emergency tier to Plumbing + Water Intrusion\n- Start with one region for 2 weeks, then roll out\n\nWant me to propose SLA defaults per category (Plumbing/HVAC/Electrical/Envelope)?`
    }
    return `Done — here are sensible **starter SLAs** (demo):\n\n- **Plumbing (Emergency)**: response < 2h, on-site < 6h\n- **HVAC (High priority)**: response < 8h, on-site < 24h\n- **Electrical (Safety)**: response < 4h, on-site < 12h\n- **Envelope/Leaks**: response < 8h, inspection < 5 days\n\nI’d also add one guardrail: **no escalation after-hours** unless it’s Safety/Emergency.\n\nWant these SLAs to generate a weekly “vendor scorecard” automatically?`
  }

  if (finalIntent === 'reduce-ltl') {
    if (!isFollowUp) {
      return `To reduce **Loss to Lease**, I’d start with a lightweight **Lease Audit Automation** workflow (demo):\n\n**Trigger(s)**\n- Missing fees detected OR discount > threshold OR lease term mismatch\n\n**Steps (5)**\n1) Detect leakage + classify type (fee, concession, term)\n2) Draft correction + required approvals\n3) Batch review (15 minutes/day)\n4) Apply changes + notify onsite\n5) Track recovered $ and prevent recurrence\n\n**Output**: weekly recovered $ + top leakage patterns.\n\nWant me to configure thresholds (e.g. discounts > 3%, missing pet fees, storage, RUBS)?`
    }
    return `Nice — here are thresholds I’d recommend (demo):\n\n- Discount > **3%** or > **$75/mo** → review\n- Missing fees: pet/storage/parking → auto-flag\n- Concession mismatch vs lease term → auto-flag\n\nNext steps:\n1) Choose who approves (PM vs Revenue)\n2) Pick “auto-fix” vs “review required” per category\n\nWant a version that only runs on **new leases** first (safer rollout)?`
  }

  return `I can help with that. Pick one:\n\n- Show Active Workflows\n- Build Turn Time Workflow\n- Optimize Vendor SLA setup\n- Reduce Loss to Lease workflows\n\nOr tell me what’s hurting most: **turn time**, **vendor delays**, or **loss to lease**.`
}

function simulateSpendReply(
  message: string,
  ctx: { depth: number; lastPendingAction: SpendAction | null; spendContext: SpendContext | undefined }
): { content: string; action?: SpendAction; pendingAction?: SpendAction } {
  const m = normalize(message)
  const evtId = ctx.spendContext?.eventId
  const evtName = ctx.spendContext?.eventName ?? 'this event'
  const isConfirm = m === 'yes' || m.startsWith('yes,') || m.includes('do it') || m.includes('sounds good') || m.includes('confirm') || m === 'y'
  const isCreate =
    (m.includes('create') || m.includes('new') || m.includes('set up') || m.includes('draft') || m.includes('start')) &&
    (m.includes('rfq') || m.includes('rfp') || m.includes('rfi') || m.includes('event') || m.includes('sourcing') || m.includes('request for'))
  const isOpen = m.includes('open') && (m.includes('bidding') || m.includes('for bid'))
  const isSubmit = m.includes('submit') && m.includes('approval')
  const isEvaluate = m.includes('evaluat') && (m.includes('bid') || m.includes('start'))
  const isRecommend = m.includes('recommend') || (m.includes('award') && !m.includes('awarded'))
  const isClose = m.includes('close') || (m.includes('complete') && m.includes('event'))
  const isList = m.includes('show') || m.includes('list') || m.includes('what events') || m.includes('events need')
  if (isConfirm && ctx.lastPendingAction && ctx.depth >= 1) {
    return { content: 'Done. Carrying out that action now.', action: ctx.lastPendingAction }
  }
  if (isCreate) {
    const eventType = m.includes('rfp') || m.includes('request for proposal') ? 'RFP' : m.includes('rfi') || m.includes('request for information') ? 'RFI' : 'RFQ'
    const extractCreateName = (): string => {
      const afterFor = m.match(/(?:for|about)\s+["']?([^"']+?)(?:["']|\s*$)/i)
      if (afterFor?.[1]) {
        let raw = afterFor[1].trim().replace(/^(an?\s+)|^(the\s+)/i, '')
        if (raw.length > 2 && !/^(an|a|the|it)$/i.test(raw)) return raw.replace(/\b\w/g, (c) => c.toUpperCase())
      }
      const forMatch = m.match(/(?:create|new|set up|draft|start)(?:an?|the)?\s+(?:rfq|rfp|rfi|request for \w+)?\s*(?:for|about)\s+["']?([^"']+?)["']?\s*$/i)
      if (forMatch?.[1]) {
        const raw = forMatch[1].trim()
        if (raw.length > 2 && !/^(an|a|the|it)$/i.test(raw)) return raw.replace(/\b\w/g, (c) => c.toUpperCase())
      }
      const nameFirstMatch = m.match(/(?:create|new|set up)\s+(?:an?\s+)?["']?([^"']+?)["']?\s+(?:rfq|rfp|rfi)/i)
      if (nameFirstMatch?.[1]) {
        const raw = nameFirstMatch[1].trim()
        if (raw.length > 2 && !/^(an|a|the|it|rfq|rfp|rfi)$/i.test(raw)) return raw.replace(/\b\w/g, (c) => c.toUpperCase())
      }
      return 'New Sourcing Event'
    }
    const name = extractCreateName()
    const budgetMatch = m.match(/\$?([\d,]+(?:k|m)?)/i)
    let budget: number | undefined
    if (budgetMatch) {
      const v = budgetMatch[1].replace(/,/g, '').toLowerCase()
      budget = v.endsWith('k') ? parseInt(v, 10) * 1000 : v.endsWith('m') ? parseInt(v, 10) * 1_000_000 : parseInt(v, 10)
    }
    const pendingAction: SpendAction = { type: 'create_event', name, eventType: eventType as 'RFQ' | 'RFP' | 'RFI', budget }
    return { content: `I'll create a **${eventType}** sourcing event: **${name}**${budget ? ` (budget: $${budget.toLocaleString()})` : ''}.\n\nSay **yes** to create it.`, pendingAction }
  }
  const extractName = (msg: string) => {
    const pats = [/open\s+["']?([^"']+)["']?\s+for\s+bidding/i, /submit\s+["']?([^"']+)["']?\s+for\s+approval/i, /start\s+evaluat(?:ing|ion)\s+(?:bids?\s+for\s+)?["']?([^"']+)["']?/i, /recommend\s+(?:award\s+for\s+)?["']?([^"']+)["']?/i, /award\s+["']?([^"']+)["']?/i, /(?:mark\s+)?(?:close|complete)\s+["']?([^"']+)["']?/i]
    for (const re of pats) { const match = m.match(re); if (match?.[1]) return match[1].trim() }
    return evtName
  }
  if (isOpen) { const name = extractName(message); const pa: SpendAction = { type: 'update_status', eventIdOrName: evtId || name, newStatus: 'Open' }; return { content: `I'll open **${name}** for bidding.\n\nSay **yes** to confirm.`, pendingAction: pa } }
  if (isSubmit) { const name = extractName(message); const pa: SpendAction = { type: 'update_status', eventIdOrName: evtId || name, newStatus: 'Pending Approval' }; return { content: `I'll submit **${name}** for approval.\n\nSay **yes** to confirm.`, pendingAction: pa } }
  if (isEvaluate) { const name = extractName(message); const pa: SpendAction = { type: 'update_status', eventIdOrName: evtId || name, newStatus: 'Under Review' }; return { content: `I'll move **${name}** to Under Review.\n\nSay **yes** to confirm.`, pendingAction: pa } }
  if (isRecommend) { const name = extractName(message); const pa: SpendAction = { type: 'update_status', eventIdOrName: evtId || name, newStatus: 'Award Pending' }; return { content: `I'll recommend award for **${name}**.\n\nSay **yes** to confirm.`, pendingAction: pa } }
  if (isClose) { const name = extractName(message); const pa: SpendAction = { type: 'update_status', eventIdOrName: evtId || name, newStatus: 'Completed' }; return { content: `I'll mark **${name}** as Completed.\n\nSay **yes** to confirm.`, pendingAction: pa } }
  if (isList) return { content: "Go to **Sourcing Events** to see your list. I can help you open, submit, or complete events — just tell me the event name." }
  return { content: "I can help you create events, open for bidding, submit for approval, start evaluation, recommend award, or mark complete. What would you like to do?" }
}

export function JoyAiChatWindow({ mode = 'general', draft, onDraftChange, focusKey, showHeader = true, spendContext, onSpendAction }: JoyAiChatWindowProps) {
  const location = useLocation()
  const { selectedPropertyIds, dateRange } = useInsightsPropertySelectionOptional()
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: mode === 'spend' ? WELCOME_SPEND : mode === 'workflows' ? WELCOME_WORKFLOWS : WELCOME_GENERAL },
  ])
  const [internalDraft, setInternalDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [depth, setDepth] = useState(0)
  const [lastIntent, setLastIntent] = useState<string | null>(null)
  const [lastPendingAction, setLastPendingAction] = useState<SpendAction | null>(null)

  const currentDraft = draft ?? internalDraft
  const setDraft = onDraftChange ?? setInternalDraft

  useEffect(() => {
    if (focusKey == null) return
    // microtask to allow layout settle
    queueMicrotask(() => inputRef.current?.focus())
  }, [focusKey])

  const replyGenerator = useMemo(() => {
    if (mode === 'workflows') return (text: string) => simulateWorkflowsReply(text, { depth, lastIntent })
    if (mode === 'spend') return (text: string) => simulateSpendReply(text, { depth, lastPendingAction, spendContext }).content
    return (_text: string) =>
      'This is a placeholder reply. Connect JOYAI to your AI backend to analyze property and portfolio data and generate insights, strategies, and action plans.'
  }, [mode, depth, lastIntent, lastPendingAction, spendContext])

  const handleSubmit = async () => {
    const trimmed = currentDraft.trim()
    if (!trimmed || loading) return

    const m = normalize(trimmed)
    const isConfirmation =
      m === 'yes' || m.startsWith('yes,') || m.includes('do it') || m.includes('sounds good') || m.includes('confirm') || m === 'y'

    if (mode === 'spend' && isConfirmation && lastPendingAction && depth >= 1) {
      setDraft('')
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }, { role: 'assistant', content: 'Done. Carrying out that action now.' }])
      setDepth((d) => d + 1)
      setLastPendingAction(null)
      if (onSpendAction) void Promise.resolve(onSpendAction(lastPendingAction)).catch(() => {})
      return
    }

    setDraft('')
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setLoading(true)

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 20_000)

    const prevForRequest = [...messages, { role: 'user' as const, content: trimmed }]

    try {
      const res = await fetch('/api/joy-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          mode,
          context: {
            path: location.pathname,
            selectedPropertyIds,
            dateRange,
            spendContext,
          },
          messages: prevForRequest.map((msg) => ({ role: msg.role, content: msg.content })),
        }),
      })

      if (!res.ok) throw new Error(`JOYAI backend unavailable (${res.status})`)
      const data = (await res.json()) as { content?: string; pendingAction?: SpendAction; action?: SpendAction }
      if (!data?.content) throw new Error('Empty JOYAI response')

      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }])
      setDepth((d) => d + 1)
      if (mode === 'spend') {
        setLastPendingAction(data.pendingAction ?? (data.action ? null : lastPendingAction))
        if (data.action && onSpendAction) void Promise.resolve(onSpendAction(data.action)).catch(() => {})
      }
      setLoading(false)
      return
    } catch {
      // Fallback to mocked logic (keeps app working in dev / without OPENAI_API_KEY).
      if (mode === 'spend') {
        const result = simulateSpendReply(trimmed, { depth, lastPendingAction, spendContext })
        setMessages((prev) => [...prev, { role: 'assistant', content: result.content }])
        setDepth((d) => d + 1)
        setLastPendingAction(result.pendingAction ?? (result.action ? null : lastPendingAction))
        if (result.action && onSpendAction) {
          void Promise.resolve(onSpendAction(result.action)).catch(() => {})
        }
      } else {
        const reply = replyGenerator(trimmed)
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
        setDepth((d) => d + 1)
        const norm = normalize(trimmed)
        const inferred =
          mode === 'workflows'
            ? norm.includes('show active') || norm.includes('active workflows')
              ? 'show-active'
              : norm.includes('turn time') || norm.includes('make ready') || norm.includes('turn-time')
                ? 'build-turn'
                : norm.includes('vendor sla') || norm.includes('sla')
                  ? 'optimize-sla'
                  : norm.includes('loss to lease') || norm.includes('ltl') || norm.includes('lease audit')
                    ? 'reduce-ltl'
                    : null
            : null
        if (inferred) setLastIntent(inferred)
      }
      setLoading(false)
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  return (
    <Stack
      gap={0}
      pt={showHeader ? 'md' : 'sm'}
      px="md"
      style={{
        height: '100%',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {showHeader && (
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
      )}

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
            placeholder={mode === 'spend' ? 'Create events, open for bidding, submit for approval...' : 'Ask about your portfolio...'}
            ref={inputRef}
            value={currentDraft}
            onChange={(e) => setDraft(e.currentTarget.value)}
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
            disabled={loading || !currentDraft.trim()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--mantine-color-purple-6)',
              color: 'white',
              opacity: loading || !currentDraft.trim() ? 0.5 : 1,
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
