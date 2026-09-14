# Codex Task — carry the coach's chosen Learning Goal into selection

**Type:** plumbing. **No change to which activity is selected.**
**Branch:** `claude/serene-dewdney-c78e18` (worktree `C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18`) — **not `main`, and not `C:\challenge-point`** (a stale checkout).
**Run everything from `back/`.** Commit when done; **do not push**.

---

## Why this exists

In the guided planning conversation a coach picks exactly one of 13 canonical Learning Goals (A01–A06,
D01–D03, TA01–TA02, TD01–TD02). Each goal routes to a Representative Performance Context. The next
architecture step makes that context steer selection.

**Selection cannot do that today, because it never learns which goal was picked:**
- `POST` generate in `src/routes/app.routes.ts` receives `planning.learningGoalId` (`PlanningSelectionInput`,
  around line 55).
- It sends that id to telemetry (around line 842) and to assembly (`coachInput.learningGoalId`, around line 934).
- But it calls `generateSelection({ learningGoals, challengeLevel }, inputConstraints)` around line 855,
  with **only the goal text**.

This task carries the id into selection and records the routed context in the selection trace, **without
letting either influence the selection yet**. When the context later becomes a selection dimension, the
input will already be there and proven inert until then.

---

## What to build

### 1. Selection input — `src/system/test-library/types.ts`

Add `learningGoalId?: string` to `TestLibrarySelectionInput` (around line 109). Give it a doc comment:
- set only by the guided planning conversation;
- an id, not coach text;
- carried for context routing;
- no selection influence yet.

### 2. Selection trace — same file

Add an optional field to `TestLibrarySelectionResult.selectionTrace`:

```ts
planning?: {
    learningGoalId: string
    /** Session Planning Model "RPC Routing" for this goal. Trace only — no selection influence yet. */
    routedRpcId: string | null
}
```

Leave `planning` absent when no `learningGoalId` was given, as with free-text goals.

### 3. `generateSelection` — `src/system/test-library/generateSelection.ts`

- When `input.learningGoalId` is present:
  - look it up with `sessionPlanningModel.learningGoal(id)` from `../session-planning/session-planning-model`;
  - **if it does not exist, throw** `Error` with a message naming the id. An id the workbook does not
    contain means the client and the canonical model disagree, and the project's rule is to fail loudly
    rather than continue on a guess.
- Resolve `routedRpcId` from `sessionPlanningModel.rpcRouting()`, or `null` if no route exists.
- Put `{ learningGoalId, routedRpcId }` in `selectionTrace.planning`.
- **The id must NOT enter `buildQueryCorpus`, tokens, scoring, pool filtering or tie-breaking.** Read the
  comment above `buildQueryCorpus` (around line 81). An id reaching the matching corpus is exactly the
  defect class `selection-input-independence.unit.ts` exists to catch: `challengeLevel` once changed real
  activities that way.
- **Do not import** `src/system/sport-module/rpc-library.ts` or any other sport-layer file into
  `test-library/`. The routed id comes from the Session Planning Model. That keeps the sport-coupling
  guard at 35.

### 4. The route — `src/routes/app.routes.ts`

- Pass `learningGoalId: planning?.learningGoalId` in the `generateSelection` call around line 855.
- In the `selection_resolved` usage event just below, add `learningGoalId` and `routedRpcId` from
  `selection.selectionTrace.planning`. Use `null` for both when absent. This is evidence only.
- Change nothing else in the route.

### 5. Tests — `src/system/test-library/selection-input-independence.unit.ts`

Extend the existing file in its style: named `testX()` functions, plain `node:assert/strict`, no new
dependencies. Add:

1. **The id does not influence selection.**
   - For each of the 13 goals in `sessionPlanningModel.learningGoals()`, use the goal's name as the text.
   - Selection with and without `learningGoalId` must give an identical `decisionFingerprint`.
   - It must also give an identical `selectionTrace.queryCorpus`.
2. **The trace records the route.** For every goal, `selectionTrace.planning` equals
   `{ learningGoalId: id, routedRpcId: <the route from sessionPlanningModel.rpcRouting()> }`. Spot-pin
   `A06 → RPC-005` and `A01 → RPC-001` explicitly.
3. **Free text records no planning.** Without an id, `selectionTrace.planning` is `undefined`.
4. **An unknown id fails loudly.** `learningGoalId: 'NOPE'` throws, and the message contains `NOPE`.

---

## Constraints

- **No behaviour change.** The selection behaviour gate must stay `70 68 98 119 94 99 86`.
- Do not change any other `generateSelection` call site (scripts, other routes, other tests). The field
  is optional on purpose.
- Do not touch the front end. It already sends `planning.learningGoalId`.
- Do not touch `src/system/sport-module/`, any `.json` or `.xlsx` knowledge file, or the sport-coupling
  baseline.
- No sport vocabulary in `test-library/` code or comments. The guard is default-deny.
- **Never write a regex through a Python heredoc.** Use a normal file edit.

---

## Verification

From `back/`:

```bash
npx tsc --noEmit
npm test
```

All **44** suites must pass, including sport-coupling at **35/35**.

The behaviour gate must be unchanged:

```bash
OPENAI_API_KEY=sk-dummy npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-selection-pipeline-tests.ts 2>&1 | grep -o 'bestScore=[0-9]*'
```

Expected `70 68 98 119 94 70 68 98 119 94 99 86`; the first five print twice, which is normal.

**Then prove the independence test bites.** This matters more than it passing:
1. Temporarily append `input.learningGoalId ?? ''` to the parts in `buildQueryCorpus`. Run `npm test`.
   **Test 1 must fail**, and its message must name a goal.
2. Revert. Run again. **It must pass.**
3. Report both results.

---

## Report back with

- The files changed.
- `npm test` and behaviour-gate output.
- The two-step bite proof.
- Any `generateSelection` behaviour you found that surprised you, reported rather than fixed.
