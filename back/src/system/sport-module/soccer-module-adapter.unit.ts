/**
 * Unit tests — Soccer Module → engine object equivalence.
 *
 * THE QUESTION THIS ANSWERS: can the module drive selection without changing behaviour?
 *
 * The module was extracted from the very arrays it would replace, so a faithful adapter must
 * reconstruct objects that match the originals on every field the engine reads. Proving that at the
 * object level is stronger than comparing pipeline scores — if the inputs are identical the scores
 * cannot differ — and it localises any defect to a named field instead of a moved number.
 *
 * Fields are compared SELECTIVELY and deliberately: only those the selector or assembly actually
 * read. Comparing whole objects would fail on cosmetic differences (a `type` discriminator, a note
 * joined with an em-dash) that no code consults, and would bury the differences that matter.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { TEST_LIBRARY_V0_AFFORDANCE_LENSES } from '../test-library/affordanceLenses'
import { TEST_LIBRARY_V0_ARCHETYPES } from '../test-library/archetypes'
import { TEST_LIBRARY_V0_CONSTRAINTS } from '../test-library/constraints'
import { TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS } from '../test-library/environmental-manipulations'
import {
    adaptEnvironmentalManipulations,
    adaptGameForms,
    adaptInteractionRegulations,
    adaptLenses,
} from './soccer-module-adapter'

/** Compare one field, reporting the object and field name rather than just a value mismatch. */
function assertField(id: string, field: string, actual: unknown, expected: unknown): void {
    assert.deepEqual(actual, expected, `${id}.${field} did not survive the module round trip.`)
}

/**
 * Game-form fields the engine reads. `objective`, `interaction_structure`, `phase_of_play`,
 * `representative_design_notes`, `logicUsageNote` and `coachVocabulary` form the matching corpus;
 * the rest feed scoring bonuses.
 */
function testGameFormsRoundTrip(): void {
    const adapted = adaptGameForms()
    assert.equal(adapted.length, TEST_LIBRARY_V0_ARCHETYPES.length, 'Game form count differs after adaptation.')

    for (const source of TEST_LIBRARY_V0_ARCHETYPES) {
        const actual = adapted.find((a) => a.game_form_id === source.game_form_id)
        assert.ok(actual, `Game form ${source.game_form_id} missing after adaptation.`)
        const id = source.game_form_id

        assertField(id, 'id', actual.id, source.id)
        assertField(id, 'game_form_name', actual.game_form_name, source.game_form_name)
        assertField(id, 'objective', actual.objective, source.objective)
        assertField(id, 'interaction_structure', actual.interaction_structure, source.interaction_structure)
        assertField(id, 'directionality_type', actual.directionality_type, source.directionality_type)
        assertField(id, 'phase_of_play', actual.phase_of_play, source.phase_of_play)
        assertField(id, 'player_structure_logic', actual.player_structure_logic, source.player_structure_logic)
        assertField(id, 'representative_design_notes', actual.representative_design_notes, source.representative_design_notes)
        assertField(id, 'logicUsageNote', actual.logicUsageNote, source.logicUsageNote)
        // Authored in the workbook — compared for presence, not equality. See soccer-module.unit.ts.
        assert.ok((actual.coachVocabulary ?? []).length > 0, `${id} has no coach vocabulary after adaptation.`)
        // Scoring-bonus inputs.
        assertField(id, 'primaryAffordances', actual.primaryAffordances ?? [], source.primaryAffordances ?? [])
        assertField(id, 'secondaryAffordances', actual.secondaryAffordances ?? [], source.secondaryAffordances ?? [])
        assertField(id, 'recommendedConstraintTypes', actual.recommendedConstraintTypes ?? [], source.recommendedConstraintTypes ?? [])
        assertField(id, 'recommended_constraint_types', actual.recommended_constraint_types ?? [], source.recommended_constraint_types ?? [])
        assertField(id, 'constraintFit_structural', actual.constraintFit_structural, source.constraintFit_structural)
        assertField(id, 'constraintFit_shaping', actual.constraintFit_shaping, source.constraintFit_shaping)
        assertField(id, 'constraintFit_consequence', actual.constraintFit_consequence, source.constraintFit_consequence)
    }
}

