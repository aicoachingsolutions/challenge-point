/**
 * Unit tests — Soccer Sport Module RC1 v3 loading.
 *
 * Pins the things that would make extraction silently wrong: the integrity gate passes against the
 * workbook's own declared counts; all eleven game forms survived with their identifiers intact; and
 * critically, the fields that feed the selector's matching corpus and its scoring bonuses actually
 * carry data. An extraction that loads cleanly but dropped `coach_vocabulary` would pass a naive
 * test and quietly destroy matching, which is precisely the failure this module exists to avoid.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { TEST_LIBRARY_V0_AFFORDANCE_LENSES } from '../test-library/affordanceLenses'
import { TEST_LIBRARY_V0_ARCHETYPES } from '../test-library/archetypes'
import { TEST_LIBRARY_V0_CONSTRAINTS } from '../test-library/constraints'
import { TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS } from '../test-library/environmental-manipulations'
import type { TestLibraryV0Constraint } from '../test-library/types'
import {
    reportUnmappedUniversalIds,
    soccerModule,
    validateModuleMetadataShape,
    validateSoccerModuleIntegrity,
} from './soccer-module'

const ALL_REALIZATION_SOURCES: Array<{ source: TestLibraryV0Constraint; universalConceptType: string }> = [
    ...TEST_LIBRARY_V0_CONSTRAINTS.map((source) => ({ source, universalConceptType: 'INTERACTION_REGULATION' })),
    ...TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS.map((source) => ({
        source,
        universalConceptType: 'ENVIRONMENTAL_MANIPULATION',
    })),
]

function testIntegrityGate(): void {
    const result = validateSoccerModuleIntegrity()
    assert.ok(result.valid, `Soccer module failed integrity: ${result.errors.slice(0, 6).join(' | ')}`)
}

/**
 * Round-trip guard. The workbook is edited on shared Drive, so it can come back converted — and the
 * damaging conversions do NOT error, they make sheets read empty, which looks identical to "not yet
 * populated". These cases prove the guard catches each one and says so, rather than only proving it
 * passes on a healthy file.
 */
function testMetadataShapeCatchesRoundTripDamage(): void {
    const healthy = JSON.parse(JSON.stringify({ metadata: soccerModule.metadata })) as {
        metadata: Record<string, unknown>
    }
    const withMetadata = (overrides: Record<string, unknown>) =>
        ({
            metadata: { ...healthy.metadata, ...overrides },
            vocabulary: [],
            lenses: [],
            game_forms: [],
            realizations: [],
            coverage: [],
        }) as never

    assert.deepEqual(validateModuleMetadataShape(withMetadata({})), [], 'A healthy workbook must produce no shape errors.')

    // A renamed sheet — the projection would read nothing and the module would look merely unpopulated.
    const renamed = validateModuleMetadataShape(withMetadata({ game_forms_sheet_name: 'GameForms' }))
    assert.ok(
        renamed.some((e) => e.includes('game_forms_sheet_name') && e.toLowerCase().includes('convert')),
        `A renamed sheet must be reported as probable conversion damage. Got: ${renamed.join(' | ')}`
    )

    // A lost header-row key — the projection silently defaults to row 2.
    const lostHeader = validateModuleMetadataShape(withMetadata({ realizations_header_row: null }))
    assert.ok(
        lostHeader.some((e) => e.includes('realizations_header_row')),
        `A missing header row must be named. Got: ${lostHeader.join(' | ')}`
    )

    // A header row that came back as text rather than a number.
    const textHeader = validateModuleMetadataShape(withMetadata({ lenses_header_row: 'two' }))
    assert.ok(
        textHeader.some((e) => e.includes('lenses_header_row')),
        `A non-numeric header row must be named. Got: ${textHeader.join(' | ')}`
    )

    // Lost version pins — the module would load with no way to establish provenance.
    const noVersion = validateModuleMetadataShape(withMetadata({ runtime_interface_version: '' }))
    assert.ok(
        noVersion.some((e) => e.includes('runtime_interface_version')),
        `A missing version pin must be reported. Got: ${noVersion.join(' | ')}`
    )
}

