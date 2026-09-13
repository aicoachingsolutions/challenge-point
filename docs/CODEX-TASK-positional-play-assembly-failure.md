# Codex Task — a Positional Play intention fails assembly every time

**Type:** diagnose, then the smallest fix that removes the cause. **Coach-facing generation is involved, so
Claude audits the result before it ships.**
**Branch:** `claude/serene-dewdney-c78e18` (worktree `C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18`) — **not `main`, and not `C:\challenge-point`** (a stale checkout).
**Run everything from `back/`.** Commit when done; **do not push**.

---

## The defect

A coach who types this goal gets an error instead of three activities:

```bash
AUDIT_INPUTS="Create better support angles under pressure." SLOT_INDEX=1 npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-coach-view-audit.ts
```

Observed on 2026-09-13 in **3 of 3 runs**. Each run already retries assembly once, so that is six failed
generations:

```
ActivityAssemblyValidationError: Invalid activity structure from AI after retry.
First:  Activity 2 missing skeleton mechanic: Opponent consequence emphasis (reflect in scoring or rules): opponent gains; restart; regain; counter
Second: Activity 2 missing skeleton mechanic: Opponent consequence emphasis (reflect in scoring or rules): opponent gains; restart; regain; counter
```

- The intention selects **Positional Play Games**.
- Another Positional Play intention, `Defend deeper and stay compact.`, assembles fine.
- Directional Possession, Transition, Channel and Finishing intentions also assemble fine.
- It is always **Activity 2** and always this requirement.

**This calls the real model.** If your environment has no OpenAI key or no network access, **stop and report
that**. Do not reason about what the model "probably" wrote. The whole point is to read what it actually
wrote.

---

## What is already known — read before changing anything

1. **The requirement line** is emitted in `src/system/activity/build-activity-skeleton.ts` (around line 643):
   `Opponent consequence emphasis (reflect in scoring or rules): <signals joined by "; ">`.
2. **How it is matched:** `matchesMechanicRequirement` in `src/system/activity/validate-activity-skeleton.ts`.
   Our reading of it:
   - `requirementContent` strips the `Label (instruction): ` prefix, leaving `opponent gains; restart; regain; counter`.
   - Tokens longer than 3 characters: `opponent, gains, restart, regain, counter`, five in all.
   - Short requirement, so ratio 0.35, which gives a threshold of **2 whole-word hits**.
   - Whole-word matters: `regains` does not match `regain`, and `counters` does not match `counter`.
   - Check this reading against the code, and check WHICH text this requirement is tested against inside
     `validateActivityAgainstSkeleton`.
3. **Pipeline order is map → validate → compress.** Validation reads the model's raw rules and scoring,
   BEFORE coach-facing compression. So compression cannot cause this failure: the raw Activity 2 really
   does lack the words.
4. `cleanOpponentConsequenceLine` in `src/system/activity/build-activity-mechanics.ts` deliberately
   keeps these signal lists out of what coaches read. **That is correct. Leave it alone.**
5. The retry prompt is `buildSkeletonRetryAddendum` in `src/services/completion.service.ts`. It tells the
   model to "satisfy every skeleton mechanic" without naming what was missing.

---

## What to do

### 1. Measure first

For the failing intention, capture and include in your report:
- Activity 2's slot: `requiredConstraintMechanics`, `requiredScoringMechanics`, and any slot modifier lines.
- The **raw** Activity 2 `rules` and `scoring` from both assembly attempts, before compression. Add
  temporary logging if needed, and remove it afterwards.
- Which of `opponent / gains / restart / regain / counter` appear, and in what word forms.
- The same slot information for the passing intention `Defend deeper and stay compact.`, so the difference
  is visible.

Then state the root cause in one or two sentences, with that evidence. Likely candidates, unranked:
- Slot 2's variation crowds consequence language out of rules and scoring.
- The model writes the idea in word forms the matcher never counts ("regains", "counter-attacks").
- The retry addendum is too vague to repair it.

**Do not pick one before you have the raw text.**

### 2. Fix the cause, minimally

Acceptable directions, depending on what you find:
- Make the retry addendum name the specific missing requirement and its signal words.
- Fix whatever in slot 2's brief makes the requirement unsatisfiable or crowded out.
- **Only if** the evidence shows correct coaching language failing on word form: widen matching so the
  natural inflections of the signal words count. Cover it with unit tests in BOTH directions in
  `validate-activity-skeleton.unit.ts`, following the existing pattern around line 184.

### 3. Forbidden — each of these makes the error disappear without fixing anything

- Lowering the threshold or ratio, or deleting or skipping the requirement.
- Special-casing this goal text, Positional Play, or "Activity 2".
- Making `matchesMechanicRequirement` accept text that does not express the requirement. A test that
  cannot fail is worse than an intermittent failure.
- Moving coach-facing shaping ahead of validation.

---

## Do not touch

- `coach-voice.ts`, `compress-activity-output.ts`, `coach-section-ownership.ts`, `coach-communication-standard.ts`
- `build-activity-mechanics.ts` (`cleanOpponentConsequenceLine` in particular)
- Anything in `src/system/test-library/` (selection), `src/system/sport-module/`, `src/system/session-planning/`
- Any `.json` or `.xlsx` knowledge file, and `src/system/sport-coupling/known-sport-coupling.json`

**Never write a regex through a Python heredoc.** Use a normal file edit, then check the edited files
contain no control bytes. The project has lost a week to a `\b` that became a backspace byte.

---

## Verification

From `back/`:

```bash
npx tsc --noEmit
npm test
```

All **44** suites must pass, including sport-coupling at **35/35**.

The selection behaviour gate must be unchanged at `70 68 98 119 94 99 86`:

```bash
OPENAI_API_KEY=sk-dummy npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-selection-pipeline-tests.ts 2>&1 | grep -o 'bestScore=[0-9]*'
```

(The first five scores print twice; that is expected.)

Then prove the fix with real generation:
1. Run the reproduction command **3 times**. All three must produce activities.
2. Run `AUDIT_INPUTS="Defend deeper and stay compact.|Keep the ball better under pressure.|Finish more of the chances we create."` once. All must still assemble.
3. **Read** the printed Activity 2 for the fixed intention. Its rules and scoring must read as coaching
   language, with no signal-word lists and no instruction text leaking to the coach.

---

## Report back with

- The root cause, with the raw Activity 2 text that shows it.
- The change, file by file, and why it addresses that cause.
- Before/after results: 3 reproduction runs, the other intentions, `npm test`, and the behaviour gate.
- Anything you noticed but deliberately did not change.
