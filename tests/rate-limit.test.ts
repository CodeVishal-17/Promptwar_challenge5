import { describe, expect, it, vi } from "vitest";
import {
  BUDGET_MESSAGE,
  evaluatePlanGuard,
  guardPlanRequest,
  RATE_LIMIT_MESSAGE,
  readDailyLimit,
  resetPlanGuardStateForTests,
  trustedClientKey,
  type PlanStore,
} from "@/lib/rate-limit";

function request(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/plan", { headers });
}

describe("trusted client identity", () => {
  it("uses the Vercel platform header and ignores a client-supplied forwarding header", () => {
    const incoming = request({
      "x-forwarded-for": "1.1.1.1",
      "x-real-ip": "8.8.8.8",
      "x-vercel-forwarded-for": "203.0.113.9, 76.76.21.21",
    });

    expect(trustedClientKey(incoming, true)).toBe("203.0.113.9");
    expect(trustedClientKey(incoming, false)).toBe("local");
  });

  it("fails closed on Vercel when the platform header is missing or not an IP", () => {
    expect(trustedClientKey(request({ "x-forwarded-for": "203.0.113.4" }), true)).toBeNull();
    expect(trustedClientKey(request({ "x-vercel-forwarded-for": "not-an-ip" }), true)).toBeNull();
  });
});

describe("shared plan guard", () => {
  it("shares one slot counter across calls and does not spend the daily budget when the minute window is full", async () => {
    const slots = new Map<string, number[]>();
    let budgetCalls = 0;
    const store: PlanStore = {
      async takeSlot(identity, now) {
        const recent = (slots.get(identity) ?? []).filter((stamp) => now - stamp < 60_000);
        if (recent.length >= 8) {
          slots.set(identity, recent);
          return false;
        }
        recent.push(now);
        slots.set(identity, recent);
        return true;
      },
      async takeBudget() {
        budgetCalls += 1;
        return budgetCalls;
      },
    };
    const incoming = request();
    const options = { dailyLimit: 100, onVercel: false, now: new Date("2026-10-27T05:00:00.000Z") };

    for (let attempt = 0; attempt < 8; attempt += 1) {
      expect((await evaluatePlanGuard(incoming, store, options)).ok).toBe(true);
    }
    const blocked = await evaluatePlanGuard(incoming, store, options);

    expect(blocked).toEqual({ ok: false, status: 429, error: RATE_LIMIT_MESSAGE });
    expect(budgetCalls).toBe(8);

    const second = await evaluatePlanGuard(request({ "x-vercel-forwarded-for": "203.0.113.10" }), store, {
      ...options,
      onVercel: true,
    });
    expect(second.ok).toBe(true);
    expect(budgetCalls).toBe(9);
  });

  it("stops the whole studio at the shared daily budget", async () => {
    let spent = 0;
    const store: PlanStore = {
      async takeSlot() {
        return true;
      },
      async takeBudget() {
        spent += 1;
        return spent;
      },
    };
    const options = { dailyLimit: 2, onVercel: false, now: new Date("2026-10-27T05:00:00.000Z") };

    expect((await evaluatePlanGuard(request(), store, options)).ok).toBe(true);
    expect((await evaluatePlanGuard(request(), store, options)).ok).toBe(true);
    expect(await evaluatePlanGuard(request(), store, options)).toEqual({
      ok: false,
      status: 429,
      error: BUDGET_MESSAGE,
    });
  });

  it("returns 503 when the shared store fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const store: PlanStore = {
      async takeSlot() {
        throw new Error("https://example.upstash.io refused the token");
      },
      async takeBudget() {
        return 1;
      },
    };

    const result = await evaluatePlanGuard(request(), store, { dailyLimit: 10, onVercel: false });

    expect(result).toEqual({
      ok: false,
      status: 503,
      error: "Plans are paused until the limiter is available. Try again in a moment.",
    });
    expect(spy).toHaveBeenCalledWith("Fête plan limiter failed.");
    expect(spy.mock.calls.flat().join(" ")).not.toContain("upstash");
    spy.mockRestore();
  });
});

describe("guardPlanRequest configuration", () => {
  it("fails closed when the daily limit is unusable or Upstash is not configured", async () => {
    expect(readDailyLimit("0")).toBeNull();
    expect(readDailyLimit("nope")).toBeNull();
    expect(readDailyLimit(undefined)).toBe(100);

    const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
    const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const previousLimit = process.env.PLAN_DAILY_LIMIT;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.PLAN_DAILY_LIMIT = "0";
    resetPlanGuardStateForTests();
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const invalidLimit = await guardPlanRequest(request());
      delete process.env.PLAN_DAILY_LIMIT;
      const missingRedis = await guardPlanRequest(request());
      expect(invalidLimit).toMatchObject({ ok: false, status: 503 });
      expect(missingRedis).toMatchObject({ ok: false, status: 503 });
    } finally {
      spy.mockRestore();
      resetPlanGuardStateForTests();
      if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
      else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
      if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
      else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
      if (previousLimit === undefined) delete process.env.PLAN_DAILY_LIMIT;
      else process.env.PLAN_DAILY_LIMIT = previousLimit;
    }
  });
});
