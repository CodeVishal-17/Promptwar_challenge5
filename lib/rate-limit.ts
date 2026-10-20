type HitStore = Map<string, number[]>;

export function createLimiter(limit: number, windowMs: number, store: HitStore = new Map()) {
  return function allow(key: string, now = Date.now()): boolean {
    const safeKey = key.slice(0, 80) || "unknown";
    const recent = (store.get(safeKey) ?? []).filter((stamp) => now - stamp < windowMs);
    if (recent.length >= limit) {
      store.set(safeKey, recent);
      return false;
    }
    recent.push(now);
    store.set(safeKey, recent);
    return true;
  };
}

export const allowPlanRequest = createLimiter(8, 60_000);
