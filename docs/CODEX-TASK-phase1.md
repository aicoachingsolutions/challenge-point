# Codex task — Phase 1: Library ingestion infrastructure

Self-contained brief. You are continuing the **Challenge Point** engine work. Do NOT need prior chat
context — everything required is here or in the repo. Read `docs/HANDOFF.md` for background if useful.

## Context (why this exists)
The domain expert (Christian) now ships **complete versioned RC1 Knowledge Core library packages** that
we IMPLEMENT (not review). Today the engine's libraries are **hardcoded TypeScript arrays**, so there is
no seam to plug a delivered library into. Phase 1 builds that seam. **Constraints for ALL of Phase 1:**
- **Behavior-preserving.** No change to which activities/packages get selected. Verify by unchanged
  selection scores + passing tests.
- **No new coaching knowledge, no new library content.** This is infrastructure only.
- Deterministic. No randomness.

## Environment
- Work in the worktree/branch already checked out: branch `claude/serene-dewdney-c78e18`.
- Backend lives in `back/`. Run all commands from `back/`.
- **Verify after every step:** `npx tsc --noEmit -p tsconfig.json` (must be clean) and
  `OPENAI_API_KEY=sk-dummy npm test` (all 6 unit suites must pass; ignore Mongo connection noise).
- Commit messages end with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- The CSV→TS generator `back/src/system/test-library/generate-data-from-csv.mjs` is **LOSSY — DO NOT RUN
  IT.** Edit `.ts` files directly.

## Current shape (already mapped — verify, don't rediscover)
- `back/src/system/test-library/index.ts` re-exports three hardcoded arrays:
  `TEST_LIBRARY_V0_AFFORDANCE_LENSES` (`./affordanceLenses`), `TEST_LIBRARY_V0_CONSTRAINTS`
  (`./constraints`), `TEST_LIBRARY_V0_ARCHETYPES` (`./archetypes`).
- Object types are flat interfaces in `back/src/system/test-library/types.ts`:
  `TestLibraryV0AffordanceLens`, `TestLibraryV0Constraint`, `TestLibraryV0Archetype`. Stable ids
  (`tl-v0-lens-*` / `tl-v0-constraint-*` / archetype id = `game_form_id` like `GF11`).
- **Direct consumers of the arrays (these are the coupling to remove):**
  - `back/src/system/test-library/generateSelection.ts` imports all three arrays at top.
  - `back/src/system/input-constraints/deriveInputConstraints.ts` references constraints/archetypes.
  - Grep the repo for `TEST_LIBRARY_V0_` to find every consumer before repointing.
- Existing partial infra to EXTEND (do not replace): `libraryConversionReport.ts` (load report shape),
  `libraryLoadDebug.ts` (`getTestLibraryV0LoadDebug`).

## Phase 1 build order — each step is independently shippable & behavior-preserving

### Step 1a — Registry + adapter, repoint consumers  ← DO THIS FIRST
Goal: introduce a single registry consumers query, seeded from today's hardcoded arrays, so nothing
changes behaviorally but the coupling is broken.
1. Create `back/src/system/test-library/library/registry.ts` exporting a registry with accessors:
   `affordanceLenses(): TestLibraryV0AffordanceLens[]`, `constraints(): TestLibraryV0Constraint[]`,
   `archetypes(): TestLibraryV0Archetype[]`. Internally hold registered libraries keyed by
   `{ type, version }`; expose the active version. Provide a `registerLibrary({type, version, items})`
   and a default seed that registers the three existing arrays under version `v0`.
2. Repoint `generateSelection.ts` and `deriveInputConstraints.ts` (and any other `TEST_LIBRARY_V0_*`
   consumer) to read from the registry instead of importing the arrays directly. Keep `index.ts`
   re-exporting the arrays for now (back-compat) — just source them from the registry seed.
3. **Verify identical behavior:** tsc clean; `npm test` passes; run
   `OPENAI_API_KEY=sk-dummy npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-selection-pipeline-tests.ts`
   and confirm the `bestScore=` values are UNCHANGED vs before (diff the scores). Commit.

### Step 1b — Schema validation
- Create `library/schema/` with one validator per current type, validating against the Knowledge Object
  Framework 7-part standard (Identity/Purpose/Scope/Relationships/Basis/Quality Criteria/Evolution) as
  far as the current fields allow (required-field + type checks at minimum). Return
  `{ valid: boolean, errors: {field, message}[] }` reusing/extending the `libraryConversionReport` error
  shape. Run validation at registration; surface failures in the load report. Add a unit test file
  (`library/schema/*.unit.ts`) and wire it into the `test` script in `back/package.json` (follow the
  existing `&&`-chained ts-node pattern). Behavior-preserving: current data must pass validation.

### Step 1c — Composition-interface checks
- Create `library/composition.ts` validating cross-object references at registration:
  `constraint.targetAffordancePrimary` resolves against a lens/affordance (or is a known primitive like
  `perception`), archetype `recommended_constraint_types` resolve, information constraints
  (`primaryConstraintType === 'information'`) carry `environmentalRealizations`. Report violations via
  the load report. Unit test + wire into `npm test`. Current data must pass.

### Step 1d — Version handling + load diagnostics
- Ensure each registered library carries a version tag and the registry can hold ≥1 version. Extend
  `getTestLibraryV0LoadDebug` to report registered libraries, versions, and schema/composition results.

## After Phase 1
Phase 2 = split `back/src/system/test-library/constraints.ts` along the **Environmental Manipulation vs
Constraint** boundary (EM owns environmental PROPERTIES; Constraint owns interaction CONDITIONS) and run
each as a separate registered library through this pipeline. Do NOT start Phase 2 until 1a–1d are green.

## Definition of done for this task
1a–1d each committed with tsc clean + all unit tests passing + selection-pipeline scores unchanged.
Report a summary of what changed per step.
