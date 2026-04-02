/**
 * Format an ISO8601 datetime string for display.
 * e.g. "2026-04-09T14:00:00-05:00" → "Thu, Apr 9 at 2:00 PM CDT"
 */
export function formatDisplayDateTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

/**
 * Convert an ISO8601 string to the value format required by
 * <input type="datetime-local"> — "YYYY-MM-DDTHH:mm"
 */
export function isoToDatetimeLocal(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/**
 * Convert a datetime-local value back to a full ISO8601 string
 * using the local timezone offset.
 */
export function datetimeLocalToIso(value: string): string {
  return new Date(value).toISOString()
}

/** Return the IANA timezone string for the current environment. */
export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
