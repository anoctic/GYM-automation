"use client";

let lastDbMutationAt = 0;
let lastLocalMutationAt = 0;
const routeSyncedAt = new Map<string, number>();

export function recordRouteSynced(path: string) {
  routeSyncedAt.set(path, Date.now());
}

export function markDbMutated() {
  lastDbMutationAt = Date.now();
}

export function isRouteStale(path: string): boolean {
  if (lastDbMutationAt === 0) return false;
  const synced = routeSyncedAt.get(path) || 0;
  return synced < lastDbMutationAt;
}

export function shouldSkipRecentLocalEcho(): boolean {
  return Date.now() - lastLocalMutationAt < 350;
}

export function notifyLocalMutation(
  router: { refresh: () => void },
  currentPath?: string
) {
  const now = Date.now();
  lastDbMutationAt = now;
  lastLocalMutationAt = now;
  if (currentPath) {
    routeSyncedAt.set(currentPath, now);
  }
  router.refresh();
}
