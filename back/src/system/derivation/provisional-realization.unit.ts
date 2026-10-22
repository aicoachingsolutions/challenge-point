/**
 * The provisional carrier — stage K2, 15 October 2026. His reply filed 17 October 2026: *"The priority remains producing one
 * complete, representative Play Out from the Back activity through the normal generation pathway, without introducing
 * unnecessary architecture or treating this first realization as the canonical version of the Learning Goal."* His 16
 * October item 10: *"Please keep those categories distinct."*
 *
 * What is pinned here:
 *   1. one home: `provisional-realizations.json`, refused WHOLE at load on any item that is not his (OWNER_RULING, his words,
 *      the category), that collides with canonical knowledge or names a refused designation, and on ANY declaration — so a
 *      qualified non-claim cannot enter this way (the K1 review's open item);
 *   2. one route in: derivation receives a realization only where the selected goal's record names it (A01 names A01-R1);
 *      a demonstration never does; any other goal given the same record behaves alike (no goal literal);
 *   3. no canonical leak: neither contracts.json nor the restatements carry it;
 *   4. one consumer chain: an item's category reaches its support entry and the fixture whole, and the review page's
 *      provisional list reads it (TEST-ONLY items on copies — A01-R1 was empty at landing; since stage K3 it lists its
 *      three role-block items);
 *   5. the realization moves exactly what its items establish (since stage K3, the role lines) and no other line or
 *      check — only the provenance stamp names it besides;
 *   6. its realization choices replace the game form's only by declaration, every replacement recorded, everything else
 *      of the game form's input carried; an undeclared second answer refuses the input;
 *   7. A01 with the From Goal Kicks practice situation is refused with one sentence (a DRAFT), naming the realization.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/derivation/provisional-realization.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { suppliedRealizationFor } from '../realization/supplied-realization'
import { buildActivity, buildActivityFromKnowledge, buildActivityUnderAuthorizationRecords } from '../rendering/build-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { authorizationLists, learningGoalAuthorizations, validateLearningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { CONFORMANCE_DIR, loadProvisionalRealizations, PROVISIONAL_REALIZATION_CHOICE, PROVISIONAL_REALIZATIONS_FILE, provisionalRealizationNamed, readJson, validateProvisionalRealizations } from './corpus'
import { isStampedHalt } from './emit'
import { runDerivation } from './engine'
import { AUDITS_DIR } from './knowledge-root'
import { derivationInputFor, selectFor } from './run-bounded-selection'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('the provisional carrier (A01-R1)')

const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: Object.fromEntries(specializedRoleNames().map(name => [name, 0])) }
const file = (): any => readJson(PROVISIONAL_REALIZATIONS_FILE)
/** A TEST-ONLY item of his shape: re-asserts the role of the objective attacked by one end's team, which GF2 already carries. */
const testItem = (over: Record<string, unknown> = {}) => ({
    id: 'A01-R1-TEST-ONLY-1',
    row: 'J4',
    selector: 'role=PRIMARY_SCORING & team=TEAM_AT_AXIS_START',
    requirement: 'EQUALS',
    value: 'PRIMARY_SCORING',
    strictness: 'REQUIRED',
    valueStatus: 'REQUIRED_RANGE',
    scope: 'WHOLE_GAME',
    basis: 'OWNER_RULING',
    basisEvidence: { quote: 'TEST-ONLY', sourceId: 'TEST-ONLY' },
    checkability: 'STRUCTURAL',
    structuralClause: 'whole item',
    category: PROVISIONAL_REALIZATION_CHOICE,
    words: 'TEST-ONLY: words of his would stand here',
    citedAs: 'TEST-ONLY',
    choice: 'TEST-ONLY: a provisional choice',
    ...over,
})
const withItems = (...items: any[]): any => {
    const copy = file()
    copy.realizations[0].items.push(...items)
    return copy
}
/** The records with every gap entry set aside on a COPY, as activity-review.unit.ts does: A01 then reaches derivation. */
const recordsBehindGaps = () =>
    learningGoalAuthorizations().map((record: any) => ({
        ...record,
        manipulations: record.manipulations.map((m: any) => (m.status === 'MISSING_KNOWLEDGE' || m.status === 'MISSING_CAPABILITY' ? { ...m, category: 'EXISTING_KNOWLEDGE_TO_VERIFY', status: 'NOT_SELECTED_FOR_FIRST_DEMO', gaps: [], note: 'TEST-ONLY' } : m)),
        provisionalChoices: (record.provisionalChoices ?? []).map((c: any) => (c.status === 'MISSING_KNOWLEDGE' || c.status === 'MISSING_CAPABILITY' ? { ...c, status: 'AUTHORIZED_BY_RULING', gaps: [], note: 'TEST-ONLY' } : c)),
    }))

