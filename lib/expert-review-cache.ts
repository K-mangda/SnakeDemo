type ReviewPayload = {
  image: unknown
  species: unknown
}

// Review data is intentionally memory-only. It makes a hovered task open
// promptly in this browser session without persisting signed image URLs.
const cachedReviews = new Map<string, ReviewPayload>()
const pendingReviews = new Map<string, Promise<ReviewPayload | null>>()

export function getPrefetchedReview(imageId: string) {
  return cachedReviews.get(imageId) ?? null
}

export async function prefetchExpertReview(imageId: string, accessToken: string) {
  const cached = cachedReviews.get(imageId)
  if (cached) return cached

  const inFlight = pendingReviews.get(imageId)
  if (inFlight) return inFlight

  const request = fetch(`/api/expert/images/${imageId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then(async (response) => {
      if (!response.ok) return null
      const payload = await response.json() as ReviewPayload
      cachedReviews.set(imageId, payload)
      return payload
    })
    .catch(() => null)
    .finally(() => pendingReviews.delete(imageId))

  pendingReviews.set(imageId, request)
  return request
}