/** Every lens in the live library must have survived extraction, by id. */
function testAllLensesExtracted(): void {
    const extracted = soccerModule.lenses()
    assert.equal(
        extracted.length,
        TEST_LIBRARY_V0_AFFORDANCE_LENSES.length,
        'Lens count differs from the live library.'
    )
    for (const lens of TEST_LIBRARY_V0_AFFORDANCE_LENSES) {
        const row = extracted.find((r) => String(r['lens_id']) === lens.id)
        assert.ok(row, `Lens ${lens.id} is missing from the module.`)
        assert.equal(row['lens_name'], lens.title, `${lens.id} name differs.`)
        assert.equal(row['legacy_source_id'], lens.id, `${lens.id} lost its legacy identifier.`)
    }
}

/**
 * Lenses are the primary surface a coach's goal is matched against, and `selection_category_key` is
 * the join key behind the largest scoring bonus — a lens row that loads with either empty would
 * degrade matching while passing a naive presence check.
 */
function testLensMatchingCorpusPopulated(): void {
    for (const row of soccerModule.lenses()) {
        const id = String(row['lens_id'])
        for (const column of ['lens_name', 'lens_description', 'selection_category_key', 'design_intent', 'coach_vocabulary']) {
            const value = row[column]
            assert.ok(
                value !== null && value !== undefined && String(value).trim() !== '',
                `${id}.${column} is empty — the lens matching corpus would be degraded.`
            )
        }
    }
}

function testLensCoachVocabularyRoundTrips(): void {
    for (const lens of TEST_LIBRARY_V0_AFFORDANCE_LENSES) {
        const row = soccerModule.lenses().find((r) => String(r['lens_id']) === lens.id)
        const extracted = String(row?.['coach_vocabulary'] ?? '')
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        assert.deepEqual(extracted, [...(lens.coachVocabulary ?? [])], `${lens.id} coach vocabulary did not round-trip.`)
    }
}

/**
 * CLOSED 2026-08-05. The four lens properties that had no column — visibilityTriggers,
 * exampleConsequencePatterns, suggestedConstraintPrompt and logicUsageNote — now have one, and the
 * adapter reconstructs all four. This asserts they stay populated: losing suggestedConstraintPrompt
 * in particular would silently blank an input read six times during assembly.
 */
function testPreviouslyHomelessLensFieldsArePopulated(): void {
    for (const row of soccerModule.lenses()) {
        const id = String(row['lens_id'])
        for (const column of ['visibility_triggers', 'consequence_patterns', 'suggested_constraint_prompt', 'logic_usage_note']) {
            assert.ok(
                String(row[column] ?? '').trim() !== '',
                `${id}.${column} is empty — this field was homed on 2026-08-05 and must not regress.`
            )
        }
    }
}

function testModuleIdentity(): void {
    assert.equal(soccerModule.moduleId, 'sport.soccer')
    assert.equal(soccerModule.runtimeInterfaceVersion, 'RC1.2', 'Module must declare the runtime interface it targets.')
}

/** Every game form in the live library must have survived extraction, by id. */
function testAllGameFormsExtracted(): void {
    const extracted = soccerModule.gameForms()
    assert.equal(extracted.length, TEST_LIBRARY_V0_ARCHETYPES.length, 'Game form count differs from the live library.')

    for (const archetype of TEST_LIBRARY_V0_ARCHETYPES) {
        const row = soccerModule.gameForm(archetype.game_form_id)
        assert.ok(row, `Game form ${archetype.game_form_id} is missing from the module.`)
        assert.equal(row['game_form_name'], archetype.game_form_name, `${archetype.game_form_id} name differs.`)
        assert.equal(row['legacy_source_id'], archetype.id, `${archetype.game_form_id} lost its legacy identifier.`)
    }
}

/**
 * GF10 "Constraint-Driven Free Play" carries no `coachVocabulary` in the live library — 10 of 11
 * game forms have one, GF10 does not. That is a PRE-EXISTING gap the extraction surfaced, not
 * something extraction lost, so it is pinned here as a known exception rather than softened into
 * "some rows may be empty". If a second game form ever loses its vocabulary, this test fails.
 *
 * Practical consequence worth knowing: GF10 can only be matched through its name, objective and
 * structural prose, so natural coach phrasing reaches it far less readily than the other ten.
 */
// CLOSED 2026-08-04: Christian authored vocabulary for GF10, so every game form now has one.
// Kept as an empty list rather than deleted — if a future extraction drops a vocabulary, the
// assertion below still fires.
const GAME_FORMS_WITHOUT_COACH_VOCABULARY: readonly string[] = []

/**
 * These 19 realization source objects currently have no `coachVocabulary`. The extraction must
 * preserve that known source gap exactly: these rows may be empty, and no additional realization may
 * lose vocabulary without failing the test.
 */