test('one home: the file loads, A01-R1 is labelled his provisional choice, and only A01\'s record names it', () => {
    const [realization, ...others] = loadProvisionalRealizations()
    assert.equal(others.length, 0)
    // Empty at landing (stage K2). 0 -> 3 items on 15 October 2026 (stage K3): his D2(a)/M1 role blocks — the two roles and
    // how they pass between the teams — pinned item by item in role-blocks.unit.ts. Still no declaration. 3 -> 10 on 15
    // October 2026 (stage K4): his D6 counts by role (P2 x2), the building role's keeper (P3) and his 18 October RD-1
    // answer as two reassignments with their counts (B4 x2, B7 x2) — pinned item by item in allocation.unit.ts. 10 -> 34 on 15
    // October 2026 (stage K5): his D1/D5/M3/M4 start, after-score and coach-conclusion transitions and his 18 October RD-2
    // ordinary restarts (24 items on rows T1-T7) — pinned in starts-and-restarts.unit.ts. 34 -> 47 on 15 October 2026 (stage K6):
    // his 18 October starting values and his D3/D4/M5 relationships - the pressure reference (S2, S5, S6), the two targets keyed by
    // role (S5 x3), the two starting placements (P8 x2, P10 x2) with their timing and episode (P10a, P10b), and the restart
    // location's D3 bound (T4) - pinned in target-placement.unit.ts. 47 -> 49 on 17 October 2026 (stage M1): his reply filed 19
    // October 2026, item 1 and item 3 C, as the credit bound on the two roles (B8 x2: the building role's BUILD_OUT_EPISODE, the
    // pressing role's WHOLE_GAME stated explicitly) - pinned in credit-episode.unit.ts. 49 -> 53 on 17 October 2026 (stage M2): his
    // reply filed 19 October 2026, item 2, as the occurrence that also counts as the primary event for the pressing role (V27, with
    // its trigger V29, control V30 and exclusion V31) - pinned in also-counts.unit.ts.
    assert.deepEqual([realization.provisionalId, realization.contractId, realization.category, realization.realizes, realization.items.length, realization.declarations.length], ['A01-R1', 'provisional:A01-R1', PROVISIONAL_REALIZATION_CHOICE, 'RPC-001', 53, 0])
    assert.equal(realization.realizationChoices, 'realization-choices-a01-r1.json')
    assert.ok(realization.words.includes('The priority remains producing one complete, representative Play Out from the Back activity through the normal generation pathway, without introducing unnecessary architecture or treating this first realization as the canonical version of the Learning Goal.'))
    const naming = learningGoalAuthorizations().filter(record => record.provisionalRealization).map(record => [record.learningGoalId, record.provisionalRealization])
    assert.deepEqual(naming, [['A01', 'A01-R1']])
    assert.ok(validateLearningGoalAuthorizations(learningGoalAuthorizations().map(r => (r.learningGoalId === 'A01' ? { ...r, provisionalRealization: 'A01-R9' } : r))).some(e => e.includes('A01-R9')), 'a record naming nothing is refused')
    assert.throws(() => provisionalRealizationNamed('A01-R9'), /does not hold/)
})

test('the loader refuses the WHOLE file on an item that is not his, a collision, a refused designation — and on ANY declaration', () => {
    const refusals = (copy: any): string[] => validateProvisionalRealizations(copy)
    assert.deepEqual(refusals(withItems(testItem())), [], 'his shape is admitted')
    const cases: [string, any, RegExp][] = [
        ['no words', withItems(testItem({ words: '' })), /does not quote him/],
        ['not his ruling', withItems(testItem({ basis: 'AUTHORED' })), /is not OWNER_RULING/],
        ['no category', withItems(testItem({ category: undefined })), /is not labelled PROVISIONAL_REALIZATION_CHOICE/],
        ['a canonical id', withItems(testItem({ id: 'RPC-001-18.a' })), /collides with a canonical item id/],
        ['an id outside its realization', withItems(testItem({ id: 'TEST-ONLY-1' })), /must begin A01-R1-/],
        ['a refused designation', withItems(testItem({ selector: 'role=PRIMARY_SCORING & team=DEFENDING_TEAM' })), /names DEFENDING_TEAM, which a provisional realization may not use/],
        ['a refused designation in a value', withItems(testItem({ row: 'T2', selector: 'trigger=START', value: 'CONCEDING_TEAM' })), /names CONCEDING_TEAM/],
        ['no basis evidence', withItems(testItem({ basisEvidence: undefined })), /carries no basis evidence/],
        // K2 review, 15 October 2026: two items under one id were admitted.
        ['one id twice', withItems(testItem(), testItem({ value: 'REPRESENTATIVE' })), /A01-R1-TEST-ONLY-1 is defined twice/],
    ]
    for (const [what, copy, expected] of cases) {
        assert.ok(refusals(copy).some(e => expected.test(e)), `${what}: ${JSON.stringify(refusals(copy))}`)
        assert.throws(() => loadProvisionalRealizations(copy), /failed its integrity gate/, what)
    }
    // A declaration of any kind — the qualified non-claim his M6 admits only with a proof of disjointness among them.
    for (const declaration of [
        { row: 'V6', selector: 'type=origin', scope: 'WHOLE_GAME', declaration: 'NON_CLAIMED', qualifier: 'NO_FURTHER_VALUE', note: 'TEST-ONLY' },
        { row: 'P8', selector: '*', scope: 'WHOLE_GAME', declaration: 'CLAIMED', note: 'TEST-ONLY' },
    ]) {
        const copy = file()
        copy.realizations[0].declarations.push(declaration)
        assert.ok(refusals(copy).some(e => e.includes('holds a declaration')), declaration.declaration)
    }
    const renamed = file()
    renamed.realizations[0].contractId = 'restated:A01-R1'
    assert.ok(refusals(renamed).some(e => e.includes('must be provisional:A01-R1')))
    const missing = file()
    missing.realizations[0].realizationChoices = 'realization-choices-nobody.json'
    assert.ok(refusals(missing).some(e => e.includes('do not exist')))
    const unregistered = file()
    unregistered.refusedDesignations.designations.push('THE_OTHER_LOT')
    assert.ok(refusals(unregistered).some(e => e.includes('THE_OTHER_LOT is not one the register defines')))
})

