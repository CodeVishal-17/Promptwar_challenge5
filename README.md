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

Copy `.env.example` to `.env.local` if you want model-written copy.

```
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Keys stay on the server. If neither key is set, the atelier composer still writes a full plan. Gemini is used first when both keys exist.

## How a plan is made

1. The brief is cleaned and checked (length, date, guest count, currency, dietary tags).
2. Budget shares, milestone dates, and vendor estimates are calculated in the app. Category amounts sum to the budget exactly.
3. A structured prompt can ask Gemini or OpenAI for the invitation, theme, menu, activities, and care notes.
4. Model text is parsed as JSON and rejected if it recommends a restricted food or drink. The local copy replaces those fields.
5. The plan is saved in the browser. Nothing is written to a database.

You can change the budget or guest count on the plan, and the split is recalculated. Vendor status (not started, shortlisted, booked, paid) is kept.

Samples: `/plan/sample-wedding`, `/plan/sample-birthday`, `/plan/sample-community`.

## Security

- Markup is stripped from text fields before validation.
- Request bodies are size-capped. The plan route accepts JSON only and is limited to 8 requests a minute per address.
- API keys are read from the server environment and are not sent to the browser.
- Provider failures are logged without the request URL.
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
