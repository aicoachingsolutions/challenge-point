# Codex Task — Soccer Module extraction slice 2: Realizations

**Type:** one extraction script + workbook wiring + tests. **No changes to selection or assembly.**
**Branch:** `claude/serene-dewdney-c78e18` (worktree `C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18`) — **not `main`**, which is a stale checkout with no `docs/`.
**Run everything from `back/`.**

---

## Context

We are extracting the embedded soccer implementation into a governed Sport Module workbook. **Slice 1
is done and is your template** — read it before starting:

- `back/src/scripts/extract-soccer-game-forms.ts` — the extractor
- `back/data/sport-modules/soccer/write-workbook.py` — writes rows into the workbook
- `back/data/sport-modules/soccer/project-workbook.py` — workbook → JSON projection
- `back/src/system/sport-module/soccer-module.ts` — loader + integrity gate
- `back/src/system/sport-module/soccer-module.unit.ts` — tests

Slice 2 does the same thing for the **Realizations** sheet.

---

## What to extract

**23 objects, from two files, into one sheet:**

- `back/src/system/test-library/constraints.ts` — `TEST_LIBRARY_V0_CONSTRAINTS` (12 objects)
- `back/src/system/test-library/environmental-manipulations.ts` —
  `TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS` (11 objects)

They share a TypeScript shape. The distinction between them is captured by
`universal_concept_type`: use `INTERACTION_REGULATION` for the constraints file and
`ENVIRONMENTAL_MANIPULATION` for the manipulations file. **That column is the only thing recording
which library an object came from — do not lose it.**

## Field mapping

Map these directly:

| Source field | Workbook column |
|---|---|
| `id` | `realization_id` **and** `legacy_source_id` |
| `title` | `realization_name` |
| `description` | `description` |
| `coachVocabulary` | `coach_vocabulary` |
| `category` | `selection_category_key` |
| `constraintRole` | `constraint_role` |
| `primaryConstraintType` | `primary_constraint_type` |
| `constraintArchetype` | `constraint_archetype` |
| `designIntent` | `design_intent` |
| `gameTemplateAnchor` | `game_template_anchor` |
| `targetAffordancePrimary` | `primary_target_affordance_ids` |
| `affordanceTagGroup` | `affordance_tag_group` |
| `suggestedConstraintPrompt` | `suggested_constraint_prompt` |
| `setupGuidance` | `setup_guidance` |
| `constraintSupport` | `constraint_support` |
| `visibilityTriggers` | `visibility_triggers` |
| `contextualAudit` | `contraindications` |
| `logicUsageNote` | `notes` |
| `environmentalRealizations` | `realization_bank_id` — see below |

**Transitional matching column:** `primary_affordance_matching_text` — the affordance slug with
underscores replaced by spaces (slice 1 does exactly this for game forms). This preserves the
matching corpus through extraction.

**Constants:** `status` = `ACTIVE`; `introduced_version` and `last_verified_version` =
`RC1-CANDIDATE-V3`; `provenance` = a short sentence naming this script.

**Leave empty** (no source data — do NOT invent): `universal_concept_id`, `primary_game_problem_ids`,
`secondary_game_problem_ids`, `game_form_ids`, `lens_ids`, `phase_of_play_ids`, all the
`age_band`/`level_band`/`player_count_*`/`area_*`/`duration_*`/`*_configuration` columns,
`parameter_*`, `allowed_range_*`, `protected_invariant`, `revalidation_required_on_change`,
`selector_weight`, `assembly_priority`, `suitability_conditions`, `representative_guidance`,
`example_patterns`, `incentive_patterns`, `consequence_patterns`, `realization_group_id`.

**`environmentalRealizations` needs judgement — flag it, don't force it.** It's an array of
alternative realization spines used by the information-expression directive and the diversity
rotation. `realization_bank_id` is a single ID, not an array. If a clean representation isn't
obvious, **leave `realization_bank_id` empty, report it, and do not drop the data silently.** Say so
in your report. That is the correct outcome, not a failure.

**Fields with no column** — report them in your summary rather than forcing them anywhere:
`type`, `notes` (source field, distinct from `logicUsageNote`), `includesIncentiveLayer`,
`incentiveMechanism`, `visibilityEffect`.

---

## Steps

1. Write `back/src/scripts/extract-soccer-realizations.ts`, modelled on the game-forms extractor.
   It emits `back/data/sport-modules/soccer/realizations.extracted.json`.
2. Add `"Realizations"` to the `SOURCES` map in `write-workbook.py` pointing at that file.
3. Run, in order:
   ```bash
   npx ts-node --files -r tsconfig-paths/register ./src/scripts/extract-soccer-realizations.ts
   python ../back/data/sport-modules/soccer/write-workbook.py
   python ../back/data/sport-modules/soccer/project-workbook.py
   ```
   (adjust paths — the python scripts are run from the repo root in slice 1)
4. Extend `soccer-module.unit.ts` with realization tests mirroring the game-form ones: all 23
   present by id, the matching corpus populated (`coach_vocabulary`, `description`,
   `selection_category_key`), the scoring inputs populated (`constraint_role`,
   `primary_constraint_type`, `constraint_archetype`, `primary_target_affordance_ids`), and
   `coach_vocabulary` round-tripping as a list.

**Assert non-empty, not merely present.** A row that loads with an empty `coach_vocabulary` passes a
naive test and silently destroys matching — that is the exact failure this slice must not ship.

**Expect a known-empty exception and pin it, don't soften the test.** Slice 1 found that GF10 has no
coach vocabulary; if some realizations also lack a field, list them in a named constant with a
comment, the way `GAME_FORMS_WITHOUT_COACH_VOCABULARY` does.

---

## Constraints

- **Do not modify** `generateSelection.ts`, `build-activity-skeleton.ts`, `constraints.ts`,
  `environmental-manipulations.ts`, or anything under `knowledge-core/`. This slice only *reads* the
  source objects.
- Do not wire the module into selection. That is a later slice.
- No new dependencies.
- If the sport-coupling guard fails on a file you added, add that file to `SPORT_LAYER_FILES` in
  `back/src/system/sport-coupling/sport-coupling.unit.ts` with a one-line comment — that is the
  correct response, and it is what slice 1 did.

## Verification

```bash
npx tsc --noEmit
npm test
```

**Must be 23/23 suites** (it is 23 now) and the sport-coupling ratchet must read `34; baseline: 34`
unless you legitimately added a declared sport-layer file.

Then confirm by inspection that the workbook has 23 Realizations rows and that
`realizations_expected_rows` in the Metadata sheet was updated to 23.

## Report back with

- rows extracted, and the count by `universal_concept_type`;
- what you did with `environmentalRealizations`;
- every source field you could not place;
- any field that was empty for some objects, and which ones.
