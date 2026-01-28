import type { ReactNode } from 'react'

type HugeiconsIconProps = {
  icon?: unknown
  size?: number
  color?: string
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
}

export function HugeiconsIcon({ size = 16, style }: HugeiconsIconProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        backgroundColor: 'var(--mantine-color-default-border)',
        borderRadius: 4,
        ...style,
      }}
    />
  )
}
