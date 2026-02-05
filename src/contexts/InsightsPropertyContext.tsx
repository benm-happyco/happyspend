import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const STORAGE_KEY_IDS = 'insights-selected-property-ids'
const STORAGE_KEY_DATE_RANGE = 'insights-date-range'

export type InsightsDateRange = { startDate: string; endDate: string }

function getCookie(name: string): string | null {
  try {
    const parts = document.cookie.split(';').map((p) => p.trim())
    const match = parts.find((p) => p.startsWith(`${name}=`))
    if (!match) return null
    return decodeURIComponent(match.slice(name.length + 1))
  } catch {
    return null
  }
}

function setCookie(name: string, value: string, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax${secure}`
  } catch {
    // ignore
  }
}

function getDefaultDateRange(): InsightsDateRange {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 90)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

function loadStoredIds(): string[] {
  try {
    // localStorage is port-scoped (origin includes port). Also persist to cookie so dev-server port
    // changes (5173 → 5175) don't wipe the selection.
    const raw = localStorage.getItem(STORAGE_KEY_IDS) ?? getCookie(STORAGE_KEY_IDS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function saveStoredIds(ids: string[]) {
  try {
    const raw = JSON.stringify(ids)
    localStorage.setItem(STORAGE_KEY_IDS, raw)
    setCookie(STORAGE_KEY_IDS, raw)
  } catch {
    // ignore
  }
}

function loadStoredDateRange(): InsightsDateRange {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DATE_RANGE) ?? getCookie(STORAGE_KEY_DATE_RANGE)
    if (!raw) return getDefaultDateRange()
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.startDate === 'string' && typeof parsed.endDate === 'string') {
      return { startDate: parsed.startDate, endDate: parsed.endDate }
    }
    return getDefaultDateRange()
  } catch {
    return getDefaultDateRange()
  }
}

function saveStoredDateRange(range: InsightsDateRange) {
  try {
    const raw = JSON.stringify(range)
    localStorage.setItem(STORAGE_KEY_DATE_RANGE, raw)
    setCookie(STORAGE_KEY_DATE_RANGE, raw)
  } catch {
    // ignore
  }
}

type InsightsPropertyContextValue = {
  selectedPropertyIds: string[]
  setSelectedPropertyIds: (value: string[] | ((prev: string[]) => string[])) => void
  dateRange: InsightsDateRange
  setDateRange: (value: InsightsDateRange | ((prev: InsightsDateRange) => InsightsDateRange)) => void
}

const InsightsPropertyContext = createContext<InsightsPropertyContextValue | null>(null)

export function InsightsPropertyProvider({ children }: { children: React.ReactNode }) {
  const [selectedPropertyIds, setIdsState] = useState<string[]>(loadStoredIds)
  const [dateRange, setDateRangeState] = useState<InsightsDateRange>(loadStoredDateRange)

  const setSelectedPropertyIds = useCallback((value: string[] | ((prev: string[]) => string[])) => {
    setIdsState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      saveStoredIds(next)
      return next
    })
  }, [])

  const setDateRange = useCallback(
    (value: InsightsDateRange | ((prev: InsightsDateRange) => InsightsDateRange)) => {
      setDateRangeState((prev) => {
        const next = typeof value === 'function' ? value(prev) : value
        saveStoredDateRange(next)
        return next
      })
    },
    []
  )

  const value = useMemo(
    () => ({
      selectedPropertyIds,
      setSelectedPropertyIds,
      dateRange,
      setDateRange,
    }),
    [selectedPropertyIds, setSelectedPropertyIds, dateRange, setDateRange]
  )

  return (
    <InsightsPropertyContext.Provider value={value}>
      {children}
    </InsightsPropertyContext.Provider>
  )
}

export function useInsightsPropertySelection() {
  const ctx = useContext(InsightsPropertyContext)
  if (!ctx) {
    throw new Error('useInsightsPropertySelection must be used within InsightsPropertyProvider')
  }
  return ctx
}

const FALLBACK_VALUE: InsightsPropertyContextValue = {
  selectedPropertyIds: [],
  setSelectedPropertyIds: () => {},
  dateRange: getDefaultDateRange(),
  setDateRange: () => {},
}

/** Safe hook for use outside Insights (returns empty selection). Use when component may render outside provider. */
export function useInsightsPropertySelectionOptional(): InsightsPropertyContextValue {
  const ctx = useContext(InsightsPropertyContext)
  return ctx ?? FALLBACK_VALUE
}
