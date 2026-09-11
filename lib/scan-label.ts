export function formatScanLabel(createdAt: string) {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(createdAt))
  return `Scan · ${formatted}`
}
