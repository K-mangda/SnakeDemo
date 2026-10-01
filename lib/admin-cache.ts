type CacheEntry<T> = { value: T; storedAt: number }

const adminCache = new Map<string, CacheEntry<unknown>>()

export function readAdminCache<T>(key: string): T | null {
  return (adminCache.get(key)?.value as T | undefined) ?? null
}

export function writeAdminCache<T>(key: string, value: T) {
  adminCache.set(key, { value, storedAt: Date.now() })
}