// CLOSED 2026-08-04: Christian authored vocabulary for all 19 that lacked it. Same reasoning as
// the game-form list above — emptied, not deleted.
const REALIZATIONS_WITHOUT_COACH_VOCABULARY: readonly string[] = []

/**
 * The selector scores game forms against a text corpus. If these columns are empty the module loads
 * fine and matching collapses — so they are asserted non-empty rather than merely present.
 */
function testMatchingCorpusPopulated(): void {
    const required = ['objective', 'interaction_structure', 'phase_of_play_matching_text', 'representative_requirements']
    for (const row of soccerModule.gameForms()) {
        const id = String(row['game_form_id'])
        for (const column of required) {
            const value = row[column]
            assert.ok(
                value !== null && value !== undefined && String(value).trim() !== '',
                `${id}.${column} is empty — the matching corpus would be degraded.`
            )
        }

        const hasVocabulary = String(row['coach_vocabulary'] ?? '').trim() !== ''
        const knownEmpty = (GAME_FORMS_WITHOUT_COACH_VOCABULARY as readonly string[]).includes(id)
        assert.equal(
            hasVocabulary,
            !knownEmpty,
            knownEmpty
                ? `${id} now HAS coach vocabulary — remove it from GAME_FORMS_WITHOUT_COACH_VOCABULARY.`
                : `${id}.coach_vocabulary is empty — the matching corpus would be degraded.`
        )
    }
}

/** The four scoring-bonus inputs must carry data, not just exist as columns. */
function testScoringBonusInputsPopulated(): void {
    for (const row of soccerModule.gameForms()) {
        const id = row['game_form_id']
        assert.ok(String(row['primary_affordance_ids'] ?? '').trim(), `${id} lost primary affordances (+6 bonus).`)
        assert.ok(String(row['recommended_constraint_types'] ?? '').trim(), `${id} lost recommended constraint types (+3).`)
        for (const slot of [1, 2, 3]) {
            assert.ok(
                String(row[`constraint_fit_${slot}_name`] ?? '').trim(),
                `${id} lost constraint_fit_${slot}_name (balance buckets).`
            )
            assert.ok(
                String(row[`constraint_fit_${slot}_value`] ?? '').trim(),
                `${id} lost constraint_fit_${slot}_value (balance buckets).`
            )
        }
    }
}

/** Coach vocabulary must survive as a list, not be flattened into one token. */
function testCoachVocabularyRoundTrips(): void {
    for (const archetype of TEST_LIBRARY_V0_ARCHETYPES) {
        const row = soccerModule.gameForm(archetype.game_form_id)
        const extracted = String(row?.['coach_vocabulary'] ?? '')
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        // The workbook is now the AUTHORITY for this sheet, not a copy of the code. Christian
        // authors vocabulary here — adding terms the code never had, and deliberately removing
        // terms it did. Asserting equality (or even containment) against the source would fail on
        // his editorial judgement, which is not a defect. So we assert only that vocabulary
        // survives at all; the structural checks above still prove nothing was lost by extraction.
        //
        // These source comparisons retire entirely once the in-code arrays are deleted in the
        // final slice. Until then they guard the extraction, not the content.
        assert.ok(extracted.length > 0, `${archetype.game_form_id} has no coach vocabulary in the module.`)
    }
}

/** Every realization in the live libraries must have survived extraction, by id. */
function testAllRealizationsExtracted(): void {
    const extracted = soccerModule.realizations()
    assert.equal(extracted.length, ALL_REALIZATION_SOURCES.length, 'Realization count differs from the live libraries.')

    for (const { source, universalConceptType } of ALL_REALIZATION_SOURCES) {
        const row = soccerModule.realization(source.id)
        assert.ok(row, `Realization ${source.id} is missing from the module.`)
        assert.equal(row['realization_name'], source.title, `${source.id} name differs.`)
        assert.equal(row['legacy_source_id'], source.id, `${source.id} lost its legacy identifier.`)
        assert.equal(row['universal_concept_type'], universalConceptType, `${source.id} lost its source-library type.`)
    }
}

/**
 * The selector's realization matching corpus must be non-empty. `coach_vocabulary` has pinned known
 * source gaps, while description and category are required for every row.
 */
