// The active My Queue order survives route changes during this browser session,
// so an Expert can move back to a task they just reviewed.
let queuedImageIds: string[] = []

export function getExpertQueue() {
  return queuedImageIds
}

export function setExpertQueue(imageIds: string[]) {
  queuedImageIds = imageIds
}
