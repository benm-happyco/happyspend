import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const STORAGE_KEY_IDS = 'insights-selected-property-ids'
const STORAGE_KEY_DATE_RANGE = 'insights-date-range'

export type InsightsDateRange = { startDate: string; endDate: string }

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
    const raw = localStorage.getItem(STORAGE_KEY_IDS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function saveStoredIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY_IDS, JSON.stringify(ids))
  } catch {
    // ignore
  }
}

function loadStoredDateRange(): InsightsDateRange {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DATE_RANGE)
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
    localStorage.setItem(STORAGE_KEY_DATE_RANGE, JSON.stringify(range))
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
