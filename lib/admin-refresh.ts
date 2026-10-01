export type AdminRefreshTab = 'overview' | 'review' | 'system'

const eventName = 'admin-refresh'

export function refreshAdminTab(tab: AdminRefreshTab) {
  window.dispatchEvent(new CustomEvent(eventName, { detail: { tab } }))
}

export function onAdminRefresh(tab: AdminRefreshTab, callback: () => void) {
  const listener = (event: Event) => {
    if ((event as CustomEvent<{ tab?: AdminRefreshTab }>).detail?.tab === tab) callback()
  }
  window.addEventListener(eventName, listener)
  return () => window.removeEventListener(eventName, listener)
}