test('no canonical leak: neither contracts.json nor the restatements carry the realization or its file', () => {
    for (const name of ['stage-b/contracts.json', 'stage-b/corpus-restatements.json']) {
        const text = fs.readFileSync(path.join(CONFORMANCE_DIR, name), 'utf8')
        for (const needle of ['provisional:', 'A01-R1', 'realization-choices-a01-r1', PROVISIONAL_REALIZATION_CHOICE]) assert.ok(!text.includes(needle), `${name} carries ${needle}`)
    }
})

test('one route in: derivation receives the realization only where the selected goal\'s record names it — for any goal alike', () => {
    const a01 = derivationInputFor(selectFor('A01', null))
    assert.ok(a01.contracts.some(c => c.contractId === 'provisional:A01-R1'))
    assert.ok(a01.selection.some(s => s.objectId === 'provisional:A01-R1'), 'it enters the provenance stamp too')
    // A demonstration has no record, so never; and a selection whose record names nothing derives exactly as before.
    const demo = derivationInputFor({ selected: [{ id: 'GF2', role: 'game form' }, { id: 'tl-v0-constraint-wide-zone-advantage', role: 'constraint' }] })
    assert.ok(!demo.contracts.some(c => c.contractId.startsWith('provisional:')))
    const record = learningGoalAuthorizations().find(r => r.learningGoalId === 'A01')!
    const without = derivationInputFor({ selected: selectFor('A01', null).selected, authorization: { ...record, provisionalRealization: undefined } })
    assert.ok(!without.contracts.some(c => c.contractId.startsWith('provisional:')))
    // Symmetry: another goal's selection carrying a record that names A01-R1 receives it the same way.
    const other = derivationInputFor({ selected: [{ id: 'GF2', role: 'game form' }], authorization: { ...record, learningGoalId: 'A04' } })
    assert.ok(other.contracts.some(c => c.contractId === 'provisional:A01-R1'))
})

/**
 * **Re-pointed 15 October 2026 (stage K3): "an empty realization moves nothing" became "the realization moves exactly what
 * its items establish".** A01-R1 now carries the role blocks (three items), so naming it adds the two role elements' lines
 * and nothing else: every other line, every Gate A check and the stamp are as they were. The test was about the carrier
 * leaking nothing beyond its own items, and that is what it still pins.
 */
