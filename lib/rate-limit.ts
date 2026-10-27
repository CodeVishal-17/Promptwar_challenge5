import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const PLAN_RATE_LIMIT = 8;
export const PLAN_RATE_WINDOW = "60 s" as const;
export const DEFAULT_DAILY_LIMIT = 100;
export const LIMITER_TIMEOUT_MS = 2_500;

export const RATE_LIMIT_MESSAGE = "Too many plans just now. Wait a minute and try again.";
export const BUDGET_MESSAGE = "The studio has reached its shared daily plan budget. Try again tomorrow.";
export const LIMITER_UNAVAILABLE_MESSAGE = "Plans are paused until the limiter is available. Try again in a moment.";

const BUDGET_TTL_SECONDS = 172_800;

export type GuardResult =
  | { ok: true }
  | { ok: false; status: 429 | 503; error: string };

export type PlanStore = {
  takeSlot(identity: string, now: number): Promise<boolean>;
  takeBudget(dayKey: string, ttlSeconds: number): Promise<number>;
};

type LimitResult = {
  success: boolean;
  reason?: "timeout" | "cacheBlock" | "denyList";
  pending: Promise<unknown>;
};

let cachedStore: PlanStore | undefined;
let cachedFingerprint = "";

export function resetPlanGuardStateForTests(): void {
  cachedStore = undefined;
  cachedFingerprint = "";
}

export function readDailyLimit(raw = process.env.PLAN_DAILY_LIMIT): number | null {
  const text = (raw ?? "").trim() || String(DEFAULT_DAILY_LIMIT);
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value < 1 || value > 100_000) return null;
  return value;
}

function unavailable(): GuardResult {
  return { ok: false, status: 503, error: LIMITER_UNAVAILABLE_MESSAGE };
}

function isIp(value: string): boolean {
  if (value.length === 0 || value.length > 64) return false;
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(value);
  if (v4) return v4.slice(1).every((part) => Number(part) <= 255);
  return value.includes(":") && /^[0-9a-fA-F:]+$/.test(value);
}

/**
 * On Vercel, only the platform-owned `x-vercel-forwarded-for` header identifies the caller.
 * `x-forwarded-for` and `x-real-ip` are ignored because a client can supply them.
 * Outside Vercel every caller shares the local bucket, and those headers are ignored there too.
 */
export function trustedClientKey(request: Request, onVercel = process.env.VERCEL === "1"): string | null {
  if (!onVercel) return "local";
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "";
  return isIp(ip) ? ip : null;
}

export function dayKey(now: Date): string {
  return `fete:budget:${now.toISOString().slice(0, 10)}`;
}

export async function evaluatePlanGuard(
  request: Request,
  store: PlanStore,
  options: { dailyLimit: number; onVercel?: boolean; now?: Date },
): Promise<GuardResult> {
  const identity = trustedClientKey(request, options.onVercel ?? false);
  if (!identity) return unavailable();
  const now = options.now ?? new Date();
  try {
    const allowed = await store.takeSlot(identity, now.getTime());
    if (!allowed) return { ok: false, status: 429, error: RATE_LIMIT_MESSAGE };
    const spent = await store.takeBudget(dayKey(now), BUDGET_TTL_SECONDS);
    if (spent > options.dailyLimit) return { ok: false, status: 429, error: BUDGET_MESSAGE };
    return { ok: true };
  } catch {
    console.error("Fête plan limiter failed.");
    return unavailable();
  }
}

export function createUpstashStore(url: string, token: string): PlanStore {
  const redis = new Redis({ url, token });
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(PLAN_RATE_LIMIT, PLAN_RATE_WINDOW),
    prefix: "fete:plan",
    analytics: false,
    ephemeralCache: false,
    timeout: LIMITER_TIMEOUT_MS,
  });
  return {
    async takeSlot(identity) {
      const result = (await ratelimit.limit(identity)) as LimitResult;
      await result.pending.catch(() => undefined);
      if (result.reason === "timeout") throw new Error("limiter-timeout");
      return result.success;
    },
    async takeBudget(key, ttlSeconds) {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, ttlSeconds);
      return count;
    },
  };
}

function sharedStore(): PlanStore {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";
  if (!url || !token) throw new Error("limiter-unconfigured");
  const fingerprint = `${url}\n${token}`;
  if (cachedStore && cachedFingerprint === fingerprint) return cachedStore;
  cachedStore = createUpstashStore(url, token);
  cachedFingerprint = fingerprint;
  return cachedStore;
}

export async function guardPlanRequest(request: Request): Promise<GuardResult> {
  const dailyLimit = readDailyLimit();
  if (dailyLimit === null) {
    console.error("Fête plan limiter failed.");
    return unavailable();
  }
  try {
    const store = sharedStore();
    return await evaluatePlanGuard(request, store, {
      dailyLimit,
      onVercel: process.env.VERCEL === "1",
    });
  } catch {
    console.error("Fête plan limiter failed.");
    return unavailable();
  }
}
