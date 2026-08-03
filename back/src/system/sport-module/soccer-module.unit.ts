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
const GAME_FORMS_WITHOUT_COACH_VOCABULARY = ['GF10'] as const

/**
 * These 19 realization source objects currently have no `coachVocabulary`. The extraction must
 * preserve that known source gap exactly: these rows may be empty, and no additional realization may
 * lose vocabulary without failing the test.
 */
const REALIZATIONS_WITHOUT_COACH_VOCABULARY = [
    'tl-v0-constraint-progression-bonus',
    'tl-v0-constraint-wide-utilization-bonus',
    'tl-v0-constraint-switch-of-play-bonus',
    'tl-v0-constraint-interception-reward',
    'tl-v0-constraint-turnover-reward',
    'tl-v0-constraint-delay-reward',
    'tl-v0-constraint-final-third-value',
    'tl-v0-constraint-transition-bonus',
    'tl-v0-constraint-recovery-window',
    'tl-v0-constraint-counter-press-window',
    'tl-v0-constraint-pass-combination-gate',
    'tl-v0-constraint-support-lane-requirement',
    'tl-v0-constraint-central-density-condition',
    'tl-v0-constraint-wide-zone-advantage',
    'tl-v0-constraint-transition-trigger',
    'tl-v0-constraint-zone-structure-condition',
    'tl-v0-constraint-neutral-player-condition',
    'tl-v0-constraint-goalkeeper-included-condition',
    'tl-v0-constraint-small-area-condition',
] as const

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
        assert.deepEqual(
            extracted,
            [...(archetype.coachVocabulary ?? [])],
            `${archetype.game_form_id} coach vocabulary did not round-trip intact.`
        )
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
        assert.deepEqual(extracted, [...(source.coachVocabulary ?? [])], `${source.id} coach vocabulary did not round-trip intact.`)
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
    const total = soccerModule.gameForms().length
    assert.equal(
        unmapped['game_forms.canonical_game_archetype_id'],
        total,
        'Game forms have never been bridged to the canonical Game Archetype Library — update this when they are.'
    )
    assert.equal(
        unmapped['game_forms.primary_game_problem_ids'],
        total,
        'Game forms carry no GP-IDs — routing goes through signal groups. Update this when re-keyed.'
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
    console.log('soccer-module unit tests: all cases passed.')
}

runAll()
