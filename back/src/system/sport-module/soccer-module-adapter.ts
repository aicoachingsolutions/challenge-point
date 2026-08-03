/**
 * Soccer Module → engine object adapter.
 *
 * Reconstructs the typed objects the selection engine consumes from the governed workbook rows.
 * This is the piece that makes the module *load-bearing* rather than merely populated: once the
 * registry is seeded from here, soccer knowledge reaches the selector through the module instead of
 * through hardcoded arrays.
 *
 * STRATEGY — PROVE EQUIVALENCE BEFORE FLIPPING ANYTHING. The module currently holds data extracted
 * from the very arrays it would replace, so a faithful adapter must reconstruct objects that
 * deep-equal the originals. That is a far stronger and faster check than running the pipeline and
 * comparing scores: if the objects are identical, the behaviour gate *cannot* move. The unit test
 * asserts exactly that, field by field, and reports any field that cannot survive the round trip.
 *
 * Doing this while the module still mirrors the source is deliberate. Once Christian's vocabulary
 * additions are ingested, a score change could be his new knowledge or an adapter defect, and the
 * two would have to be untangled. Right now there is only one possible explanation for a
 * difference, which makes the adapter cheap to validate.
 */
import type {
    TestLibraryV0AffordanceLens,
    TestLibraryV0Archetype,
    TestLibraryV0Constraint,
} from '../test-library/types'
import { soccerModule, type SoccerModuleRow } from './soccer-module'

/** Workbook convention for multi-value cells, mirroring the extractors. */
const LIST_DELIMITER = ';'

function text(row: SoccerModuleRow, column: string): string {
    const value = row[column]
    return value === null || value === undefined ? '' : String(value)
}

/**
 * Split a delimited cell back into a list. Returns `[]` for an empty cell — the extractors wrote
 * `''` for both "empty array" and "absent", so this cannot distinguish them. Where the source
 * genuinely used `undefined` rather than `[]`, the equivalence test will surface it.
 */
function list(row: SoccerModuleRow, column: string): string[] {
    const raw = text(row, column).trim()
    if (!raw) return []
    return raw
        .split(LIST_DELIMITER)
        .map((entry) => entry.trim())
        .filter(Boolean)
}

/** Optional single value — `undefined` when the cell is empty, matching the source shape. */
function optional(row: SoccerModuleRow, column: string): string | undefined {
    const value = text(row, column).trim()
    return value === '' ? undefined : value
}

export function adaptGameForms(): TestLibraryV0Archetype[] {
    return soccerModule.gameForms().map((row) => {
        const constraintFit: Record<string, string> = {}
        for (const slot of [1, 2, 3]) {
            const name = text(row, `constraint_fit_${slot}_name`).trim()
            if (name) constraintFit[name] = text(row, `constraint_fit_${slot}_value`).trim()
        }

        return {
            id: text(row, 'legacy_source_id'),
            game_form_id: text(row, 'game_form_id'),
            game_form_name: text(row, 'game_form_name'),
            objective: text(row, 'objective'),
            interaction_structure: text(row, 'interaction_structure'),
            directionality_type: text(row, 'directionality_type'),
            phase_of_play: text(row, 'phase_of_play_matching_text'),
            player_structure_logic: text(row, 'role_structure'),
            // The descriptive list, which the extractor put in the matching-text column; the
            // role-typed list lives in recommended_constraint_types.
            recommended_constraint_types: list(row, 'recommended_constraint_matching_text'),
            representative_design_notes: text(row, 'representative_requirements'),
            primaryAffordances: list(row, 'primary_affordance_ids'),
            secondaryAffordances: list(row, 'secondary_affordance_ids'),
            constraintFit_structural: constraintFit['structural'] ?? '',
            constraintFit_shaping: constraintFit['shaping'] ?? '',
            constraintFit_consequence: constraintFit['consequence'] ?? '',
            recommendedConstraintTypes: list(row, 'recommended_constraint_types'),
            logicUsageNote: text(row, 'notes'),
            coachVocabulary: list(row, 'coach_vocabulary'),
        } as TestLibraryV0Archetype
    })
}

export function adaptLenses(): TestLibraryV0AffordanceLens[] {
    return soccerModule.lenses().map(
        (row) =>
            ({
                id: text(row, 'lens_id'),
                title: text(row, 'lens_name'),
                description: text(row, 'lens_description'),
                type: 'affordance',
                affordanceTagGroup: text(row, 'primary_affordance_matching_text'),
                notes: text(row, 'notes'),
                contextualAudit: text(row, 'known_limitations'),
                category: text(row, 'selection_category_key'),
                gameTemplateAnchor: list(row, 'phase_of_play_matching_text').map((v) => v.replace(/ /g, '_')),
                designIntent: text(row, 'design_intent'),
                constraintSupport: list(row, 'recommended_constraint_types'),
                coachVocabulary: list(row, 'coach_vocabulary'),
            }) as TestLibraryV0AffordanceLens
    )
}

/** Realizations split back into the two libraries they came from, by declared concept type. */
function adaptRealizations(conceptType: string): TestLibraryV0Constraint[] {
    return soccerModule
        .realizations()
        .filter((row) => text(row, 'universal_concept_type') === conceptType)
        .map(
            (row) =>
                ({
                    id: text(row, 'realization_id'),
                    title: text(row, 'realization_name'),
                    description: text(row, 'description'),
                    type: 'constraint',
                    affordanceTagGroup: text(row, 'affordance_tag_group'),
                    notes: text(row, 'notes'),
                    contextualAudit: text(row, 'contraindications'),
                    suggestedConstraintPrompt: text(row, 'suggested_constraint_prompt'),
                    category: text(row, 'selection_category_key'),
                    designIntent: text(row, 'design_intent'),
                    constraintArchetype: text(row, 'constraint_archetype'),
                    constraintRole: text(row, 'constraint_role'),
                    primaryConstraintType: text(row, 'primary_constraint_type'),
                    targetAffordancePrimary: text(row, 'primary_target_affordance_ids'),
                    gameTemplateAnchor: list(row, 'game_template_anchor'),
                    setupGuidance: optional(row, 'setup_guidance') ? list(row, 'setup_guidance') : undefined,
                    coachVocabulary: list(row, 'coach_vocabulary'),
                }) as TestLibraryV0Constraint
        )
}

export const adaptInteractionRegulations = () => adaptRealizations('INTERACTION_REGULATION')
export const adaptEnvironmentalManipulations = () => adaptRealizations('ENVIRONMENTAL_MANIPULATION')
