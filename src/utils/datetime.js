// Server timestamps are naive UTC (no Z suffix) — JS parses those as LOCAL
// time, shifting everything by the local UTC offset (e.g. +5h in Tashkent).
// parseServerDate() treats timezone-less strings as UTC; strings that already
// carry an offset (Z or ±hh:mm) are parsed as-is.

export const parseServerDate = (dateStr) => {
  if (!dateStr) return null
  if (dateStr instanceof Date) return dateStr
  const s = String(dateStr)
  // ISO date-time WITHOUT timezone designator → append Z (server stores UTC)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) {
    return new Date(`${s}Z`)
  }
  const d = new Date(s)
  return isNaN(d) ? null : d
}

/** Relative "time ago" label for server timestamps. */
export const timeAgo = (dateStr) => {
  const date = parseServerDate(dateStr)
  if (!date) return ''
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** "Sep 15, 4:30 PM" — for compact deadline displays. */
export const formatDate = (dateStr) => {
  const date = parseServerDate(dateStr)
  if (!date) return dateStr || ''
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** "September 15, 2026, 4:30 PM" — for detail pages. */
export const formatDateTime = (dateStr) => {
  const date = parseServerDate(dateStr)
  if (!date) return dateStr || ''
  return date.toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/** Milliseconds until the given server timestamp (negative if past). */
export const msUntil = (dateStr) => {
  const date = parseServerDate(dateStr)
  return date ? date.getTime() - Date.now() : NaN
}
