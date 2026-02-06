import type { ReactNode } from 'react'
import { Box } from '@mantine/core'
import { useUnavailableHighlight } from '../../contexts/UnavailableHighlightContext'

export function UnavailableOutline({
  unavailable,
  children,
  radius = 12,
}: {
  unavailable?: boolean
  children: ReactNode
  radius?: number
}) {
  const { highlightUnavailable } = useUnavailableHighlight()
  if (!unavailable || !highlightUnavailable) return <>{children}</>

  // Use outline to avoid layout shifts.
  return (
    <Box
      style={{
        outline: '2px solid var(--mantine-color-yellow-6)',
        outlineOffset: 2,
        borderRadius: radius,
      }}
    >
      {children}
    </Box>
  )
}

