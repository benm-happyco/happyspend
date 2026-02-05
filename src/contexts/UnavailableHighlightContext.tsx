import { createContext, useCallback, useContext, useState } from 'react'

const STORAGE_KEY = 'insights-highlight-unavailable'

function loadStored(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'true') return true
    if (raw === 'false') return false
  } catch {
    // ignore
  }
  return false
}

function saveStored(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // ignore
  }
}

type UnavailableHighlightContextValue = {
  highlightUnavailable: boolean
  setHighlightUnavailable: (value: boolean) => void
}

const UnavailableHighlightContext = createContext<UnavailableHighlightContextValue | null>(null)

export function UnavailableHighlightProvider({ children }: { children: React.ReactNode }) {
  const [highlightUnavailable, setState] = useState(loadStored)

  const setHighlightUnavailable = useCallback((value: boolean) => {
    setState(value)
    saveStored(value)
  }, [])

  return (
    <UnavailableHighlightContext.Provider value={{ highlightUnavailable, setHighlightUnavailable }}>
      {children}
    </UnavailableHighlightContext.Provider>
  )
}

export function useUnavailableHighlight(): UnavailableHighlightContextValue {
  const ctx = useContext(UnavailableHighlightContext)
  if (!ctx) {
    return {
      highlightUnavailable: false,
      setHighlightUnavailable: () => {},
    }
  }
  return ctx
}
