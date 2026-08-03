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
import { reportUnmappedUniversalIds, soccerModule, validateSoccerModuleIntegrity } from './soccer-module'

function testIntegrityGate(): void {
    const result = validateSoccerModuleIntegrity()
    assert.ok(result.valid, `Soccer module failed integrity: ${result.errors.slice(0, 6).join(' | ')}`)
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
    testModuleIdentity()
    testAllGameFormsExtracted()
    testMatchingCorpusPopulated()
    testScoringBonusInputsPopulated()
    testCoachVocabularyRoundTrips()
    testUnmappedUniversalIdsAreReported()
    console.log('soccer-module unit tests: all cases passed.')
}

runAll()