test('the realization moves exactly what its items establish — the role lines — and no other line, no check; the stamp names it', () => {
    const record = learningGoalAuthorizations().find(r => r.learningGoalId === 'A01')!
    const selected = selectFor('A01', null).selected
    const run = (authorization: any) => runDerivation(derivationInputFor({ selected, authorization })) as any
    const named = run(record)
    const unnamed = run({ ...record, provisionalRealization: undefined })
    assert.ok(!isStampedHalt(named) && !isStampedHalt(unnamed))
    const lines = (result: any) => result.resolution.map((e: any) => `${e.lineId}|${e.state}|${e.verdict ?? ''}|${e.reason ?? ''}|${JSON.stringify(e.value ?? null)}`)
    const own = (line: string) => line.startsWith('c:provisional:A01-R1:')
    // **15 October 2026 (stage K5): one line outside its own moves, by an engine rule, and is pinned.** The opening holder of
    // possession is entailed by the start's awardee (register version 12, PS1 entailedBy), so naming the realization moves
    // game::PS1 from the governed open choice to the realization's awardee. Every other line is as it was.
    const ps1 = (line: string) => line.startsWith('game::PS1|')
    assert.deepEqual(lines(named).filter((line: string) => !own(line) && !ps1(line)), lines(unnamed).filter((line: string) => !ps1(line)))
    assert.deepEqual(lines(unnamed).filter(ps1), ['game::PS1|open|FREE(a)||null'])
    assert.deepEqual(lines(named).filter(ps1), ['game::PS1|derived|RESOLVED:ENTAILED||"ROLE_HOLDER_BUILDING"'])
    // Its transitions (stage K5, 63 lines on rows T1a-T7 of eight elements) are pinned in starts-and-restarts.unit.ts.
    const transition = (line: string) => line.startsWith('c:provisional:A01-R1:A01-R1-T')
    assert.equal(lines(named).filter(transition).length, 63)
    assert.deepEqual(lines(named).filter((line: string) => own(line) && !transition(line)), [
        // 15 October 2026 (stage K6): the pressure reference's lines (its function line an established absence, as the targets'
        // are) and the two starting placements' fields, each placement re-established at the build-out episode's beginnings.
        // The targets' depth and relations add no line of their own: they bound the possession game's target lines.
        'c:provisional:A01-R1:A01-R1-S2-1::S3|derived|RESOLVED:ENTAILED||"line"',
        'c:provisional:A01-R1:A01-R1-S2-1::S4|failed|NOT_AUTHORED|not constrained|null',
        'c:provisional:A01-R1:A01-R1-S2-1::S5|derived|RESOLVED:ENTAILED||{"term":"own end (of team T)","forTeam":"ROLE_HOLDER_BUILDING","offsetM":{"from":20,"to":20},"asAuthored":"20 m from the building team\'s end line"}',
        'c:provisional:A01-R1:A01-R1-S2-1::S6|derived|RESOLVED:ENTAILED||{"term":"full extent (of an axis)","asAuthored":"across the area, touchline to touchline"}',
        'c:provisional:A01-R1:A01-R1-P8-1::P9|derived|RESOLVED:ENTAILED||"ROLE_HOLDER_BUILDING"',
        'c:provisional:A01-R1:A01-R1-P8-2::P9|derived|RESOLVED:ENTAILED||"ROLE_HOLDER_PRESSING"',
        'c:provisional:A01-R1:A01-R1-P8-1::P10|derived|RESOLVED:ENTAILED||{"term":"beyond X (for team T)","of":{"structuralRef":{"contractId":"provisional:A01-R1","itemId":"A01-R1-S2-1"},"asAuthored":"the pressure reference"},"forTeam":"ROLE_HOLDER_PRESSING","asAuthored":"short of the pressure/progression line"}',
        'c:provisional:A01-R1:A01-R1-P8-2::P10|derived|RESOLVED:ENTAILED||{"term":"beyond X (for team T)","of":{"structuralRef":{"contractId":"provisional:A01-R1","itemId":"A01-R1-S2-1"},"asAuthored":"the pressure reference"},"forTeam":"ROLE_HOLDER_BUILDING","asAuthored":"beyond the pressure reference"}',
        'c:provisional:A01-R1:A01-R1-P8-1::P10a|derived|RESOLVED:ENTAILED||"CONDITIONAL_RESET"',
        'c:provisional:A01-R1:A01-R1-P8-2::P10a|derived|RESOLVED:ENTAILED||"CONDITIONAL_RESET"',
        'c:provisional:A01-R1:A01-R1-P8-1::P10b|derived|RESOLVED:ENTAILED||"BUILD_OUT_EPISODE"',
        'c:provisional:A01-R1:A01-R1-P8-2::P10b|derived|RESOLVED:ENTAILED||"BUILD_OUT_EPISODE"',
        // 17 October 2026 (stage M2): the occurrence that also counts as the primary event for the pressing role (his reply filed 19
        // October 2026, item 2), its four fields - the team carried from the selector, the trigger, and his control and exclusion.
        'c:provisional:A01-R1:A01-R1-V27-1::V28|derived|RESOLVED:ENTAILED||"ROLE_HOLDER_PRESSING"',
        'c:provisional:A01-R1:A01-R1-V27-1::V29|derived|RESOLVED:ENTAILED||"POSSESSION_CHANGE"',
        'c:provisional:A01-R1:A01-R1-V27-1::V30|derived|RESOLVED:ENTAILED||"genuinely establishes possession"',
        'c:provisional:A01-R1:A01-R1-V27-1::V31|derived|RESOLVED:ENTAILED||"a contested touch, deflection, or loose ball"',
        'c:provisional:A01-R1:A01-R1-B1-1::B2|derived|RESOLVED:ENTAILED||"BUILDING"',
        'c:provisional:A01-R1:A01-R1-B1-2::B2|derived|RESOLVED:ENTAILED||"PRESSING"',
        'c:provisional:A01-R1:A01-R1-B1-1::B3|derived|RESOLVED:ENTAILED||"COACH_CALLS"',
        'c:provisional:A01-R1:A01-R1-B1-2::B3|derived|RESOLVED:ENTAILED||"COACH_CALLS"',
        // 15 October 2026 (stage K4): the two reassignments of his 18 October RD-1 answer, each element's three fields. The
        // counts by role (P2) and the keeper (P3) add no line: SD-97 enumerates none for a team nothing individuates, and
        // the roster reads them at assembly (allocation.unit.ts).
        'c:provisional:A01-R1:A01-R1-B4-1::B5|derived|RESOLVED:ENTAILED||"BUILDING"',
        'c:provisional:A01-R1:A01-R1-B4-2::B5|derived|RESOLVED:ENTAILED||"BUILDING"',
        'c:provisional:A01-R1:A01-R1-B4-1::B6|derived|RESOLVED:ENTAILED||"P3"',
        'c:provisional:A01-R1:A01-R1-B4-2::B6|derived|RESOLVED:ENTAILED||"P2"',
        'c:provisional:A01-R1:A01-R1-B4-1::B7|derived|RESOLVED:ENTAILED||1',
        // Re-pointed 17 October 2026 (stage M4): the outfield reassignment's count is relative (register B7 version 2, his reply filed
        // 19 October 2026, item 3 F), derived as written and resolved at assembly from each block's own teams (allocation.unit.ts).
        'c:provisional:A01-R1:A01-R1-B4-2::B7|derived|RESOLVED:ENTAILED||{"keepsCountOf":"BUILDING"}',
        // 17 October 2026 (stage M1): the roles' credit bounds (row B8, register version 14), his reply filed 19 October 2026, item 1
        // and item 3 C - the building role's confined to the build-out episode, the pressing role's stated as the whole game.
        'c:provisional:A01-R1:A01-R1-B1-1::B8|derived|RESOLVED:ENTAILED||"BUILD_OUT_EPISODE"',
        'c:provisional:A01-R1:A01-R1-B1-2::B8|derived|RESOLVED:ENTAILED||"WHOLE_GAME"',
    ])
    // Two checks move since stage K5, both by what the transitions establish: the build-out episode can begin (C58), and the
    // coach's restart locations are owed to realization. A third since stage K6 (15 October 2026): the positions stated relative
    // to the pressure reference and to the teams are owed to realization (GA-RELATIVE-PLACEMENT, which passes with no applicable
    // instance where the realization is not named).
    // A fourth since 22 October 2026 (GA-PARTICIPANTS-PRESENT, his reply filed 25 October 2026, item 6): the realization's takers, start
    // placements, roles and reassignment name participants, whose presence is owed to the instantiated teams.
    const moved = (result: any) => result.gates.gateA.checks.map((c: any) => `${c.checkId}|${c.verdict}`)
    assert.deepEqual(
        moved(named).filter((x: string, i: number) => x !== moved(unnamed)[i]),
        ['GA-EPISODE-REACHABLE|PASS', 'GA-PARTICIPANTS-PRESENT|DEFERRED_TO_REALIZATION', 'GA-RELATIVE-PLACEMENT|DEFERRED_TO_REALIZATION', 'GA-TRANSITION-COHERENCE|DEFERRED_TO_REALIZATION'],
    )
    assert.deepEqual(
        moved(unnamed).filter((x: string, i: number) => x !== moved(named)[i]),
        ['GA-EPISODE-REACHABLE|FAIL', 'GA-PARTICIPANTS-PRESENT|PASS', 'GA-RELATIVE-PLACEMENT|PASS', 'GA-TRANSITION-COHERENCE|PASS'],
    )
    assert.deepEqual(
        named.versions.objects.map((o: any) => o.id).filter((id: string) => !unnamed.versions.objects.some((u: any) => u.id === id)),
        ['provisional:A01-R1'],
    )
})

