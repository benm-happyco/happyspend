import type { ReactNode } from 'react'
import React from 'react'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = { hasError: boolean }

/**
 * Local error boundary to prevent one widget (e.g. Leaflet map)
 * from blanking the whole page.
 */
export class UiErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    // Intentionally no-op (demo app). Could report to Sentry/etc.
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}

