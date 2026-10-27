# Fête

Fête is a planning atelier for weddings, birthdays, and community gatherings. A brief becomes four working pieces: a budget that adds up, a timeline counted back from the date, a vendor checklist, and ideas written for the people in the room.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

Copy `.env.example` to `.env.local` for local runs, and set the same names in the Vercel project before deploying.

```
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
PLAN_DAILY_LIMIT=100
```

Model keys stay on the server. If neither model key is set, the atelier composer still writes a full plan. Gemini is used first when both keys exist. `POST /api/plan` stays paused with HTTP 503 until the Upstash Redis URL and token are set. `PLAN_DAILY_LIMIT` is the shared daily usage budget. The 8-request minute window only slows bursts; it is not a spending cap.

## How a plan is made

1. The brief is cleaned and checked (length, date, guest count, currency, dietary tags).
2. Budget shares, milestone dates, and vendor estimates are calculated in the app. Category amounts sum to the budget exactly.
3. A structured prompt can ask Gemini or OpenAI for the invitation, theme, menu, activities, and care notes.
4. Model text is parsed as JSON and rejected if it recommends a restricted food or drink. The local copy replaces those fields.
5. The plan is saved in this browser. Plan text is not written to Redis. Upstash stores only the rate-limit window and the daily budget counter.

You can change the budget or guest count on the plan, and the split is recalculated. Vendor status (not started, shortlisted, booked, paid) is kept.

Samples: `/plan/sample-wedding`, `/plan/sample-birthday`, `/plan/sample-community`.

## Security

- Markup is stripped from text fields before validation.
- Request bodies are size-capped. The plan route accepts JSON only.
- Callers on Vercel are identified with `x-vercel-forwarded-for`, which the platform sets. Client-supplied `x-forwarded-for` and `x-real-ip` values are ignored.
- Upstash Redis shares an 8-request sliding window per minute per client. That window is a burst limit, not a spending cap.
- A separate Redis counter, `PLAN_DAILY_LIMIT` (default 100), caps plan creation for the whole deployment each UTC day. The model is not called once either limit refuses.
- If Redis is unset, misconfigured, or does not answer in time, the route returns 503 and does not call the model.
- Model requests time out after 20 seconds. Gemini output is capped with `maxOutputTokens`, and OpenAI output with `max_completion_tokens`.
- API keys are read from the server environment and are not sent to the browser.
- Provider and limiter failures are logged without the request URL or the Redis token.
- Security headers are set in `next.config.ts`, including a content security policy in production.

## Accessibility

The brief uses labelled fields, grouped choices, and an error summary that moves focus. The plan uses a tab list with arrow keys. Palette names are written next to the colour. Status changes are announced. Motion is reduced when the system asks for it.

## Project shape

- `lib/budget.ts`, `lib/timeline.ts`, `lib/vendors.ts`, `lib/ideas.ts` — the planning rules
- `lib/planner.ts` — assembles a plan
- `lib/ai` — prompt, JSON parse, Gemini and OpenAI
- `app/api/plan` — the compose endpoint
- `app/new` and `app/plan/[id]` — the planner screens

Keep `node_modules` and `.next` out of the published repository. The source itself is well under 10 MB.