test('key identity (TEST-ONLY item on a copy): the category reaches the support entry and the fixture whole, through the real chain', () => {
    // On a copy holding the TEST-ONLY item ALONE since 15 October 2026 (stage K3): A01-R1's own items now establish role
    // blocks, which would make this a two-block game and give the role lines categorized support of their own — pinned in
    // role-blocks.unit.ts. This test is about one item's category reaching its entry, so the item stands alone.
    const alone = file()
    alone.realizations[0].items = [testItem()]
    const [realization] = loadProvisionalRealizations(alone)
    const { activity, fixture } = buildActivityFromKnowledge(['GF2', 'tl-v0-constraint-wide-zone-advantage'], session as any, { alter: contracts => contracts.push(realization) })
    assert.equal(activity.outcome, 'served', 'a re-assertion of what the game already holds changes nothing a coach is told')
    const entries = (fixture as any).status.derived.filter((e: any) => (e.support ?? []).some((s: any) => s.itemId === 'A01-R1-TEST-ONLY-1'))
    assert.deepEqual(entries.map((e: any) => e.lineId), ['c:restated:GF2:GF2-08.c::J4'])
    assert.deepEqual(entries[0].support, [{ kind: 'CONTRACT_ITEM', contractId: 'provisional:A01-R1', itemId: 'A01-R1-TEST-ONLY-1', relation: 'ENTAILS', category: PROVISIONAL_REALIZATION_CHOICE }])
    // A canonical item's entry is untouched: no other support entry in the game carries a category.
    const categorized = (fixture as any).status.derived.flatMap((e: any) => e.support ?? []).filter((s: any) => s.category)
    assert.equal(categorized.length, 1)
})

