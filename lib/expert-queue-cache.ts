// The active Pending order survives route changes during this browser session,
// so an Expert can move back to a task they just reviewed.
let queuedImageIds: string[] = []

export function getPendingQueue() {
  return queuedImageIds
}

export function setPendingQueue(imageIds: string[]) {
  queuedImageIds = imageIds
}
