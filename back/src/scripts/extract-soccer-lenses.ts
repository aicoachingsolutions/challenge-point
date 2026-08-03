/**
 * Soccer Module extraction — Lenses sheet (slice 3).
 *
 * ONE-TIME MIGRATION. Reads the live `TEST_LIBRARY_V0_AFFORDANCE_LENSES` and emits Lenses rows as
 * JSON for the workbook writer.
 *
 * WHY LENSES MATTER MOST OF THE THREE OBJECT SHEETS. A lens is the primary surface a coach's goal is
 * matched against, and `categoryToSlug(lens.category)` produces the key that a realization's target
 * affordance is compared to — the largest single scoring bonus in the selector. So `lens_name`,
 * `lens_description`, `selection_category_key`, `design_intent` and `coach_vocabulary` are not
 * descriptive metadata here; they are the matching corpus and the join key.
 *
 * THREE FIELDS HAVE NO COLUMN ON THIS SHEET, and are deliberately left unextracted rather than
 * approximated into an adjacent column:
 *
 *   visibilityTriggers          — when the affordance becomes perceivable
 *   exampleConsequencePatterns  — consequence shapes that reward the affordance
 *   suggestedConstraintPrompt   — the design prompt for shaping this affordance
 *
 * All three exist on all ten lenses. Columns for them exist on the **Realizations** sheet
 * (`visibility_triggers`, `consequence_patterns`, `suggested_constraint_prompt`) where they are
 * empty for all 23 rows, because the underlying constraint objects do not carry the first two at
 * all. They are lens properties that were placed on the wrong sheet — an error that traces back to
 * this implementation describing them as constraint fields. Reported rather than shoehorned; mapping
 * them into `suitability_conditions` or `notes` would preserve the characters and lose the meaning.
 *
 * PER-LENS WEIGHTS ARE ALSO EMPTY, and correctly so. The sheet anticipates `base_selection_weight`
 * and per-category bonus weights, but this implementation holds a single global weights table
 * (`selection-weights.ts`). Under the standard's own split those are selection *logic*, owned by the
 * universal platform, not selection *knowledge* owned by the module — so there is nothing to move.
 */
import fs from 'node:fs'
import path from 'node:path'

import { TEST_LIBRARY_V0_AFFORDANCE_LENSES } from '../system/test-library/affordanceLenses'

const LIST_DELIMITER = '; '
const join = (values: readonly string[] | undefined): string => (values ?? []).join(LIST_DELIMITER)

interface LensRow {
    [column: string]: string | number | null
}

function buildRows(): LensRow[] {
    return TEST_LIBRARY_V0_AFFORDANCE_LENSES.map((lens) => ({
        lens_id: lens.id,
        lens_name: lens.title,
        lens_description: lens.description ?? '',
        coach_vocabulary: join(lens.coachVocabulary),
        // The join key behind the largest scoring bonus — see header note.
        selection_category_key: lens.category ?? '',
        design_intent: lens.designIntent ?? '',
        // Routing lives in the parser, not on the lens; slice 4 populates the Vocabulary sheet.
        signal_group_ids: '',
        primary_game_problem_ids: '',
        primary_game_problem_matching_text: [lens.title, lens.designIntent].filter(Boolean).join(' '),
        secondary_game_problem_ids: '',
        // NOTE: an engine tag group ("Attacking"), not a canonical affordance ID. Recorded as
        // matching text so nothing is lost; re-keying to canonical IDs is a separate decision.
        primary_affordance_ids: '',
        primary_affordance_matching_text: lens.affordanceTagGroup ?? '',
        secondary_affordance_ids: '',
        game_form_affinity_ids: '',
        // constraintSupport IS a constraint-role list ("shaping", "consequence"), so this column is
        // its correct home — unlike the three fields named in the header note.
        recommended_constraint_types: join(lens.constraintSupport),
        information_expression_affinity_ids: '',
        phase_of_play_ids: '',
        phase_of_play_matching_text: join(lens.gameTemplateAnchor).replace(/_/g, ' '),
        // Global weights table, not per-lens — see header note.
        base_selection_weight: '',
        game_problem_bonus_weight: '',
        affordance_bonus_weight: '',
        game_form_bonus_weight: '',
        constraint_type_bonus_weight: '',
        information_expression_bonus_weight: '',
        suitability_conditions: '',
        known_limitations: lens.contextualAudit ?? '',
        status: 'ACTIVE',
        legacy_source_id: lens.id,
        introduced_version: 'RC1-CANDIDATE-V3',
        last_verified_version: 'RC1-CANDIDATE-V3',
        provenance: 'Extracted from TEST_LIBRARY_V0_AFFORDANCE_LENSES via extract-soccer-lenses.ts',
        // `notes` ONLY. An earlier cut joined this with logicUsageNote, which made the cell
        // unsplittable and silently corrupted both on the way back — caught by the adapter
        // equivalence test. logicUsageNote is a fourth lens field with no column; see header note.
        notes: lens.notes ?? '',
    }))
}

function main(): void {
    const rows = buildRows()
    const outPath = path.resolve(__dirname, '../../data/sport-modules/soccer/lenses.extracted.json')
    fs.writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`)

    console.log(`Extracted ${rows.length} lenses → ${outPath}`)
    console.log('Lens fields with NO column on the Lenses sheet (reported, not approximated):')
    for (const field of [
        'visibilityTriggers',
        'exampleConsequencePatterns',
        'suggestedConstraintPrompt',
        'logicUsageNote',
    ] as const) {
        const present = TEST_LIBRARY_V0_AFFORDANCE_LENSES.filter((l) => {
            const value = (l as unknown as Record<string, unknown>)[field]
            return Array.isArray(value) ? value.length > 0 : Boolean(value)
        }).length
        console.log(`  ${field}: present on ${present}/${rows.length} lenses, column exists on Realizations instead`)
    }
}

main()
