/**
 * Soccer Module extraction — Game Forms sheet.
 *
 * ONE-TIME MIGRATION, not a runtime path. Reads the live `TEST_LIBRARY_V0_ARCHETYPES` and emits the
 * Game Forms rows as JSON for the workbook writer. After the workbook becomes canonical this script
 * is the audit trail for how the rows were derived, not a thing that runs again.
 *
 * Run:  npx ts-node --files -r tsconfig-paths/register ./src/scripts/extract-soccer-game-forms.ts
 * Then: python back/data/sport-modules/soccer/write-workbook.py
 *
 * WHAT THIS DELIBERATELY DOES NOT DO. Two workbook columns require universal identifiers that this
 * implementation has never held:
 *
 *   canonical_game_archetype_id — our eleven game forms were authored before the canonical Game
 *   Archetype Library existed and were never bridged to GA-001..006.
 *   primary_game_problem_ids    — likewise, routing goes through signal groups, not GP-IDs.
 *
 * Christian's instruction was to flag what cannot be represented cleanly rather than work around it,
 * so these are left empty and reported. Inventing the mapping here would be authoring coaching
 * knowledge inside a migration script, and it would be invisible once written.
 *
 * The `*_matching_text` columns are populated from the prose the selector currently scores, which is
 * what preserves the behaviour gate through extraction.
 */
import fs from 'node:fs'
import path from 'node:path'

import { TEST_LIBRARY_V0_ARCHETYPES } from '../system/test-library/archetypes'

/** Workbook convention for multi-value cells. */
const LIST_DELIMITER = '; '

const join = (values: readonly string[] | undefined): string => (values ?? []).join(LIST_DELIMITER)

interface GameFormRow {
    [column: string]: string | number | null
}

function buildRows(): GameFormRow[] {
    return TEST_LIBRARY_V0_ARCHETYPES.map((a) => ({
        game_form_id: a.game_form_id,
        game_form_name: a.game_form_name,
        coach_vocabulary: join(a.coachVocabulary),
        // Unmapped — see header note.
        canonical_game_archetype_id: '',
        objective: a.objective ?? '',
        primary_game_problem_ids: '',
        // Transitional corpus: the prose the selector scores today.
        primary_game_problem_matching_text: [a.objective, a.interaction_structure].filter(Boolean).join(' '),
        secondary_game_problem_ids: '',
        // NOTE: these are engine lens slugs (create_space, finish…), NOT canonical affordance IDs.
        // Recorded as-is so nothing is lost; re-keying to canonical IDs is a separate decision.
        primary_affordance_ids: join(a.primaryAffordances),
        primary_affordance_matching_text: join(a.primaryAffordances).replace(/_/g, ' '),
        secondary_affordance_ids: join(a.secondaryAffordances),
        compatible_lens_ids: '',
        information_expression_ids: '',
        phase_of_play_ids: '',
        phase_of_play_matching_text: a.phase_of_play ?? '',
        directionality_type: a.directionality_type ?? '',
        opposition_structure: '',
        interaction_structure: a.interaction_structure ?? '',
        scoring_structure_type: '',
        restart_structure_type: '',
        role_structure: a.player_structure_logic ?? '',
        minimum_players: '',
        maximum_players: '',
        // The engine holds two distinct "recommended constraint" fields. The role-typed one is the
        // structured value; the descriptive one feeds matching. Keeping them apart matters — the +3
        // bonus reads the role-typed list.
        recommended_constraint_types: join(a.recommendedConstraintTypes),
        recommended_constraint_matching_text: join(a.recommended_constraint_types),
        constraint_fit_1_name: 'structural',
        constraint_fit_1_value: a.constraintFit_structural ?? '',
        constraint_fit_2_name: 'shaping',
        constraint_fit_2_value: a.constraintFit_shaping ?? '',
        constraint_fit_3_name: 'consequence',
        constraint_fit_3_value: a.constraintFit_consequence ?? '',
        compatible_realization_group_ids: '',
        representative_requirements: a.representative_design_notes ?? '',
        known_limitations: '',
        status: 'ACTIVE',
        legacy_source_id: a.id,
        introduced_version: 'RC1-CANDIDATE-V3',
        last_verified_version: 'RC1-CANDIDATE-V3',
        provenance: 'Extracted from TEST_LIBRARY_V0_ARCHETYPES via extract-soccer-game-forms.ts',
        notes: a.logicUsageNote ?? '',
    }))
}

function main(): void {
    const rows = buildRows()
    const outPath = path.resolve(__dirname, '../../data/sport-modules/soccer/game-forms.extracted.json')
    fs.writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`)

    const unmapped = {
        canonical_game_archetype_id: rows.filter((r) => !r.canonical_game_archetype_id).length,
        primary_game_problem_ids: rows.filter((r) => !r.primary_game_problem_ids).length,
    }

    console.log(`Extracted ${rows.length} game forms → ${outPath}`)
    console.log('Unmapped universal identifiers (flagged, deliberately not invented):')
    for (const [field, count] of Object.entries(unmapped)) {
        console.log(`  ${field}: ${count}/${rows.length} rows empty`)
    }
}

main()