test('the review page\'s provisional list reads the category from the items derivation received', () => {
    const record = learningGoalAuthorizations().find(r => r.learningGoalId === 'A01')!
    const production = authorizationLists(record, provisionalRealizationNamed('A01-R1'))
    // Empty at landing; since 15 October 2026 (stage K3) the list reads A01-R1's three role-block items, each in his words.
    assert.deepEqual(
        production.provisionalChoices.filter(e => e.from === 'provisional realization').map(e => [e.sources, e.citedAs, e.words]),
        provisionalRealizationNamed('A01-R1')!.items.map((item: any) => [[`provisional:A01-R1::${item.itemId}`], item.citedAs, item.words]),
    )
    const [realization] = loadProvisionalRealizations(withItems(testItem()))
    const listed = authorizationLists(record, realization).provisionalChoices.filter(e => e.from === 'provisional realization' && e.sources[0].endsWith('TEST-ONLY-1'))
    assert.deepEqual(listed, [
        { from: 'provisional realization', label: 'TEST-ONLY: a provisional choice', words: 'TEST-ONLY: words of his would stand here', citedAs: 'TEST-ONLY', sources: ['provisional:A01-R1::A01-R1-TEST-ONLY-1'], status: null, gaps: [], note: null },
    ])
    // Read BY the category: an item without it (only reachable past the loader) is not listed as his choice.
    const uncategorized = { ...realization, items: realization.items.map(item => ({ ...item, category: undefined })) }
    assert.ok(!authorizationLists(record, uncategorized as any).provisionalChoices.some(e => e.from === 'provisional realization'))
    // And on the real chain: A01 behind its record, with a copy of the realization carrying the item, lists it.
    const built = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session } as any, recordsBehindGaps() as any, {
        alter: contracts => {
            const copy: any = contracts.find(c => c.contractId === 'provisional:A01-R1')
            // By its id since stage K3 (15 October 2026): the copy's first item is now A01-R1's own, not the TEST-ONLY one.
            copy.items.push({ ...realization.items.find(item => item.itemId === 'A01-R1-TEST-ONLY-1')! })
        },
    })
    assert.ok(((built.activity.account as any).authorizationLists.provisionalChoices as any[]).some(e => e.sources[0] === 'provisional:A01-R1::A01-R1-TEST-ONLY-1'))
})

const OURS = 'realization-choices-a01-r1.json'
/** Reads the knowledge files, handing a TEST-ONLY copy of one to `alter` first. The files are never written. */
const reading = (alter: (name: string, contents: any) => void) => (name: string) => {
    const contents = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, name), 'utf8'))
    alter(name, contents)
    return contents
}
/**
 * The three entries the file is for (its note) stood here on a TEST-ONLY copy until 15 October 2026 (stage K6), when his 18 October
 * item 3 gave the zones their depths and they joined the production file; the tests below read the production file since.
 */
const asFiled = (_name: string, _contents: any) => undefined

test('production: A01 reads the game form\'s file, the context\'s and its realization\'s, which replaces the targets\' noun and the scoring kind', () => {
    const supplied: any = suppliedRealizationFor(selectFor('A01', null))
    assert.deepEqual(supplied.from, ['a04-realization-choices.json', 'realization-choices-rpc-001.json', OURS])
    // Re-pointed 15 October 2026 (stage K6): the three replacements the file was for, by declaration (pinned in the next test).
    assert.deepEqual(supplied.replaced.map((r: any) => r.lineId), ['c:restated:GF2:GF2-03.e::S3', 'c:restated:GF2:GF2-03.f::S3', 'game::V1'])
    // Re-pointed 15 October 2026 (stage K5): the file is no longer empty — it holds the seven COACH_DECIDES stand-ins of the
    // coach's restart locations and end-line method, and the withdrawal of the game form's initial-holder choice (pinned in
    // starts-and-restarts.unit.ts). What this pinned still holds: no depth, position or target value (RD-3, stage K6), and
    // nothing replaces a game-form entry.
    const choices = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, OURS), 'utf8')).choices
    // Since stage K6 the targets' noun and the scoring kind too; still no depth, distance or position (those are A01-R1's items,
    // for the 40 x 30 m prototype only).
    const targetEntry = (c: any) => c.replaces === 'a04-realization-choices.json' && ['c:restated:GF2:GF2-03.e::S3', 'c:restated:GF2:GF2-03.f::S3', 'game::V1'].includes(c.lineId)
    assert.ok(choices.every((c: any) => c.withdraws || targetEntry(c) || (typeof c.value?.coachDecides === 'string' && /::T[45]$/.test(c.lineId))), 'no depth, position or target value in the choices')
    assert.deepEqual(supplied.withdrawn.map((w: any) => [w.lineId, w.withdrawnFrom]), [['game::PS1', 'a04-realization-choices.json']])
})

