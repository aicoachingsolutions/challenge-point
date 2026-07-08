# Codex task — Phase 2: Split constraints into Environmental Manipulation + Constraint libraries

Self-contained brief. Continues **Challenge Point** engine work on branch
`claude/serene-dewdney-c78e18`. Phase 1 (library ingestion infrastructure) is DONE — this builds on it.
Read `docs/CODEX-TASK-phase1.md` and `docs/HANDOFF.md` for background if useful.

## Goal
Split the single hardcoded constraint library into the two libraries the frozen Batch 1 architecture
defines — **Environmental Manipulation** (modifies environmental PROPERTIES) and **Constraint**
(CONDITIONS that regulate interaction) — and register BOTH through the Phase 1 registry. This is the
first real library run through the ingestion pipeline and proves the machinery before the domain
expert's first RC1 package arrives.

## HARD CONSTRAINTS (all of Phase 2)
- **Behavior-preserving. Zero change to selection output.** The classification below only *relocates*
  objects between two source files and registers them as two libraries; the selection pool must remain
  the exact same 23 objects. **Verify: `test:selection-pipeline` bestScore sequence must stay
  `68,64,92,108,69,68,64,92,108,69,97,84`.**
- **Do NOT edit any object's content** (title/description/fields). Move object literals verbatim. No new
  coaching knowledge. Keep the existing `TestLibraryV0Constraint` type for BOTH libraries for now (a
  distinct EM type is a later phase; the split here is structural/registration only).
- **Do NOT run** `generate-data-from-csv.mjs` (lossy).
- Deterministic. tsc clean + all unit tests pass after each step.
- Verify from `back/`: `npx tsc --noEmit -p tsconfig.json`, `OPENAI_API_KEY=sk-dummy npm test`,
  `OPENAI_API_KEY=sk-dummy npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-selection-pipeline-tests.ts`.
- Commit step-by-step; messages end `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## Classification (authoritative for this task — do not re-derive)
Move these 11 objects from `back/src/system/test-library/constraints.ts` into a NEW file
`back/src/system/test-library/environmental-manipulations.ts` (export
`TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS`). Move the literals verbatim.

**Environmental Manipulations (11)** — by id:
- tl-v0-constraint-central-density-condition (Central Density Condition)
- tl-v0-constraint-zone-structure-condition (Zone Structure Condition)
- tl-v0-constraint-neutral-player-condition (Neutral Player Condition)
- tl-v0-constraint-small-area-condition (Small Area Condition)
- tl-v0-constraint-transition-trigger (Transition Trigger)
- tl-v0-constraint-wide-zone-advantage (Wide Zone Advantage) — BORDERLINE°
- tl-v0-constraint-goalkeeper-included-condition (Goalkeeper Included Condition) — BORDERLINE°
- tl-v0-constraint-variable-target-condition (Variable Target Condition)
- tl-v0-constraint-multi-goal-read (Multi-Goal Read)
- tl-v0-constraint-blind-side-entry (Blind-Side Entry) — BORDERLINE°
- tl-v0-constraint-disguised-restart (Disguised Restart)

**Constraints (12)** — REMAIN in `constraints.ts`:
progression-bonus, wide-utilization-bonus, switch-of-play-bonus, interception-reward, turnover-reward,
delay-reward, final-third-value, transition-bonus, recovery-window, counter-press-window,
pass-combination-gate, support-lane-requirement (BORDERLINE°).

° BORDERLINE: keep the default placement above, but add a `// BORDERLINE (EM vs Constraint) — confirm
with Christian's authoritative EM Library` comment on each so it's visible for later review. IDs are
stable and unchanged — nothing that references them by id needs updating.

## Build order (each step independently committed + verified)

### Step 2a — Extract the EM source file (no registry change yet)
- Create `environmental-manipulations.ts` exporting `TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS:
  TestLibraryV0Constraint[]` with the 11 objects moved verbatim from `constraints.ts`.
- Remove those 11 from `constraints.ts`.
- **Temporarily** keep behavior identical: in `test-library/index.ts` (or wherever the registry seeds),
  the constraint pool consumers must still see all 23. Do this in 2b via the registry union — but at 2a,
  make `constraints.ts`'s exported array OR the index re-export continue to yield all 23 (e.g. index
  re-exports a concatenation) so tsc + tests + pipeline stay green at every commit. Confirm pipeline
  scores unchanged. Commit.

### Step 2b — Register EM as a second library; union the pools for selection
- Extend the Phase 1 registry (`test-library/library/registry.ts`): add `'environmentalManipulations'`
  to `TestLibraryRegistryType`, add it to `TestLibraryRegistryItems`, `registeredLibraries`,
  `schemaValidationResults`, `activeVersions`, and add an accessor
  `testLibraryRegistry.environmentalManipulations()`. Seed it at v0 from the new array.
- Add a combined accessor for SELECTION that returns the union, e.g.
  `testLibraryRegistry.selectableConstraints()` → `[...constraints(), ...environmentalManipulations()]`
  (order: keep the original file order so scoring tie-breaks are unchanged — Constraints first, then EM,
  OR whatever reproduces the exact prior array order; VERIFY via pipeline scores).
- Repoint the selection consumers that today call `testLibraryRegistry.constraints()` for the pool —
  `generateSelection.ts` (`applyConstraintPoolFilter`) and `deriveInputConstraints.ts` — to the union
  accessor. `constraints()` now returns Constraint-typed only; `environmentalManipulations()` the EM
  ones; the union reproduces the old full pool. Revert the temporary 2a concatenation shim.
- **CRITICAL: pipeline bestScore sequence must be byte-identical to the baseline.** If it changed, the
  union order is wrong — fix ordering until scores match. Commit.

### Step 2c — Schema + composition for the EM library
- Reuse the existing constraint schema validator for EM (same shape for now) or add a thin
  `validateEnvironmentalManipulationSchema` alias. Include EM items in `validateLibraryComposition`
  (they participate in the same `targetAffordancePrimary` / info-realization checks). Current data must
  pass. Extend the registry unit test to assert the EM library registers, validates, and that
  `constraints().length + environmentalManipulations().length === 23` and the union equals the old pool.
- Wire any new unit file into `back/package.json` `test`. Commit.

## Definition of done
2a–2c committed; tsc clean; all unit tests pass; selection-pipeline bestScore sequence unchanged
(`68,64,92,108,69,68,64,92,108,69,97,84`); two registered libraries (constraints + environmental
manipulations) visible in `testLibraryRegistry.registeredLibraries()`. Report per-step summary and
confirm the pipeline scores matched.

## After Phase 2
Phase 3 = `generateSelection` reasoning/commitment split (un-fuse candidate enumeration from the single
commitment). Do NOT start it in this task.
