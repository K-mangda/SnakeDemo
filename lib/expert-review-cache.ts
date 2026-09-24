type ReviewPayload = {
  image: unknown
  species: unknown
}

type CachedReview = {
  payload: ReviewPayload
  expiresAt: number
}

// Review data is intentionally memory-only. It makes a hovered task open
// promptly in this browser session without persisting signed image URLs.
const cachedReviews = new Map<string, CachedReview>()
const pendingReviews = new Map<string, Promise<ReviewPayload | null>>()
// Review images use Supabase signed URLs that expire after 15 minutes. Keep
// this cache shorter so an old prefetch can never reopen an expired image.
const CACHE_DURATION_MS = 12 * 60 * 1000

function cacheKey(imageId: string, queueFilter: string) {
  return `${imageId}:${queueFilter}`
}

export function getPrefetchedReview(imageId: string, queueFilter = 'pending') {
  const key = cacheKey(imageId, queueFilter)
  const cached = cachedReviews.get(key)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) {
    cachedReviews.delete(key)
    return null
  }
  return cached.payload
}

export function clearPrefetchedReview(imageId: string) {
  const prefix = `${imageId}:`
  for (const key of cachedReviews.keys()) {
    if (key.startsWith(prefix)) cachedReviews.delete(key)
  }
}

export async function prefetchExpertReview(imageId: string, accessToken: string, queueFilter = 'pending') {
  const key = cacheKey(imageId, queueFilter)
  const cached = getPrefetchedReview(imageId, queueFilter)
  if (cached) return cached

  const inFlight = pendingReviews.get(key)
  if (inFlight) return inFlight

  const request = fetch(`/api/expert/images/${imageId}?queue_filter=${encodeURIComponent(queueFilter)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then(async (response) => {
      if (!response.ok) return null
      const payload = await response.json() as ReviewPayload
      cachedReviews.set(key, { payload, expiresAt: Date.now() + CACHE_DURATION_MS })
      return payload
    })
    .catch(() => null)
    .finally(() => pendingReviews.delete(key))

  pendingReviews.set(key, request)
  return request
}
