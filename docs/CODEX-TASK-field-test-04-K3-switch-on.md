# Codex task 04 — K3: switch the goal version on

**Read `docs/CODEX-TASK-field-test-00-RULES.md` first.** The governing design is section 4.1 row K3 of
`codex-input/design-field-test-2026-10-27.md`. Its sections 2.5 and 2.6 cover the default laws and section 2.8 the normal-rules
sentence. Baseline snapshot: `codex-output/snap-03.json`.

## Context

A01's record lists two ordered realizations, `[A01-R2, A01-R1]`. The builder tries them in that order and falls back with a typed
reason. A01-R2, the goal version, is held back by three knowledge gaps. Every capability it needs is now built:

- R1: one common restart;
- R3: no offside;
- L: penalty area and goalkeeper display;
- K1: the FA entry and suitability;
- K2: the box items.

This task lifts the gaps, so the real goal version is **served** when a coach has the right goal.

## Build

1. **Lift A01-R2's three gaps,** each settled in Christian's words, copy-pasted from `christian-2026-10-27.txt`:
   - `D-GOAL-SUITABILITY`: items 1 and 6;
   - `D-PENALTY-AREA`: items 1 and 1b;
   - `D-DEFAULT-LAWS`: items 2, 3, 4 and 6.

   Find the gap records with a grep for the ids. **The Stage F rule:** remove each gap from `neededBy` *before* marking it
   settled; the loader checks this order. If any item's words do not actually settle what its gap asks, **stop and report**. Do
   not lift that gap.
2. **Update A01-R2's `provisionalChoices`** and the observation limitation L2 ("no offside; observe advanced positioning") so
   they describe the served version.
3. **Re-point the goal-version tests.** The TEST-ONLY stand-ins in `goal-version-communication.unit.ts` (about lines 62–84:
   boundRegions null, REPORT, suitability 1–10 m) must use the real records.

## Prove: the real goal version is served

Use the built bundle, through both the review route and the live route. The session: 12 players, 1 goalkeeper, 40 x 30 m, one
FA 5v5 goal (type scaled, 3.6576 m).

**Expect:**

- end exchange between blocks;
- the goalkeeper and one outfield player transfer at the exchange;
- the box set out once, in its own Set up sentence;
- the goalkeeper marker on the diagram, plus the Players sentence "give the goalkeeper a colour neither team wears";
- the default-laws check under ENFORCE owes nothing;
- the normal-rules sentence served;
- one restart rule;
- "There is no offside." said once;
- the scoring lines and W3 unchanged (W1, W2, W3 are approved wording; never edit `docs/audits/approved-coach-wording.json`);
- no 5 m zones, no spot, no goal area;
- the team colours stable across blocks.

**And:**

- **The zone version is still served** when no goal is stated, when goals are "none", and for every unsuitable goal (task 02's
  cases). Its text is byte-identical to the baseline.
- **11 players / 1 goalkeeper:** the goal version is served with only the goalkeeper transferring.
- **Any area other than 40 x 30:** refused for both versions (TESTING_AREA).

**Read the served Overview and Coach Details as a coach would.** List any statement that is false, missing, said twice or
prescriptive. Report this list; do not rewrite DRAFT wording to fix it unless a sentence is factually false.

## Expected snapshot delta

- The A01 keys for sessions with the FA goal now show the goal version. If no snapshot case states the FA goal yet, add
  one review-route case and one live-route case to `back/src/scripts/regression-snapshot.entry.ts`, next to the
  `objects-one` cases.
- Everything else is unchanged: demonstrations, other goals, and the zone version's text.
- Each live key equals its review twin.

Save the snapshot as `codex-output/snap-04.json`.