test('the realization\'s choices replace the game form\'s only by declaration; the replacements are recorded and the rest is carried', () => {
    const selection = selectFor('A01', null)
    const supplied: any = suppliedRealizationFor(selection, reading(asFiled))
    assert.deepEqual(supplied.from, ['a04-realization-choices.json', 'realization-choices-rpc-001.json', OURS])
    assert.deepEqual(
        supplied.replaced.map((r: any) => [r.lineId, r.replacedFrom, r.replacedValue, r.value]),
        [
            ['c:restated:GF2:GF2-03.e::S3', 'a04-realization-choices.json', 'line', 'zone'],
            ['c:restated:GF2:GF2-03.f::S3', 'a04-realization-choices.json', 'line', 'zone'],
            ['game::V1', 'a04-realization-choices.json', 'line_crossed', 'target_zone_entered'],
        ],
    )
    // One answer per line, the replacing one keeping its declaration and category into the realization record.
    assert.equal(new Set(supplied.choices.map((c: any) => c.lineId)).size, supplied.choices.length)
    assert.ok(supplied.choices.filter((c: any) => c.replaces).every((c: any) => c.category === PROVISIONAL_REALIZATION_CHOICE))
    // Carried: the game form's two team instantiations (GF2-14.a), its end bindings, the ball. (Its initial possession holder
    // was carried too until 15 October 2026, stage K5: the realization withdraws it by declaration, the start's awardee
    // entailing the line — pinned in starts-and-restarts.unit.ts.)
    assert.ok(!supplied.choices.some((c: any) => c.lineId === 'game::PS1'))
    assert.deepEqual(supplied.withdrawn.map((w: any) => w.lineId), ['game::PS1'])
    assert.deepEqual(supplied.instantiations.map((i: any) => i.classId), ['c:restated:GF2:GF2-14.a', 'c:restated:GF2:GF2-14.a'])
    assert.equal(supplied.designationBindings.length, 2)
    assert.equal(supplied.satisfiedByEstablished.length, 1)
    // Every other goal and demonstration reads exactly the game form's file: no record names a realization for it.
    const demo: any = suppliedRealizationFor({ selected: [{ id: 'GF2', role: 'game form' }], contracted: ['GF2'], missing: [] })
    assert.deepEqual([demo.from, demo.replaced], [['a04-realization-choices.json'], []])
})

test('a second answer to one line, or a replacement nobody can trace, refuses the input — order never decides', () => {
    const selection = selectFor('A01', null)
    const conflicts = (alter: (name: string, contents: any) => void): string[] => {
        const supplied: any = suppliedRealizationFor(
            selection,
            reading((name, contents) => {
                alter(name, contents)
            }),
        )
        assert.equal(supplied.missingFor, null)
        return supplied.conflicts
    }
    // Re-pointed 15 October 2026 (stage K5): the file holds entries of its own before the TEST-ONLY target entries now, so each
    // is found by its line rather than by position.
    const entry = (contents: any, lineId: string) => contents.choices.find((c: any) => c.lineId === lineId)
    assert.ok(conflicts((name, contents) => name === OURS && delete entry(contents, 'game::V1').replaces).some(c => c.includes(`both a04-realization-choices.json and ${OURS} close game::V1`)))
    assert.ok(conflicts((name, contents) => name === OURS && contents.choices.push({ lineId: 'game::E4', value: 1, replaces: 'a04-realization-choices.json', because: 'TEST-ONLY' })).some(c => c.includes('has no entry for that line')))
    assert.ok(conflicts((name, contents) => name === OURS && (entry(contents, 'c:restated:GF2:GF2-03.e::S3').replaces = 'realization-choices-rpc-001.json')).some(c => c.includes('and the line is closed by a04-realization-choices.json')))
    assert.ok(conflicts((name, contents) => name === 'a04-realization-choices.json' && (contents.choices[0].replaces = 'x')).some(c => c.includes('only a provisional realization')))
    assert.ok(conflicts((name, contents) => name === OURS && contents.instantiations.push({ classId: 'c:restated:GF2:GF2-14.a', member: {}, because: 'TEST-ONLY' })).some(c => c.includes('members are never doubled')))
    // K2 review, 15 October 2026: the realization's file may not replace ITS OWN entry. Two entries of one file for one
    // line, the second declaring `replaces` with that file's own name, were resolved by order (the later one stood) with
    // no conflict recorded — exactly what the declaration rule exists to refuse.
    assert.ok(conflicts((name, contents) => name === OURS && contents.choices.push({ lineId: 'game::V1', value: 'line_crossed', replaces: OURS, because: 'TEST-ONLY' })).some(c => c.includes('replaces its own entry')))
})

