/**
 * Soccer Module extraction - Realizations sheet.
 *
 * ONE-TIME MIGRATION, not a runtime path. Reads the live Test Library V0 constraint and
 * environmental-manipulation entries and emits Realizations rows as JSON for the workbook writer.
 * After the workbook becomes canonical this script is the audit trail for how the rows were
 * derived, not a thing that runs again.
 *
 * Run:  npx ts-node --files -r tsconfig-paths/register ./src/scripts/extract-soccer-realizations.ts
 * Then: python back/data/sport-modules/soccer/write-workbook.py
 *
 * `environmentalRealizations` is deliberately not forced into `realization_bank_id`: the source
 * field is an array of alternative realization spines, while the workbook column is a single ID.
 * Leaving it empty and reporting the source rows preserves the judgement call instead of hiding it.
 */
import fs from 'node:fs'
import path from 'node:path'

import { TEST_LIBRARY_V0_CONSTRAINTS } from '../system/test-library/constraints'
import { TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS } from '../system/test-library/environmental-manipulations'
import type { TestLibraryV0Constraint } from '../system/test-library/types'

/** Workbook convention for multi-value cells. */
const LIST_DELIMITER = '; '

const join = (values: readonly string[] | undefined): string => (values ?? []).join(LIST_DELIMITER)

interface RealizationRow {
    [column: string]: string | number | null
}

type SourceGroup = {
    universalConceptType: 'INTERACTION_REGULATION' | 'ENVIRONMENTAL_MANIPULATION'
    rows: TestLibraryV0Constraint[]
}

const SOURCE_GROUPS: SourceGroup[] = [
    {
        universalConceptType: 'INTERACTION_REGULATION',
        rows: TEST_LIBRARY_V0_CONSTRAINTS,
    },
    {
        universalConceptType: 'ENVIRONMENTAL_MANIPULATION',
        rows: TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS,
    },
]

function buildRow(source: TestLibraryV0Constraint, universalConceptType: SourceGroup['universalConceptType']): RealizationRow {
    return {
        realization_id: source.id,
        realization_group_id: '',
        // See header note: source is an array of realization text, not a single bank ID.
        realization_bank_id: '',
        realization_name: source.title,
        coach_vocabulary: join(source.coachVocabulary),
        description: source.description,
        universal_concept_type: universalConceptType,
        selection_category_key: source.category,
        universal_concept_id: '',
        game_form_ids: '',
        lens_ids: '',
        primary_game_problem_ids: '',
        secondary_game_problem_ids: '',
        constraint_role: source.constraintRole,
        primary_target_affordance_ids: source.targetAffordancePrimary,
        primary_affordance_matching_text: source.targetAffordancePrimary.replace(/_/g, ' '),
        secondary_target_affordance_ids: '',
        primary_constraint_type: source.primaryConstraintType,
        constraint_archetype: source.constraintArchetype,
        design_intent: source.designIntent,
        game_template_anchor: join(source.gameTemplateAnchor),
        phase_of_play_ids: '',
        phase_of_play_matching_text: '',
        age_band: '',
        level_band: '',
        player_count_min: '',
        player_count_max: '',
        area_length_value: '',
        area_width_value: '',
        area_unit: '',
        duration_value: '',
        duration_unit: '',
        team_structure: '',
        role_configuration: '',
        equipment_configuration: '',
        restart_configuration: '',
        scoring_configuration: '',
        parameter_name: '',
        parameter_value: '',
        parameter_unit: '',
        allowed_range_min: '',
        allowed_range_max: '',
        protected_invariant: '',
        revalidation_required_on_change: '',
        selector_weight: '',
        assembly_priority: '',
        suitability_conditions: '',
        representative_guidance: '',
        affordance_tag_group: source.affordanceTagGroup,
        suggested_constraint_prompt: source.suggestedConstraintPrompt,
        setup_guidance: join(source.setupGuidance),
        constraint_support: '',
        visibility_triggers: '',
        example_patterns: '',
        incentive_patterns: '',
        consequence_patterns: '',
        contraindications: source.contextualAudit,
        status: 'ACTIVE',
        legacy_source_id: source.id,
        introduced_version: 'RC1-CANDIDATE-V3',
        last_verified_version: 'RC1-CANDIDATE-V3',
        provenance: 'Extracted from TEST_LIBRARY_V0_CONSTRAINTS and TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS via extract-soccer-realizations.ts',
        // `notes`, NOT `logicUsageNote`. The source carries both, the sheet has one column, and the
        // selector reads `notes` as part of its matching corpus while `logicUsageNote` is never read
        // for realizations. An earlier cut mapped the wrong one, which would have dropped matching
        // text and kept an unread field — caught by the adapter equivalence test.
        notes: source.notes,
    }
}

function buildRows(): RealizationRow[] {
    return SOURCE_GROUPS.flatMap((group) => group.rows.map((row) => buildRow(row, group.universalConceptType)))
}

function nonEmpty(value: unknown): boolean {
    return value !== null && value !== undefined && String(value).trim() !== ''
}

function main(): void {
    const rows = buildRows()
    const outPath = path.resolve(__dirname, '../../data/sport-modules/soccer/realizations.extracted.json')
    fs.writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`)

    const byUniversalConceptType = rows.reduce<Record<string, number>>((counts, row) => {
        const type = String(row.universal_concept_type)
        counts[type] = (counts[type] ?? 0) + 1
        return counts
    }, {})
    const environmentalRealizations = SOURCE_GROUPS.flatMap((group) => group.rows).filter((row) =>
        (row.environmentalRealizations ?? []).length > 0
    )
    const emptyFields = [
        'coach_vocabulary',
        'setup_guidance',
        'constraint_support',
        'visibility_triggers',
        'realization_bank_id',
    ].map((field) => ({
        field,
        ids: rows.filter((row) => !nonEmpty(row[field])).map((row) => String(row.realization_id)),
    }))

    console.log(`Extracted ${rows.length} realizations -> ${outPath}`)
    console.log('Count by universal_concept_type:')
    for (const [type, count] of Object.entries(byUniversalConceptType)) {
        console.log(`  ${type}: ${count}`)
    }
    console.log('environmentalRealizations left out of realization_bank_id because the workbook column is a single ID:')
    for (const row of environmentalRealizations) {
        console.log(`  ${row.id}: ${row.environmentalRealizations?.length ?? 0} alternatives`)
    }
    console.log('Source fields with no workbook column: type, notes, includesIncentiveLayer, incentiveMechanism, visibilityEffect')
    console.log('Empty extracted fields:')
    for (const entry of emptyFields) {
        if (entry.ids.length > 0) console.log(`  ${entry.field}: ${entry.ids.length}/${rows.length} rows (${entry.ids.join(', ')})`)
    }
}

main()
