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
 *      provisional list reads it (TEST-ONLY items on copies — A01-R1 is empty at landing);
 *   5. an empty realization moves nothing (lines, checks, games) — only the provenance stamp names it;
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

test('one home: the file loads, A01-R1 is labelled his provisional choice, empty at landing, and only A01\'s record names it', () => {
    const [realization, ...others] = loadProvisionalRealizations()
    assert.equal(others.length, 0)
    assert.deepEqual([realization.provisionalId, realization.contractId, realization.category, realization.realizes, realization.items.length, realization.declarations.length], ['A01-R1', 'provisional:A01-R1', PROVISIONAL_REALIZATION_CHOICE, 'RPC-001', 0, 0])
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

test('an empty realization moves no line, no check and no game: only the provenance stamp names it', () => {
    const record = learningGoalAuthorizations().find(r => r.learningGoalId === 'A01')!
    const selected = selectFor('A01', null).selected
    const run = (authorization: any) => runDerivation(derivationInputFor({ selected, authorization })) as any
    const named = run(record)
    const unnamed = run({ ...record, provisionalRealization: undefined })
    assert.ok(!isStampedHalt(named) && !isStampedHalt(unnamed))
    const lines = (result: any) => result.resolution.map((e: any) => `${e.lineId}|${e.state}|${e.verdict ?? ''}|${e.reason ?? ''}|${JSON.stringify(e.value ?? null)}`)
    assert.deepEqual(lines(named), lines(unnamed))
    assert.deepEqual(
        named.gates.gateA.checks.map((c: any) => `${c.checkId}|${c.verdict}`),
        unnamed.gates.gateA.checks.map((c: any) => `${c.checkId}|${c.verdict}`),
    )
    assert.deepEqual(
        named.versions.objects.map((o: any) => o.id).filter((id: string) => !unnamed.versions.objects.some((u: any) => u.id === id)),
        ['provisional:A01-R1'],
    )
})

test('key identity (TEST-ONLY item on a copy): the category reaches the support entry and the fixture whole, through the real chain', () => {
    const [realization] = loadProvisionalRealizations(withItems(testItem()))
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
    assert.ok(!production.provisionalChoices.some(e => e.from === 'provisional realization'), 'A01-R1 is empty at landing')
    const [realization] = loadProvisionalRealizations(withItems(testItem()))
    const listed = authorizationLists(record, realization).provisionalChoices.filter(e => e.from === 'provisional realization')
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
            copy.items.push({ ...realization.items[0] })
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
 * The three entries the file is for (its note): measured to move the one path that realizes A01 while the zones have no
 * depth (RD-3), so they land with stage K6 and stand here only on a TEST-ONLY copy.
 */
const theTargetEntries = (name: string, contents: any) => {
    if (name !== OURS) return
    contents.choices.push(
        { lineId: 'c:restated:GF2:GF2-03.e::S3', value: 'zone', replaces: 'a04-realization-choices.json', category: PROVISIONAL_REALIZATION_CHOICE, because: 'TEST-ONLY' },
        { lineId: 'c:restated:GF2:GF2-03.f::S3', value: 'zone', replaces: 'a04-realization-choices.json', category: PROVISIONAL_REALIZATION_CHOICE, because: 'TEST-ONLY' },
        { lineId: 'game::V1', value: 'target_zone_entered', replaces: 'a04-realization-choices.json', category: PROVISIONAL_REALIZATION_CHOICE, because: 'TEST-ONLY' },
    )
}

test('production: A01 reads the game form\'s file, the context\'s and its realization\'s, which is empty at landing and replaces nothing', () => {
    const supplied: any = suppliedRealizationFor(selectFor('A01', null))
    assert.deepEqual(supplied.from, ['a04-realization-choices.json', 'realization-choices-rpc-001.json', OURS])
    assert.deepEqual(supplied.replaced, [])
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, OURS), 'utf8')).choices, [], 'no value is written before RD-3')
})

test('the realization\'s choices replace the game form\'s only by declaration; the replacements are recorded and the rest is carried', () => {
    const selection = selectFor('A01', null)
    const supplied: any = suppliedRealizationFor(selection, reading(theTargetEntries))
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
    // Carried: the game form's initial possession holder, its two team instantiations (GF2-14.a), its end bindings, the ball.
    assert.ok(supplied.choices.some((c: any) => c.lineId === 'game::PS1'))
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
                theTargetEntries(name, contents)
                alter(name, contents)
            }),
        )
        assert.equal(supplied.missingFor, null)
        return supplied.conflicts
    }
    assert.ok(conflicts((name, contents) => name === OURS && delete contents.choices[2].replaces).some(c => c.includes(`both a04-realization-choices.json and ${OURS} close game::V1`)))
    assert.ok(conflicts((name, contents) => name === OURS && contents.choices.push({ lineId: 'game::E4', value: 1, replaces: 'a04-realization-choices.json', because: 'TEST-ONLY' })).some(c => c.includes('has no entry for that line')))
    assert.ok(conflicts((name, contents) => name === OURS && (contents.choices[0].replaces = 'realization-choices-rpc-001.json')).some(c => c.includes('and the line is closed by a04-realization-choices.json')))
    assert.ok(conflicts((name, contents) => name === 'a04-realization-choices.json' && (contents.choices[0].replaces = 'x')).some(c => c.includes('only a provisional realization')))
    assert.ok(conflicts((name, contents) => name === OURS && contents.instantiations.push({ classId: 'c:restated:GF2:GF2-14.a', member: {}, because: 'TEST-ONLY' })).some(c => c.includes('members are never doubled')))
})

test('A01 with the From Goal Kicks practice situation is refused at knowledge with one sentence, naming the realization', () => {
    const refused: any = buildActivity({ kind: 'learning-goal', goalId: 'A01', situationId: 'A01-02', session } as any)
    assert.deepEqual([refused.outcome, refused.stage], ['refused', 'knowledge'])
    // DRAFT coach sentence (approved-coach-wording.json is empty), 15 October 2026.
    assert.equal(refused.summary, "This goal's first activity was not designed for the chosen practice situation, so no activity can be built for it.")
    assert.ok(refused.reasons[0].startsWith('the provisional realization A01-R1 named by the authorization record of A01 was not designed for the practice situation A01-02 (OUR_READING)'))
    // Without the situation A01 is refused where it was: the record's gaps.
    const plain: any = buildActivity({ kind: 'learning-goal', goalId: 'A01', session } as any)
    assert.deepEqual([plain.stage, plain.summary], ['knowledge', "This goal's activity depends on set-up decisions and engine capabilities that are not in place yet, so no activity can be built for it."])
})

console.log(`provisional-realization.unit.ts — ${passed} passed`)