test('A01 with the From Goal Kicks practice situation is refused at knowledge with one sentence, naming the realization', () => {
    const refused: any = buildActivity({ kind: 'learning-goal', goalId: 'A01', situationId: 'A01-02', session } as any)
    assert.deepEqual([refused.outcome, refused.stage], ['refused', 'knowledge'])
    // DRAFT coach sentence (approved-coach-wording.json is empty), 15 October 2026.
    assert.equal(refused.summary, "This goal's first activity was not designed for the chosen practice situation, so no activity can be built for it.")
    assert.ok(refused.reasons[0].startsWith('the provisional realization A01-R1 named by the authorization record of A01 was not designed for the practice situation A01-02 (OUR_READING)'))
    // Without the situation A01 is not refused for it. Re-pointed 15 October 2026 (stage K6): the record names no gap now, so it
    // gets past knowledge (its next stop is pinned in target-placement.unit.ts).
    const plain: any = buildActivity({ kind: 'learning-goal', goalId: 'A01', session } as any)
    assert.notEqual(plain.stage, 'knowledge', JSON.stringify(plain.reasons))
})

/**
 * **His six confirmations, recorded in his letters — stage M4, 17 October 2026 (design step L11).** His reply filed 19 October 2026,
 * item 3 A-F ("These are approved for the current activity configuration."), answering the six readings our 18 October email put to
 * him. Each item that carried one now quotes his letter in its words and cites it, so the review page's provisional list shows it; no
 * fitNote still calls its reading one awaiting his confirmation, and no value uses his "using the approved M3 capability" as our gloss.
 */
test('(M4, L11) confirmations A-F: his letters on the items they answer, shown in the provisional list; no reading left awaiting him', () => {
    const items = new Map(provisionalRealizationNamed('A01-R1')!.items.map(item => [item.itemId, item as any]))
    const CONFIRMED: [string, string, string][] = [
        ['A01-R1-T4-3', 'item 3 A', 'Yes. The coach determines both, with the understanding that ordinary restarts should preserve meaningful game relationships rather than create an automatic scoring shortcut.'],
        ['A01-R1-T5-3', 'item 3 A', 'Yes. The coach determines both, with the understanding that ordinary restarts should preserve meaningful game relationships rather than create an automatic scoring shortcut.'],
        ['A01-R1-T3-3', 'item 3 B', 'Yes. Any player from the team awarded the end-line restart may take it, consistent with that safeguard.'],
        ['A01-R1-T7-3', 'item 3 C', 'Yes. The build-out scoring episode ends. Ordinary play may continue following the restart, but build-out scoring eligibility does not return until a new deliberate goalkeeper restart.'],
        ['A01-R1-P8-1', 'item 3 D', 'Yes. It includes the goalkeeper and outfield players.'],
        ['A01-R1-S6-1', 'item 3 E', 'Yes. It extends across the full width of the playing area.'],
        ['A01-R1-B7-2', 'item 3 F', 'With 5 outfield players plus a goalkeeper against 5 outfield players, only the goalkeeper changes teams at a role exchange. No additional outfield player transfer is required.'],
    ]
    for (const [id, item, words] of CONFIRMED) {
        const entry = items.get(id)!
        assert.ok(String(entry.words).endsWith(words), `${id}: his ${item} words close its words`)
        assert.ok(String(entry.citedAs).endsWith(`his reply filed 19 October 2026, ${item}`), `${id}: ${entry.citedAs}`)
        assert.ok(String(entry.basisEvidence).includes(words), `${id}: and its basis quotes them`)
    }
    for (const item of items.values()) {
        assert.ok(!String(item.fitNote ?? '').startsWith('OUR READING, for his one-line confirmation'), `${item.itemId} still awaits him`)
        assert.ok(!JSON.stringify(item.value).includes('M3 capability'), `${item.itemId}: his phrase is not our gloss`)
    }
    // The review page's provisional list reads exactly these words and citations.
    const lists = authorizationLists(learningGoalAuthorizations().find(r => r.learningGoalId === 'A01')!, provisionalRealizationNamed('A01-R1')!)
    for (const [id, , words] of CONFIRMED) {
        const shown = lists.provisionalChoices.find(entry => entry.sources.includes(`provisional:A01-R1::${id}`))!
        assert.ok(String(shown.words).endsWith(words) && String(shown.citedAs).includes('19 October 2026'), id)
    }
    // His 3 A understanding bounds the coach's end-line choice in the realization choices, in our gerund form (DRAFT, labelled there).
    const choices = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, 'realization-choices-a01-r1.json'), 'utf8')).choices
    for (const line of ['T1-6::T4', 'T1-6::T5', 'T1-7::T4', 'T1-7::T5']) {
        const choice = choices.find((c: any) => c.lineId === `c:provisional:A01-R1:A01-R1-${line}`)
        assert.equal(choice.value.coachDecides, 'preserving meaningful game relationships rather than creating an automatic scoring shortcut', line)
        assert.ok(choice.because.includes('CONFIRMED in his reply filed 19 October 2026, item 3 A') && choice.because.includes('OUR gerund form'), line)
    }
})

console.log(`provisional-realization.unit.ts — ${passed} passed`)
