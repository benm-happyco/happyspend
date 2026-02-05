export type DemoActiveWorkflowCard = {
  id: string
  title: string
  category: string
  triggerLabel: string
  impactLabel: string
  impactValue: string
  estSavingsUsd: number | null
  hoursSaved: number | null
  stepsDone: number
  stepsTotal: number
  progressPct: number
  status: 'RUNNING' | 'WAITING'
  nextActionLabel: string
  dueLabel: string
  accent: 'teal' | 'blue'
}

export function getDemoActiveWorkflowCards(params: { featuredProperty: string; vendorProperty: string }): DemoActiveWorkflowCard[] {
  const featuredProperty = params.featuredProperty || 'Westwood Oaks'
  const vendorProperty = params.vendorProperty || 'Ace Carpentry'

  return [
    {
      id: 'wf-active-1',
      title: `Vendor SLA Enforcement: ${vendorProperty}`,
      category: 'Benchmark Drift',
      triggerLabel: 'Trigger: Turn Time Bottleneck',
      impactLabel: 'Impact',
      impactValue: '$2.4k recovered',
      estSavingsUsd: 2400,
      hoursSaved: 12,
      stepsDone: 4,
      stepsTotal: 5,
      progressPct: 60,
      status: 'RUNNING',
      nextActionLabel: 'Vendor acknowledgment',
      dueLabel: 'Due today',
      accent: 'teal',
    },
    {
      id: 'wf-active-2',
      title: `Envelope Inspection: ${featuredProperty}`,
      category: 'Benchmark Drift',
      triggerLabel: 'Trigger: Water Intrusion Clustering',
      impactLabel: 'Impact',
      impactValue: '$18k avoided',
      estSavingsUsd: 18_000,
      hoursSaved: 6,
      stepsDone: 3,
      stepsTotal: 5,
      progressPct: 45,
      status: 'WAITING',
      nextActionLabel: 'Vendor scheduling',
      dueLabel: 'Waiting',
      accent: 'blue',
    },
    {
      id: 'wf-active-3',
      title: `Lease Audit Automation: ${featuredProperty}`,
      category: 'Reduce Loss to Lease',
      triggerLabel: 'Trigger: Charge leakage detection',
      impactLabel: 'Impact',
      impactValue: '$9.1k/mo',
      estSavingsUsd: 9_100,
      hoursSaved: 22,
      stepsDone: 2,
      stepsTotal: 5,
      progressPct: 40,
      status: 'RUNNING',
      nextActionLabel: 'Approve audit ruleset',
      dueLabel: 'Due tomorrow',
      accent: 'teal',
    },
    {
      id: 'wf-active-4',
      title: `Turn Time Recovery: ${vendorProperty}`,
      category: 'Turn Time Recovery',
      triggerLabel: 'Trigger: Ready-date drift flagged',
      impactLabel: 'Impact',
      impactValue: '$4.8k recovered',
      estSavingsUsd: 4800,
      hoursSaved: 16,
      stepsDone: 1,
      stepsTotal: 5,
      progressPct: 20,
      status: 'WAITING',
      nextActionLabel: 'Confirm materials delivery',
      dueLabel: 'Waiting',
      accent: 'blue',
    },
    {
      id: 'wf-active-5',
      title: `Utility Consumption Audit: ${featuredProperty}`,
      category: 'Utilities',
      triggerLabel: 'Trigger: Usage variance cluster',
      impactLabel: 'Impact',
      impactValue: '$3.2k/mo',
      estSavingsUsd: 3200,
      hoursSaved: 9,
      stepsDone: 3,
      stepsTotal: 5,
      progressPct: 55,
      status: 'RUNNING',
      nextActionLabel: 'Schedule meter validation',
      dueLabel: 'Due this week',
      accent: 'teal',
    },
  ]
}