function testRealizationMatchingCorpusPopulated(): void {
    for (const row of soccerModule.realizations()) {
        const id = String(row['realization_id'])
        for (const column of ['description', 'selection_category_key']) {
            const value = row[column]
            assert.ok(
                value !== null && value !== undefined && String(value).trim() !== '',
                `${id}.${column} is empty - the realization matching corpus would be degraded.`
            )
        }

        const hasVocabulary = String(row['coach_vocabulary'] ?? '').trim() !== ''
        const knownEmpty = (REALIZATIONS_WITHOUT_COACH_VOCABULARY as readonly string[]).includes(id)
        assert.equal(
            hasVocabulary,
            !knownEmpty,
            knownEmpty
                ? `${id} now HAS coach vocabulary - remove it from REALIZATIONS_WITHOUT_COACH_VOCABULARY.`
                : `${id}.coach_vocabulary is empty - the realization matching corpus would be degraded.`
        )
    }
}

/** The realization scoring inputs must carry data, not just exist as columns. */
function testRealizationScoringInputsPopulated(): void {
    for (const row of soccerModule.realizations()) {
        const id = row['realization_id']
        for (const column of [
            'constraint_role',
            'primary_constraint_type',
            'constraint_archetype',
            'primary_target_affordance_ids',
        ]) {
            assert.ok(
                String(row[column] ?? '').trim(),
                `${id}.${column} is empty - realization scoring inputs would be degraded.`
            )
        }
    }
}

/** Realization coach vocabulary must survive as a list, including known empty lists. */
function testRealizationCoachVocabularyRoundTrips(): void {
    for (const { source } of ALL_REALIZATION_SOURCES) {
        const row = soccerModule.realization(source.id)
        const extracted = String(row?.['coach_vocabulary'] ?? '')
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        // Authored sheet — see the game-form equivalent above.
        assert.ok(extracted.length > 0, `${source.id} has no coach vocabulary in the module.`)
    }
}

/**
 * `environmentalRealizations` is an array of alternative text spines, while `realization_bank_id` is
 * a single ID. This pins the deliberate empty representation so the unplaced data stays visible.
 */
function testEnvironmentalRealizationsAreNotForcedIntoBankId(): void {
    const withEnvironmentalRealizations = ALL_REALIZATION_SOURCES.filter(
        ({ source }) => (source.environmentalRealizations ?? []).length > 0
    )
    assert.deepEqual(
        withEnvironmentalRealizations.map(({ source }) => source.id),
        [
            'tl-v0-constraint-variable-target-condition',
            'tl-v0-constraint-multi-goal-read',
            'tl-v0-constraint-blind-side-entry',
            'tl-v0-constraint-disguised-restart',
        ]
    )

    for (const { source } of withEnvironmentalRealizations) {
        const row = soccerModule.realization(source.id)
        assert.equal(row?.['realization_bank_id'] ?? null, null, `${source.id}.realization_bank_id should remain empty.`)
    }
}

/**
 * The two unmapped universal identifiers are a KNOWN, REPORTED state — not a silent hole. This test
 * documents them so that when the mapping is supplied, the count changing forces the test to be
 * updated deliberately rather than the gap being forgotten.
 */
function testUnmappedUniversalIdsAreReported(): void {
    const unmapped = reportUnmappedUniversalIds()
    // CLOSED 2026-08-04. Christian supplied GA-001 for all eleven game forms and the Game Problem
    // mappings, so both gaps are now zero. Asserting zero rather than deleting the test means a
    // future extraction that drops these identifiers fails loudly instead of quietly regressing.
    assert.equal(
        unmapped['game_forms.canonical_game_archetype_id'],
        0,
        'Game forms lost their canonical archetype identifier — this was populated and must not regress.'
    )
    assert.equal(
        unmapped['game_forms.primary_game_problem_ids'],
        0,
        'Game forms lost their Game Problem identifiers — these were populated and must not regress.'
    )
}


function runAll(): void {
    testIntegrityGate()
    testMetadataShapeCatchesRoundTripDamage()
    testModuleIdentity()
    testAllGameFormsExtracted()
    testMatchingCorpusPopulated()
    testScoringBonusInputsPopulated()
    testCoachVocabularyRoundTrips()
    testAllRealizationsExtracted()
    testRealizationMatchingCorpusPopulated()
    testRealizationScoringInputsPopulated()
    testRealizationCoachVocabularyRoundTrips()
    testEnvironmentalRealizationsAreNotForcedIntoBankId()
    testUnmappedUniversalIdsAreReported()
    testAllLensesExtracted()
    testLensMatchingCorpusPopulated()
    testLensCoachVocabularyRoundTrips()
    testPreviouslyHomelessLensFieldsArePopulated()
    console.log('soccer-module unit tests: all cases passed.')
}

runAll()
