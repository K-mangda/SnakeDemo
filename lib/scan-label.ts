export function formatScanLabel(createdAt: string) {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(createdAt))
  return `Scan · ${formatted}`
}

export function formatScanDate(createdAt: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
  }).formatToParts(new Date(createdAt))
  const day = parts.find((part) => part.type === 'day')?.value
  const month = parts.find((part) => part.type === 'month')?.value

  return `${day} ${month}`
}
