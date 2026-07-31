# Codex Task — Usage & Evidence debug page

**Type:** front-end only. No backend changes. No new API.
**Branch:** `claude/serene-dewdney-c78e18` (worktree `C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18`) — **not `main`**.
**Size:** one new page component + two lines in the router.

---

## Why this exists

We collect four streams of field evidence for the coach pilot — rejected goals, coach-language leaks,
activity edits, and post-use observations. All of it is already aggregated and served by
`GET /api/app/debug-usage?days=N`.

**But nobody can read it.** Every `/api/app/*` route sits behind `userMw` (see
`back/src/routes/api.ts`), which requires a `Bearer` token. The token lives in browser localStorage
and is attached as a header by the app's own fetch helper, so you cannot open the endpoint in a
browser tab or curl it casually. The evidence is being collected and is effectively invisible.

Two debug pages already solve this exact problem for other endpoints (`/debug`, `/debug-em`). This
task adds a third for usage. That's all it is.

---

## What to build

**One new file:** `front/src/app/DebugUsage.tsx`

**Copy the structure of `front/src/app/DebugEmReasoning.tsx`.** Same conventions: default-exported
function component, `api()` from `@/services/api.service`, local `useState`, a header comment marking
it a temporary developer view, Tailwind classes matching the surrounding app.

### Behaviour

- On mount, fetch the summary. Also give the user a way to re-fetch with a different window.
- A small control for `days` — a number input or a few preset buttons (7 / 30 / 90). Default 30.
- Loading and error states. If `res.error` is set, show it plainly; don't throw.
- A "show raw JSON" toggle, like `DebugEmReasoning` has. Useful when a field is added server-side
  before this page knows about it.

### Fetching

```ts
const res = await api<UsageSummary>(`app/debug-usage?days=${days}`)
```

**Important:** the `api()` helper signature is `api(endpoint, body?, logging?)` and it infers the
method — **no body means GET**. Do not pass a third argument expecting it to be an HTTP method; the
third parameter is a `logging` boolean.

### The response shape

Authoritative source is `UsageSummary` in `back/src/services/usage-telemetry.service.ts`. Mirror it
as a local type in the page (the front end does not import backend types):

```ts
type UsageSummary = {
    since: string
    totals: Record<string, number>
    resolutionBreakdown: Record<string, number>
    topSignalGroups: Array<{ signalGroup: string; count: number }>
    topArchetypes: Array<{ archetype: string; count: number }>
    rejectedGoals: Array<{ goalText: string; count: number }>
    feedback: { up: number; down: number; comments: number }
    coachLanguageLeaks: Array<{ term: string; count: number }>
    activityEdits: {
        total: number
        structural: number
        topFields: Array<{ field: string; count: number }>
    }
    observations: {
        total: number
        byCode: Array<{ code: string; count: number }>
        byStage: Array<{ stage: string; count: number }>
    }
}
```

Every array may be empty. Every section must render sensibly with zero rows — an empty pilot is the
normal starting state, not an error.

### Sections, in this order

Order matters: the most actionable evidence goes first.

1. **Rejected goals** — `rejectedGoals`, a table of verbatim coach text and count. **This is the most
   valuable panel on the page**: it is the vocabulary-gap worklist, in coaches' own words. Give it
   room; don't truncate the text.
2. **Observations** — `observations.total`, then `byCode` and `byStage`. This is the Experience
   Intelligence calibration set.
3. **Coach-language leaks** — `coachLanguageLeaks`, term and count. Internal vocabulary that reached
   a coach; the worklist for the next translation-dictionary revision.
4. **Activity edits** — `activityEdits.total`, `.structural`, and `.topFields`. A field coaches
   rewrite constantly is a field the engine is getting wrong.
5. **Resolution & selection** — `resolutionBreakdown`, `topSignalGroups`, `topArchetypes`.
6. **Feedback** — `feedback.up` / `.down` / `.comments`.
7. **Totals** — `totals` (a map of event type to count) and `since`.

Simple tables or definition lists are fine. This is a developer/operator view, not a designed
dashboard — **do not add a charting library.**

### Routing

In `front/src/index.tsx`:

- Add `import DebugUsage from './app/DebugUsage'` alongside the existing debug imports (lines ~49–50).
- Register the route next to the other two (lines ~86–89), inside the same authed `<Route>` block:

```tsx
{/* TEMPORARY developer/testing view — field evidence for the coach pilot. */}
<Route path='debug-usage' element={<DebugUsage />} />
```

It must sit inside the same authenticated wrapper as `debug` and `debug-em` — the endpoint requires a
token, so an unauthenticated route would only ever render a 401.

---

## Constraints

- **Front-end only.** Do not modify anything under `back/`. The endpoint already exists and is correct.
- **Read-only.** No mutations, no writes, no side effects.
- **No new dependencies.** No chart library, no table library, no date library.
- Do not rename or restructure the existing debug pages.
- Do not put the page behind an admin check — `debug` and `debug-em` are not, and matching them
  keeps the pilot workflow simple.

---

## Verification

From `front/`:

```bash
npx tsc --noEmit
```

Must be clean. Then confirm by inspection that:

- the page renders with **all arrays empty** without crashing (this is the state it will actually be
  in on first load — most likely everything is zero);
- the `days` control refetches;
- the raw-JSON toggle works;
- `/debug` and `/debug-em` still render (you touched the shared router file).

There are no front-end unit tests in this repo; `tsc` plus the above is the bar.

Backend is untouched, so `npm test` in `back/` is unaffected — but if you ran it, it should still be
**21/21 suites**.

---

## Context you may want but should not need

- `back/src/routes/app.routes.ts` — the `/debug-usage` handler, if you want to see what it returns.
- `back/src/services/usage-telemetry.service.ts` — `summarizeUsage()`, the authoritative shape.
- `front/src/app/DebugEmReasoning.tsx` — the pattern to follow.
- `front/src/services/api.service.ts` — the `api()` helper.

**Do not "improve" the summary shape or add fields.** If something looks missing, note it in your
report rather than changing the backend; the aggregation is deliberate and the field set is tied to
evidence commitments made to the domain expert.
