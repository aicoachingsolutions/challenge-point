/**
 * Unit tests — ruling 10 (affordance vocabulary) survives a regeneration of the Soccer Module.
 *
 * `0a3170e` (29 September 2026) applied his ruling 10 in the module JSON and its two projections only. The workbook
 * `back/data/sport-modules/soccer/soccer-module.rc1-v3.xlsx` still holds the earlier values in three cells, so running
 * `project-workbook.py` on it would silently put them back:
 *
 *   Lenses E4      tl-v0-lens-space-exploitation-opportunity  selection_category_key  "Create Space"
 *   Game Forms I6  GF4                                        primary_affordance_ids  "exploit_space; fast_attack; regain"
 *   Game Forms I10 GF8                                        primary_affordance_ids  "exploit_space; fast_attack; regain"
 *
 * The adapter round-trip test would also fail on that, but only while the projections keep the new values, and the
 * obvious way to make it pass again is to regenerate them too. This pins the values themselves. Until the workbook is
 * updated the JSON is authoritative for these three cells: docs/GAME_FORM_LIBRARY_PROVENANCE.md, "The workbook and
 * the module JSON".
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { TEST_LIBRARY_V0_AFFORDANCE_LENSES } from '../test-library/affordanceLenses'
import { TEST_LIBRARY_V0_ARCHETYPES } from '../test-library/archetypes'
import { soccerModule } from './soccer-module'

const SPACE_EXPLOITATION_LENS = 'tl-v0-lens-space-exploitation-opportunity'
const RULING_10_CATEGORY = 'Exploit Space'
const RULING_10_AFFORDANCES = ['exploit_space', 'attack_quickly', 'regain_possession']
const RULING_10_GAME_FORMS = ['GF4', 'GF8']
const PROVENANCE = 'see docs/GAME_FORM_LIBRARY_PROVENANCE.md, "The workbook and the module JSON"'

const splitIds = (value: unknown): string[] =>
    String(value ?? '')
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)

function testLensCategoryInModule(): void {
    const row = soccerModule.lenses().find((r) => String(r['lens_id']) === SPACE_EXPLOITATION_LENS)
    assert.ok(row, `Lens ${SPACE_EXPLOITATION_LENS} is missing from the module.`)
    assert.equal(
        row['selection_category_key'],
        RULING_10_CATEGORY,
        `Lenses E4 (${SPACE_EXPLOITATION_LENS}.selection_category_key) has lost ruling 10; the workbook still holds "Create Space" (${PROVENANCE}).`
    )
}

function testGameFormAffordancesInModule(): void {
    for (const id of RULING_10_GAME_FORMS) {
        const row = soccerModule.gameForm(id)
        assert.ok(row, `Game form ${id} is missing from the module.`)
        assert.deepEqual(
            splitIds(row['primary_affordance_ids']),
            RULING_10_AFFORDANCES,
            `${id}.primary_affordance_ids has lost ruling 10; the workbook still holds "exploit_space; fast_attack; regain" (${PROVENANCE}).`
        )
    }
}

/** The retired spellings must not come back on any game form, through either affordance column. */
function testRetiredAffordanceIdsAbsent(): void {
    for (const row of soccerModule.gameForms()) {
        const id = String(row['game_form_id'])
        for (const column of ['primary_affordance_ids', 'secondary_affordance_ids']) {
            for (const retired of ['fast_attack', 'regain']) {
                assert.ok(!splitIds(row[column]).includes(retired), `${id}.${column} carries "${retired}", retired by ruling 10 (${PROVENANCE}).`)
            }
        }
    }
}

function testProjectionsAgree(): void {
    const lens = TEST_LIBRARY_V0_AFFORDANCE_LENSES.find((l) => l.id === SPACE_EXPLOITATION_LENS)
    assert.ok(lens, `affordanceLenses.ts has no ${SPACE_EXPLOITATION_LENS}.`)
    assert.equal(lens.category, RULING_10_CATEGORY, `affordanceLenses.ts ${SPACE_EXPLOITATION_LENS}.category has lost ruling 10 (${PROVENANCE}).`)

    for (const id of RULING_10_GAME_FORMS) {
        const archetype = TEST_LIBRARY_V0_ARCHETYPES.find((a) => a.game_form_id === id)
        assert.ok(archetype, `archetypes.ts has no ${id}.`)
        assert.deepEqual(
            [...(archetype.primaryAffordances ?? [])],
            RULING_10_AFFORDANCES,
            `archetypes.ts ${id}.primaryAffordances has lost ruling 10 (${PROVENANCE}).`
        )
    }
}

function runAll(): void {
    testLensCategoryInModule()
    testGameFormAffordancesInModule()
    testRetiredAffordanceIdsAbsent()
    testProjectionsAgree()
    console.log('soccer-module ruling 10 unit tests: all cases passed.')
}

runAll()
