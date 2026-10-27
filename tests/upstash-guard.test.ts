import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  success: true,
  reason: undefined as "timeout" | undefined,
  configs: [] as Array<{
    limiter: { tokens: number; window: string };
    prefix?: string;
    timeout?: number;
    analytics?: boolean;
    ephemeralCache?: false;
  }>,
  redis: [] as Array<{ url: string; token: string }>,
  incrs: [] as string[],
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class Ratelimit {
    static slidingWindow(tokens: number, window: string) {
      return { tokens, window };
    }

    constructor(config: (typeof state.configs)[number]) {
      state.configs.push(config);
    }

    async limit() {
      return { success: state.success, reason: state.reason, pending: Promise.resolve() };
    }
  },
}));

vi.mock("@upstash/redis", () => ({
  Redis: class Redis {
    constructor(config: { url: string; token: string }) {
      state.redis.push(config);
    }

    async incr(key: string) {
      state.incrs.push(key);
      return state.incrs.length;
    }

    async expire() {
      return 1;
    }
  },
}));

import { guardPlanRequest, resetPlanGuardStateForTests } from "@/lib/rate-limit";

describe("Upstash plan guard", () => {
  const previous = {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    vercel: process.env.VERCEL,
  };

  beforeEach(() => {
    resetPlanGuardStateForTests();
    state.success = true;
    state.reason = undefined;
    state.configs.length = 0;
    state.redis.length = 0;
    state.incrs.length = 0;
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    delete process.env.VERCEL;
  });

  afterEach(() => {
    resetPlanGuardStateForTests();
    restore("UPSTASH_REDIS_REST_URL", previous.url);
    restore("UPSTASH_REDIS_REST_TOKEN", previous.token);
    restore("VERCEL", previous.vercel);
  });

  it("configures a shared 8-per-minute window and a separate daily budget", async () => {
    const result = await guardPlanRequest(new Request("http://localhost/api/plan"));

    expect(result).toEqual({ ok: true });
    expect(state.redis).toEqual([{ url: "https://example.upstash.io", token: "test-token" }]);
    expect(state.configs[0]).toMatchObject({
      limiter: { tokens: 8, window: "60 s" },
      prefix: "fete:plan",
      analytics: false,
      ephemeralCache: false,
      timeout: 2_500,
    });
    expect(state.incrs).toEqual([`fete:budget:${new Date().toISOString().slice(0, 10)}`]);
  });

  it("fails closed when Upstash times out instead of allowing the plan", async () => {
    state.reason = "timeout";
    state.success = true;
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await guardPlanRequest(new Request("http://localhost/api/plan"));

    expect(result).toMatchObject({ ok: false, status: 503 });
    expect(state.incrs).toEqual([]);
    spy.mockRestore();
  });
});

function restore(name: "UPSTASH_REDIS_REST_URL" | "UPSTASH_REDIS_REST_TOKEN" | "VERCEL", value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
