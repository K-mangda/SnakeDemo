// Workspace pages stay in memory only. This makes tab switches instant without
// persisting short-lived signed image URLs in browser storage.
const MAX_AGE_MS = 5 * 60 * 1000
const cachedPages = new Map<string, { savedAt: number; payload: unknown }>()

export function getCachedWorkspacePage<T>(key: string) {
  const cached = cachedPages.get(key)
  if (!cached || Date.now() - cached.savedAt > MAX_AGE_MS) {
    cachedPages.delete(key)
    return null
  }
  return cached.payload as T
}

export function cacheWorkspacePage<T>(key: string, payload: T) {
  cachedPages.set(key, { savedAt: Date.now(), payload })
}

export function clearWorkspaceCache() {
  cachedPages.clear()
}