/** Lens fields the selector reads. `category` is the join key behind the largest bonus. */
function testLensesRoundTrip(): void {
    const adapted = adaptLenses()
    assert.equal(adapted.length, TEST_LIBRARY_V0_AFFORDANCE_LENSES.length, 'Lens count differs after adaptation.')

    for (const source of TEST_LIBRARY_V0_AFFORDANCE_LENSES) {
        const actual = adapted.find((a) => a.id === source.id)
        assert.ok(actual, `Lens ${source.id} missing after adaptation.`)
        const id = source.id

        assertField(id, 'title', actual.title, source.title)
        assertField(id, 'description', actual.description, source.description)
        assertField(id, 'category', actual.category, source.category)
        assertField(id, 'designIntent', actual.designIntent, source.designIntent)
        assertField(id, 'notes', actual.notes, source.notes)
        assertField(id, 'coachVocabulary', actual.coachVocabulary ?? [], source.coachVocabulary ?? [])
        assertField(id, 'affordanceTagGroup', actual.affordanceTagGroup, source.affordanceTagGroup)
        assertField(id, 'contextualAudit', actual.contextualAudit, source.contextualAudit)
        assertField(id, 'gameTemplateAnchor', actual.gameTemplateAnchor ?? [], source.gameTemplateAnchor ?? [])
        assertField(id, 'constraintSupport', actual.constraintSupport ?? [], source.constraintSupport ?? [])
        // The four that previously had no column. suggestedConstraintPrompt is read six times during
        // assembly, so losing it was the concrete blocker to seeding the registry.
        assertField(id, 'visibilityTriggers', actual.visibilityTriggers ?? [], source.visibilityTriggers ?? [])
        assertField(id, 'exampleConsequencePatterns', actual.exampleConsequencePatterns ?? [], source.exampleConsequencePatterns ?? [])
        assertField(id, 'suggestedConstraintPrompt', actual.suggestedConstraintPrompt, source.suggestedConstraintPrompt)
        assertField(id, 'logicUsageNote', actual.logicUsageNote, source.logicUsageNote)
    }
}

/** Realization fields the selector and assembly read, split back into their two libraries. */
function testRealizationsRoundTrip(): void {
    const cases: Array<[string, typeof TEST_LIBRARY_V0_CONSTRAINTS, ReturnType<typeof adaptInteractionRegulations>]> = [
        ['interaction regulations', TEST_LIBRARY_V0_CONSTRAINTS, adaptInteractionRegulations()],
        ['environmental manipulations', TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS, adaptEnvironmentalManipulations()],
    ]

    for (const [label, sources, adapted] of cases) {
        assert.equal(adapted.length, sources.length, `${label}: count differs after adaptation.`)
        for (const source of sources) {
            const actual = adapted.find((a) => a.id === source.id)
            assert.ok(actual, `${label}: ${source.id} missing after adaptation.`)
            const id = source.id

            assertField(id, 'title', actual.title, source.title)
            assertField(id, 'description', actual.description, source.description)
            assertField(id, 'category', actual.category, source.category)
            assertField(id, 'designIntent', actual.designIntent, source.designIntent)
            assertField(id, 'notes', actual.notes, source.notes)
            assertField(id, 'targetAffordancePrimary', actual.targetAffordancePrimary, source.targetAffordancePrimary)
            assertField(id, 'constraintRole', actual.constraintRole, source.constraintRole)
            assertField(id, 'primaryConstraintType', actual.primaryConstraintType, source.primaryConstraintType)
            assertField(id, 'constraintArchetype', actual.constraintArchetype, source.constraintArchetype)
            assert.ok((actual.coachVocabulary ?? []).length > 0, `${id} has no coach vocabulary after adaptation.`)
            assertField(id, 'affordanceTagGroup', actual.affordanceTagGroup, source.affordanceTagGroup)
            assertField(id, 'gameTemplateAnchor', actual.gameTemplateAnchor ?? [], source.gameTemplateAnchor ?? [])
            assertField(id, 'suggestedConstraintPrompt', actual.suggestedConstraintPrompt, source.suggestedConstraintPrompt)
            assertField(id, 'contextualAudit', actual.contextualAudit, source.contextualAudit)
        }
    }
}

function runAll(): void {
    testGameFormsRoundTrip()
    testLensesRoundTrip()
    testRealizationsRoundTrip()
    console.log('soccer-module-adapter unit tests: all cases passed.')
}

runAll()
