// Shared in-memory tracker for screen IDs that are actively queued/analyzing
export const activeProcessingScreens = new Set<string>();

export function markScreensProcessing(screenIds: string[]) {
  screenIds.forEach(id => activeProcessingScreens.add(id));
}

export function unmarkScreenProcessing(screenId: string) {
  activeProcessingScreens.delete(screenId);
}

export function clearScreensProcessing(screenIds: string[]) {
  screenIds.forEach(id => activeProcessingScreens.delete(id));
}
