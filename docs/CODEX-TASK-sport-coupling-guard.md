# Codex Task — sport-coupling guard

**Type:** one new unit test + one generated baseline file. **No production code changes.**
**Branch:** `claude/serene-dewdney-c78e18` (worktree `C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18`) — **not `main`**.
**Run everything from `back/`.**

---

## Why this exists

Challenge Point is meant to be a sport-neutral reasoning platform with soccer as a detachable
knowledge layer. It currently isn't: soccer vocabulary is embedded in assembly, selection, input
normalization and validation.

The point of this task is **not** to fix that. It's to stop it getting worse, and to produce the
extraction list as a by-product.

The motivating evidence: sport-specific coach-facing copy was added to `coach-guidance.ts` on
2026-07-31 by someone actively thinking about sport separation, in a file they'd have called clean.
Separability is not maintainable by discipline. It needs a build guard.

---

## What to build

**Two files:**

1. `back/src/system/sport-coupling/sport-coupling.unit.ts` — the guard, run as part of `npm test`.
2. `back/src/system/sport-coupling/known-sport-coupling.json` — the generated baseline (see Ratchet).

Add the unit test to the `test` script chain in `back/package.json`, following the existing pattern
(it is a long `&&`-joined list of `ts-node --files -r tsconfig-paths/register ...` invocations).

---

## Design — read this part carefully

### 1. Default-deny, with an explicit sport-layer exemption

Scan every `.ts` file under `back/src/system/` and `back/src/services/`, **excluding** `*.unit.ts`.

A file is **sport-neutral by default**. Sport vocabulary is only permitted in files listed in an
explicit `SPORT_LAYER_FILES` array inside the test.

Seed `SPORT_LAYER_FILES` with the current soccer layer:

```
system/test-library/archetypes.ts
system/test-library/constraints.ts
system/test-library/environmental-manipulations.ts
system/test-library/affordanceLenses.ts
system/input-constraints/deriveInputConstraints.ts
system/test-library/normalizeCoachingInput.ts
system/knowledge-core/em-selection-metadata.ts
```

**Default-deny is the whole point.** A new file is neutral unless someone consciously declares it
part of the sport layer, which forces the decision to be made deliberately rather than by accident.

### 2. Term list — precision over recall

**A guard that cries wolf gets deleted.** Start with terms that cannot plausibly appear in
sport-neutral code, and nothing else.

Use these (case-insensitive, whole-word):

```
soccer, football, goalkeeper, goalkeeping, offside, dribble, dribbling, dribbles,
throw-in, corner kick, penalty kick, free kick, final third, midfielder, midfield,
striker, winger, centre-back, center-back, full-back, centre forward
```

**Explicitly DO NOT include** `pass`, `shot`, `goal`, `cross`, `header`, `pitch`, `score`, `player`,
`team`, `ball`. Every one produces false positives in this codebase — `goal` appears in "learning
goal" throughout, and `pass` appears in "compression pass", "a second pass", and `Pass []`. Adding
them would make the guard noisy on day one and it would be switched off within a week.

Widening the list later is easy and safe. Starting wide is not.

Matching must be whole-word and case-insensitive. `\b` behaves badly around hyphens — handle
hyphenated terms explicitly.

### 3. The ratchet — this is essential

**There are real violations in the codebase today.** A guard that fails immediately cannot be
merged, so it must accept the current state and forbid growth.

- On run, collect every violation as `{ file, term, line }`.
- Compare against `known-sport-coupling.json`.
- **Fail** if a violation exists that is not in the baseline.
- **Pass** if violations are a subset of the baseline.
- **Also fail if the baseline contains entries that no longer occur** — a stale baseline silently
  re-permits coupling. The message must say which entries to delete. This is what makes it a
  ratchet rather than a floor.
- Print the current count versus the baseline count on every run, so progress is visible.

Provide a documented way to regenerate the baseline — an env var such as
`UPDATE_SPORT_COUPLING_BASELINE=1` that rewrites the JSON. Say clearly in the file header that
regenerating is only correct when violations have been **removed**, never to silence new ones.

**Generate the initial baseline from the current codebase and commit it.** Do not hand-write it.

### 4. Output quality

When it fails, the message must be immediately actionable: file, line, term, and one sentence saying
either "move this to the sport layer" or "declare this file in SPORT_LAYER_FILES". A developer
should not have to read the test source to understand what to do.

---

## Constraints

- **No production code changes.** Do not fix any violation you find. That's a separate task, and
  fixing some would change generated output.
- No new dependencies. Use `node:fs` and `node:path`.
- Match the existing unit-test style: plain `node:assert/strict`, named `testX()` functions, a
  `runAll()`, and a final `console.log('... unit tests: all cases passed.')`.
- Do not scan `back/src/models`, `back/src/routes`, or the front end in this pass. System and
  services only — keep the first cut narrow enough to be trustworthy.

---

## Verification

From `back/`:

```bash
npx tsc --noEmit
```

Then:

```bash
npm test
```

**Must be 22/22 suites passing**, including the new one. It is currently 21.

Then prove the guard actually works — this matters more than it passing:

1. Temporarily add the word `goalkeeper` to a sport-neutral file (e.g.
   `back/src/system/activity/coach-language.ts`). Run `npm test`. **It must fail**, and the message
   must name that file and line.
2. Remove it. Run again. **It must pass.**
3. Report both results.

A guard that passes but would not have caught the thing it exists to catch is worse than no guard.

---

## Context

- `docs/HANDOFF.md` → "Soccer/universal separability audit" — the evidence behind this task,
  including the known violation sites.
- `back/src/system/activity/coach-language.unit.ts` — a good example of the expected test style,
  including how it pins a contract rather than an implementation.

**Report back with:** the baseline violation count, which files it came from, and the results of the
two-step verification above.
