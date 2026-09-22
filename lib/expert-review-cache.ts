type ReviewPayload = {
  image: unknown
  species: unknown
}

// Review data is intentionally memory-only. It makes a hovered task open
// promptly in this browser session without persisting signed image URLs.
const cachedReviews = new Map<string, ReviewPayload>()
const pendingReviews = new Map<string, Promise<ReviewPayload | null>>()

function cacheKey(imageId: string, queueFilter: string) {
  return `${imageId}:${queueFilter}`
}

export function getPrefetchedReview(imageId: string, queueFilter = 'pending') {
  return cachedReviews.get(cacheKey(imageId, queueFilter)) ?? null
}

export function clearPrefetchedReview(imageId: string) {
  const prefix = `${imageId}:`
  for (const key of cachedReviews.keys()) {
    if (key.startsWith(prefix)) cachedReviews.delete(key)
  }
}

export async function prefetchExpertReview(imageId: string, accessToken: string, queueFilter = 'pending') {
  const key = cacheKey(imageId, queueFilter)
  const cached = cachedReviews.get(key)
  if (cached) return cached

  const inFlight = pendingReviews.get(key)
  if (inFlight) return inFlight

  const request = fetch(`/api/expert/images/${imageId}?queue_filter=${encodeURIComponent(queueFilter)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then(async (response) => {
      if (!response.ok) return null
      const payload = await response.json() as ReviewPayload
      cachedReviews.set(key, payload)
      return payload
    })
    .catch(() => null)
    .finally(() => pendingReviews.delete(key))

  pendingReviews.set(key, request)
  return request
}
