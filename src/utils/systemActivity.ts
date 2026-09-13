const STORAGE_KEY = 'origin-erp:system-activity'
const RETENTION_DAYS = 84

export type ActivityCounts = Record<string, number>

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getStoredCounts = (): ActivityCounts => {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return Object.fromEntries(
      Object.entries(value).filter(([key, count]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && typeof count === 'number'),
    )
  } catch {
    return {}
  }
}

export const getSystemActivity = (): ActivityCounts => getStoredCounts()

export const recordSystemActivity = () => {
  const counts = getStoredCounts()
  const today = new Date()
  const todayKey = toDateKey(today)
  counts[todayKey] = (counts[todayKey] ?? 0) + 1

  const earliest = new Date(today)
  earliest.setDate(today.getDate() - RETENTION_DAYS)
  const earliestKey = toDateKey(earliest)
  Object.keys(counts).forEach((key) => {
    if (key < earliestKey) delete counts[key]
  })
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(counts))
}
